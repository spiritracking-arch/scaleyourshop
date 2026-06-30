import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import type { ApiResponse, TransferOptions } from '@/types'
import { DEFAULT_TRANSFER_OPTIONS, PLAN_LIMITS } from '@/types'
import { sendQuotaWarningEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req)
    if (!tenantId) return NextResponse.json<ApiResponse>({ error: 'Missing tenant' }, { status: 401 })

    const transfers = await prisma.transfer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        sourceShop: { select: { id: true, name: true, url: true } },
        targetShop: { select: { id: true, name: true, url: true, lang: true } },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { level: true, message: true, createdAt: true },
        },
      },
    })

    return NextResponse.json<ApiResponse>({ data: transfers })
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req)
    if (!tenantId) return NextResponse.json<ApiResponse>({ error: 'Missing tenant' }, { status: 401 })

    const body = await req.json()
    const {
      sourceShopId,
      targetShopId,
      categoryId,
      categoryLabel,
      totalProducts,
      options,
    } = body as {
      sourceShopId: string
      targetShopId: string
      categoryId?: string
      categoryLabel?: string
      totalProducts?: number
      options?: Partial<TransferOptions>
    }

    if (!sourceShopId || !targetShopId) {
      return NextResponse.json<ApiResponse>(
        { error: 'sourceShopId et targetShopId requis' },
        { status: 400 }
      )
    }

    const [source, target] = await Promise.all([
      prisma.shop.findUnique({ where: { id: sourceShopId, tenantId } }),
      prisma.shop.findUnique({ where: { id: targetShopId, tenantId } }),
    ])

    if (!source) return NextResponse.json<ApiResponse>({ error: 'Boutique source introuvable' }, { status: 404 })
    if (!target) return NextResponse.json<ApiResponse>({ error: 'Boutique cible introuvable' }, { status: 404 })

    const running = await prisma.transfer.findFirst({
      where: { tenantId, status: 'RUNNING' },
    })
    if (running) {
      return NextResponse.json<ApiResponse>(
        { error: 'Un transfert est déjà en cours. Attendez sa fin avant d\'en lancer un nouveau.' },
        { status: 409 }
      )
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    const planLimits = PLAN_LIMITS[tenant?.plan || 'STARTER']

    // quotaCap : si renseigné, le worker doit s'arrêter après ce nombre de produits réussis,
    // même si la catégorie source en contient davantage (quota restant insuffisant).
    let quotaCap: number | undefined

    if (planLimits.monthlyProducts !== Infinity) {
      let used = 0

      if (planLimits.quotaType === 'lifetime') {
        const totalUsage = await prisma.transfer.aggregate({
          where: { tenantId },
          _sum: { doneProducts: true },
        })
        used = totalUsage._sum.doneProducts || 0
      } else {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const monthlyUsage = await prisma.transfer.aggregate({
          where: { tenantId, createdAt: { gte: startOfMonth } },
          _sum: { doneProducts: true },
        })
        used = monthlyUsage._sum.doneProducts || 0
      }

      const requested = totalProducts || 0
      const periodLabel = planLimits.quotaType === 'lifetime' ? 'au total' : 'ce mois'
      const remaining = planLimits.monthlyProducts - used

      if (remaining <= 0) {
        const upgradeHint = tenant?.plan === 'BUSINESS'
          ? "Contactez-nous pour un volume supérieur (contact@scaleyourshop.app)."
          : `Passez à un plan supérieur${planLimits.quotaType === 'monthly' ? ' ou attendez le renouvellement' : ''}.`
        return NextResponse.json<ApiResponse>(
          {
            error: `Quota déjà atteint : ${used}/${planLimits.monthlyProducts} produits utilisés ${periodLabel}. ${upgradeHint}`,
          },
          { status: 403 }
        )
      }

      if (requested > remaining) {
        quotaCap = remaining
      }

      const willProcess = quotaCap ?? requested
      const beforePct = used / planLimits.monthlyProducts
      const afterPct = (used + willProcess) / planLimits.monthlyProducts
      if (beforePct < 0.8 && afterPct >= 0.8 && tenant?.email) {
        sendQuotaWarningEmail(tenant.email, {
          used: used + willProcess,
          limit: planLimits.monthlyProducts,
          plan: tenant.plan,
        }).catch(() => {})
      }
    }

    const mergedOptions = {
      ...DEFAULT_TRANSFER_OPTIONS,
      ...options,
      ...(quotaCap !== undefined ? { quotaCap } : {}),
    }

    const transfer = await prisma.transfer.create({
      data: {
        tenantId,
        sourceShopId,
        targetShopId,
        categoryId: categoryId || null,
        categoryLabel: categoryLabel || null,
        totalProducts: totalProducts || 0,
        status: 'PENDING',
        options: mergedOptions,
      },
    })

    await prisma.transferLog.create({
      data: {
        transferId: transfer.id,
        level: 'INFO',
        message: `Transfert créé — ${source.name} → ${target.name} · Catégorie: ${categoryLabel || 'Tout le catalogue'}`
          + (quotaCap !== undefined ? ` (limité à ${quotaCap} produit(s) — quota restant)` : ''),
      },
    })

    fetch(`${process.env.INTERNAL_APP_URL || 'http://localhost:3030'}/api/transfers/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({ transferId: transfer.id }),
    }).catch(err => console.error('Worker launch error:', err))

    return NextResponse.json<ApiResponse>({
      data: { id: transfer.id, status: transfer.status },
      message: 'Transfert lancé',
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json<ApiResponse>({ error: message }, { status: 500 })
  }
}
