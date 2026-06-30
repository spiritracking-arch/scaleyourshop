import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import type { ApiResponse } from '@/types'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json<ApiResponse>({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({ where: { email } })
    if (!tenant || !tenant.passwordHash) {
      return NextResponse.json<ApiResponse>({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, tenant.passwordHash)
    if (!valid) {
      return NextResponse.json<ApiResponse>({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
    }

    const token = await new SignJWT({ tenantId: tenant.id, email: tenant.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(JWT_SECRET)

    const res = NextResponse.json<ApiResponse>({
      data: { id: tenant.id, email: tenant.email, name: tenant.name, isAdmin: tenant.isAdmin },
      message: 'Connecté',
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
