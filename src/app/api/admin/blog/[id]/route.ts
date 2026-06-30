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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Accès refusé' }, { status: 403 })

  try {
    const { id } = await params
    const post = await prisma.blogPost.findUnique({ where: { id } })
    if (!post) return NextResponse.json<ApiResponse>({ error: 'Article introuvable' }, { status: 404 })
    return NextResponse.json<ApiResponse>({ data: post })
  } catch (err) {
    console.error(err)
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Accès refusé' }, { status: 403 })

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing) return NextResponse.json<ApiResponse>({ error: 'Article introuvable' }, { status: 404 })

    const wasPublished = existing.status === 'PUBLISHED'
    const willBePublished = body.status === 'PUBLISHED'

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        excerpt: body.excerpt ?? existing.excerpt,
        coverImageUrl: body.coverImageUrl ?? existing.coverImageUrl,
        coverImageAlt: body.coverImageAlt ?? existing.coverImageAlt,
        blocks: body.blocks ?? existing.blocks,
        videos: body.videos ?? existing.videos,
        faqItems: body.faqItems ?? existing.faqItems,
        tags: body.tags ?? existing.tags,
        socialDrafts: body.socialDrafts ?? existing.socialDrafts,
        ctaButtonLabel: body.ctaButtonLabel ?? existing.ctaButtonLabel,
        ctaButtonUrl: body.ctaButtonUrl ?? existing.ctaButtonUrl,
        channelBlog: body.channelBlog ?? existing.channelBlog,
        channelWebhookEnabled: body.channelWebhookEnabled ?? existing.channelWebhookEnabled,
        socialWebhookUrl: body.socialWebhookUrl ?? existing.socialWebhookUrl,
        distributionWebhookUrl: body.distributionWebhookUrl ?? existing.distributionWebhookUrl,
        metaTitle: body.metaTitle ?? existing.metaTitle,
        metaDescription: body.metaDescription ?? existing.metaDescription,
        status: body.status ?? existing.status,
        publishedAt: !wasPublished && willBePublished ? new Date() : existing.publishedAt,
      },
    })

    return NextResponse.json<ApiResponse>({ data: post, message: 'Article mis à jour' })
  } catch (err) {
    console.error(err)
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Accès refusé' }, { status: 403 })

  try {
    const { id } = await params
    await prisma.blogPost.delete({ where: { id } })
    return NextResponse.json<ApiResponse>({ message: 'Article supprimé' })
  } catch (err) {
    console.error(err)
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
