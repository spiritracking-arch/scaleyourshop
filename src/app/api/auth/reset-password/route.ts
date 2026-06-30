import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json<ApiResponse>({ error: 'Token et mot de passe requis' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json<ApiResponse>({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json<ApiResponse>({ error: 'Ce lien est invalide ou a expiré. Demandez-en un nouveau.' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.$transaction([
      prisma.tenant.update({ where: { id: resetToken.tenantId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ])

    return NextResponse.json<ApiResponse>({ message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' })
  } catch (err) {
    console.error(err)
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
