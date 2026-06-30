import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/crypto'
import type { ApiResponse, ShopPlatform, ShopRole } from '@/types'
import { PLAN_LIMITS } from '@/types'

// ── GET — liste les boutiques d'un tenant ────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req)
    if (!tenantId) return NextResponse.json<ApiResponse>({ error: 'Missing tenant' }, { status: 401 })

    const shops = await prisma.shop.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        url: true,
        platform: true,
        role: true,
        lang: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json<ApiResponse>({ data: shops })
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ── POST — crée une boutique ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req)
    if (!tenantId) return NextResponse.json<ApiResponse>({ error: 'Missing tenant' }, { status: 401 })

    const body = await req.json()
    const { name, url, platform, role, lang, apiKey, apiSecret } = body as {
      name: string
      url: string
      platform: ShopPlatform
      role: ShopRole
      lang?: string
      apiKey: string
      apiSecret?: string
    }

    if (!name || !url || !platform || !role || !apiKey) {
      return NextResponse.json<ApiResponse>({ error: 'Champs manquants' }, { status: 400 })
    }

    // Vérifier que le tenant existe, sinon le créer (dev only — en prod ce sera Clerk)
    let tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          id: tenantId,
          email: `${tenantId}@dev.local`,
          name: 'Dev Tenant',
        },
      })
    }

    const cleanUrl = url.replace(/\/$/, '')

    // Dédup : réutiliser la boutique existante si même tenant + URL + rôle
    const existing = await prisma.shop.findFirst({
      where: { tenantId, url: cleanUrl, role },
    })

    // ⚠️ Vérification du quota de boutiques par plan — uniquement pour une création,
    // pas pour une mise à jour d'une boutique déjà existante (dédup ci-dessus)
    if (!existing) {
      const shopCount = await prisma.shop.count({ where: { tenantId } })
      const limits = PLAN_LIMITS[tenant.plan] ?? PLAN_LIMITS.STARTER

      if (shopCount >= limits.maxShops) {
        return NextResponse.json<ApiResponse>({
          error: `Limite de boutiques atteinte pour le plan ${tenant.plan} (${limits.maxShops} max). Passez à un plan supérieur pour en ajouter davantage.`,
        }, { status: 403 })
      }
    }

    if (existing) {
      const updated = await prisma.shop.update({
        where: { id: existing.id },
        data: {
          name,
          platform,
          lang: lang || null,
          apiKey: encrypt(apiKey),
          apiSecret: apiSecret ? encrypt(apiSecret) : null,
          status: 'ACTIVE',
        },
      })
      return NextResponse.json<ApiResponse>({
        data: {
          id: updated.id,
          name: updated.name,
          url: updated.url,
          platform: updated.platform,
          role: updated.role,
          lang: updated.lang,
          status: updated.status,
        },
        message: 'Boutique mise à jour',
      })
    }

    const shop = await prisma.shop.create({
      data: {
        tenantId,
        name,
        url: cleanUrl,
        platform,
        role,
        lang: lang || null,
        apiKey: encrypt(apiKey),
        apiSecret: apiSecret ? encrypt(apiSecret) : null,
      },
    })

    return NextResponse.json<ApiResponse>({
      data: {
        id: shop.id,
        name: shop.name,
        url: shop.url,
        platform: shop.platform,
        role: shop.role,
        lang: shop.lang,
        status: shop.status,
      },
      message: 'Boutique ajoutée avec succès',
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json<ApiResponse>({ error: message }, { status: 500 })
  }
}

// ── DELETE — supprime une boutique ───────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req)
    if (!tenantId) return NextResponse.json<ApiResponse>({ error: 'Missing tenant' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const shopId = searchParams.get('id')
    if (!shopId) return NextResponse.json<ApiResponse>({ error: 'Missing shop id' }, { status: 400 })

    await prisma.shop.delete({
      where: { id: shopId, tenantId },
    })

    return NextResponse.json<ApiResponse>({ message: 'Boutique supprimée' })
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
