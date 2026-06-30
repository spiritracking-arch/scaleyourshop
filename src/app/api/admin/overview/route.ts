import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import type { ApiResponse } from '@/types'

async function requireAdmin(req: NextRequest) {
  const tenantId = await getTenantId(req)
  if (!tenantId) return null
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant?.isAdmin) return null
  return tenant
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Accès refusé' }, { status: 403 })

  try {
    const [tenants, transfers, allShops, tokenAgg] = await Promise.all([
      prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          shops: { select: { id: true, role: true } },
          transfers: {
            select: { doneProducts: true, failedProducts: true, status: true, tokensUsed: true },
          },
        },
      }),
      prisma.transfer.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          tenant: { select: { email: true, name: true } },
          sourceShop: { select: { name: true } },
          targetShop: { select: { name: true, lang: true } },
        },
      }),
        prisma.shop.count(),
        prisma.transfer.aggregate({ _sum: { tokensUsed: true, doneProducts: true } }),
    ])

    const PLAN_PRICE: Record<string, number> = { STARTER: 0, GROWTH: 99, BUSINESS: 299 }

    const tenantsFormatted = tenants.map(t => ({
      id: t.id,
      email: t.email,
      name: t.name,
      plan: t.plan,
      status: t.status,
      isAdmin: t.isAdmin,
      shopsCount: t.shops.length,
      transfersCount: t.transfers.length,
      productsTransferred: t.transfers.reduce((s, tr) => s + tr.doneProducts, 0),
      tokensUsed: t.transfers.reduce((s, tr) => s + tr.tokensUsed, 0),
      mrr: t.status === 'ACTIVE' ? PLAN_PRICE[t.plan] || 0 : 0,
      createdAt: t.createdAt,
    }))

    const activeTenants = tenantsFormatted.filter(t => t.status === 'ACTIVE' && !t.isAdmin)
    const totalMRR = activeTenants.reduce((s, t) => s + t.mrr, 0)
    const planBreakdown = {
      STARTER: activeTenants.filter(t => t.plan === 'STARTER').length,
      GROWTH: activeTenants.filter(t => t.plan === 'GROWTH').length,
      BUSINESS: activeTenants.filter(t => t.plan === 'BUSINESS').length,
    }

    const transfersFormatted = transfers.map(t => ({
      id: t.id,
      tenantEmail: t.tenant.email,
      tenantName: t.tenant.name,
      category: t.categoryLabel || 'Tout le catalogue',
      source: t.sourceShop.name,
      target: t.targetShop.name,
      targetLang: t.targetShop.lang,
      status: t.status,
      totalProducts: t.totalProducts,
      doneProducts: t.doneProducts,
        failedProducts: t.failedProducts,
        tokensUsed: t.tokensUsed,
      createdAt: t.createdAt,
    }))

    return NextResponse.json<ApiResponse>({
      data: {
        stats: {
          totalTenants: tenantsFormatted.filter(t => !t.isAdmin).length,
          activeTenants: activeTenants.length,
          totalMRR,
          totalShops: allShops,
          totalTransfers: transfers.length,
          planBreakdown,
          totalTokensUsed: tokenAgg._sum.tokensUsed || 0,
          avgTokensPerProduct: tokenAgg._sum.doneProducts ? Math.round((tokenAgg._sum.tokensUsed || 0) / tokenAgg._sum.doneProducts) : 0,
        },
        tenants: tenantsFormatted,
        transfers: transfersFormatted,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
