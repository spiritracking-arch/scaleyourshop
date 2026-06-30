import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import type { ApiResponse } from '@/types'
import { PLAN_LIMITS } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req)
    if (!tenantId) return NextResponse.json<ApiResponse>({ error: 'Missing tenant' }, { status: 401 })

    const [shops, transfers, tenant] = await Promise.all([
      prisma.shop.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.transfer.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          sourceShop: { select: { name: true } },
          targetShop: { select: { name: true, lang: true } },
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { message: true },
          },
        },
      }),
      prisma.tenant.findUnique({ where: { id: tenantId } }),
    ])

      const planLimits = PLAN_LIMITS[tenant?.plan || 'FREE'] || PLAN_LIMITS.FREE

      let quotaUsed = 0
      if (planLimits.quotaType === 'lifetime') {
        const totalUsage = await prisma.transfer.aggregate({
          where: { tenantId },
          _sum: { doneProducts: true },
        })
        quotaUsed = totalUsage._sum.doneProducts || 0
      } else {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        const monthlyUsage = await prisma.transfer.aggregate({
          where: { tenantId, createdAt: { gte: startOfMonth } },
          _sum: { doneProducts: true },
        })
        quotaUsed = monthlyUsage._sum.doneProducts || 0
      }

    const totalProductsTransferred = transfers.reduce((sum, t) => sum + t.doneProducts, 0)
    const activeShops = shops.filter(s => s.role === 'TARGET').length
    const totalTransfers = transfers.length
    const successfulTransfers = transfers.filter(t => t.status === 'DONE').length
    const successRate = totalTransfers > 0 ? Math.round((successfulTransfers / totalTransfers) * 100) : 100
    const langs = new Set(shops.filter(s => s.lang).map(s => s.lang)).size

    const transfersFormatted = transfers.map(t => ({
      id: t.id,
      category: t.categoryLabel || 'Tout le catalogue',
      source: t.sourceShop.name,
      target: t.targetShop.name,
      targetLang: t.targetShop.lang,
      status: t.status,
      progress: t.totalProducts > 0
        ? Math.round(((t.doneProducts + t.failedProducts) / t.totalProducts) * 100)
        : 0,
      totalProducts: t.totalProducts,
      doneProducts: t.doneProducts,
      failedProducts: t.failedProducts,
      lastLog: t.logs[0]?.message || null,
      createdAt: t.createdAt,
      startedAt: t.startedAt,
      finishedAt: t.finishedAt,
    }))

    const shopsFormatted = shops.map(s => ({
      id: s.id,
      name: s.name,
      url: s.url,
      platform: s.platform,
      role: s.role,
      lang: s.lang,
      status: s.status,
      createdAt: s.createdAt,
    }))

    return NextResponse.json<ApiResponse>({
      data: {
        stats: {
          totalProductsTransferred,
          activeShops,
          langsCount: langs,
          successRate,
        },
        transfers: transfersFormatted,
        shops: shopsFormatted,
        plan: tenant?.plan || 'FREE',
        quotaUsed,
        quotaLimit: planLimits.monthlyProducts === Infinity ? null : planLimits.monthlyProducts,
        quotaType: planLimits.quotaType,
        shopsUsed: shops.length,
        shopsLimit: planLimits.maxShops === Infinity ? null : planLimits.maxShops,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
