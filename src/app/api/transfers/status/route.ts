import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import type { ApiResponse } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req)
    if (!tenantId) return NextResponse.json<ApiResponse>({ error: 'Missing tenant' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const transferId = searchParams.get('id')
    if (!transferId) return NextResponse.json<ApiResponse>({ error: 'Missing transfer id' }, { status: 400 })

    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId, tenantId },
      include: {
        logs: {
          orderBy: { createdAt: 'asc' },
          select: { level: true, message: true, createdAt: true },
        },
        sourceShop: { select: { name: true } },
        targetShop: { select: { name: true, lang: true } },
      },
    })

    if (!transfer) return NextResponse.json<ApiResponse>({ error: 'Transfert introuvable' }, { status: 404 })

    const progress = transfer.totalProducts > 0
      ? Math.round(((transfer.doneProducts + transfer.failedProducts) / transfer.totalProducts) * 100)
      : 0

    const quotaCap = (transfer.options as Record<string, unknown>)?.quotaCap as number | undefined
    const stoppedByQuota = quotaCap !== undefined && transfer.status === 'PARTIAL' && transfer.doneProducts >= quotaCap

    return NextResponse.json<ApiResponse>({
      data: {
        id: transfer.id,
        status: transfer.status,
        progress,
        totalProducts: transfer.totalProducts,
        doneProducts: transfer.doneProducts,
        failedProducts: transfer.failedProducts,
        sourceShop: transfer.sourceShop.name,
        targetShop: transfer.targetShop.name,
        targetLang: transfer.targetShop.lang,
        logs: transfer.logs.map(l => l.message),
        startedAt: transfer.startedAt,
        finishedAt: transfer.finishedAt,
        quotaCap,
        stoppedByQuota,
      },
    })

  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
