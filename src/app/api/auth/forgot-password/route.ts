import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import type { ApiResponse } from '@/types'
import { sendPasswordResetEmail } from '@/lib/email'

const GENERIC_MESSAGE = 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json<ApiResponse>({ error: 'Email requis' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({ where: { email } })

    // Toujours répondre pareil, que le compte existe ou non (ne pas révéler les emails inscrits)
    if (!tenant) {
      return NextResponse.json<ApiResponse>({ message: GENERIC_MESSAGE })
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1h

    await prisma.passwordResetToken.create({
      data: { tenantId: tenant.id, tokenHash, expiresAt },
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`
    await sendPasswordResetEmail(tenant.email, { resetUrl })

    return NextResponse.json<ApiResponse>({ message: GENERIC_MESSAGE })
  } catch (err) {
    console.error(err)
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
