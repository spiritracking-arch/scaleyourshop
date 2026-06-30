import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import type { ApiResponse } from '@/types'
import { writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

async function requireAdmin(req: NextRequest) {
  const tenantId = await getTenantId(req)
  if (!tenantId) return null
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant?.isAdmin) return null
  return tenant
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 8 * 1024 * 1024 // 8 Mo

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Accès refusé' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json<ApiResponse>({ error: 'Aucun fichier reçu' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json<ApiResponse>({ error: 'Format non supporté (jpeg, png, webp, gif uniquement)' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json<ApiResponse>({ error: 'Fichier trop volumineux (max 8 Mo)' }, { status: 400 })
    }

    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
    const filename = `${randomUUID()}.${ext}`
    const destDir = path.join(process.cwd(), 'public', 'uploads', 'blog')
    const destPath = path.join(destDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(destPath, buffer)

    const url = `/uploads/blog/${filename}`
    return NextResponse.json<ApiResponse>({ data: { url }, message: 'Image importée' })
  } catch (err) {
    console.error('[blog upload]', err)
    return NextResponse.json<ApiResponse>({ error: 'Erreur lors de l\'import' }, { status: 500 })
  }
}
