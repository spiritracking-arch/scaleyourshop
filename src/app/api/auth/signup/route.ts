import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import type { ApiResponse } from '@/types'
import { PLAN_LIMITS } from '@/types'
import { sendWelcomeEmail } from '@/lib/email'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || password.length < 8) {
      return NextResponse.json<ApiResponse>(
        { error: 'Email et mot de passe (8 caractères min.) requis' },
        { status: 400 }
      )
    }

    const existing = await prisma.tenant.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json<ApiResponse>({ error: 'Un compte existe déjà avec cet email' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const tenant = await prisma.tenant.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash,
      },
    })

    const limits = PLAN_LIMITS[tenant.plan] ?? PLAN_LIMITS.STARTER
    sendWelcomeEmail(tenant.email, {
      name: tenant.name,
      plan: tenant.plan,
      monthlyProducts: limits.monthlyProducts,
      maxShops: limits.maxShops,
    }).catch(() => {})

    const token = await new SignJWT({ tenantId: tenant.id, email: tenant.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(JWT_SECRET)

    const res = NextResponse.json<ApiResponse>({
      data: { id: tenant.id, email: tenant.email, name: tenant.name },
      message: 'Compte créé',
    })

    res.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
