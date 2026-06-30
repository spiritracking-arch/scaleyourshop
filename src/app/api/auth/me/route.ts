import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('session')?.value
    if (!token) return NextResponse.json<ApiResponse>({ error: 'Non connecté' }, { status: 401 })

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const tenantId = payload.tenantId as string

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return NextResponse.json<ApiResponse>({ error: 'Compte introuvable' }, { status: 401 })

    return NextResponse.json<ApiResponse>({
      data: { id: tenant.id, email: tenant.email, name: tenant.name, plan: tenant.plan },
    })
  } catch {
    return NextResponse.json<ApiResponse>({ error: 'Session invalide' }, { status: 401 })
  }
}
