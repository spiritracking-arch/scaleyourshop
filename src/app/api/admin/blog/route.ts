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

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Accès refusé' }, { status: 403 })

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, slug: true, title: true, excerpt: true, status: true,
        publishedAt: true, createdAt: true, updatedAt: true, coverImageUrl: true,
      },
    })
    return NextResponse.json<ApiResponse>({ data: posts })
  } catch (err) {
    console.error(err)
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Accès refusé' }, { status: 403 })

  try {
    const body = await req.json()
    const { title } = body as { title?: string }
    if (!title || !title.trim()) {
      return NextResponse.json<ApiResponse>({ error: 'Titre requis' }, { status: 400 })
    }

    let baseSlug = slugify(title)
    if (!baseSlug) baseSlug = 'article'
    let slug = baseSlug
    let n = 1
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++n}`
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: body.excerpt || '',
        coverImageUrl: body.coverImageUrl || null,
        coverImageAlt: body.coverImageAlt || null,
        blocks: body.blocks || [],
        videos: body.videos || [],
        faqItems: body.faqItems || [],
        tags: body.tags || [],
        socialDrafts: body.socialDrafts || {},
        ctaButtonLabel: body.ctaButtonLabel || 'Essayer gratuitement',
        ctaButtonUrl: body.ctaButtonUrl || '/signup',
        channelBlog: body.channelBlog ?? true,
        channelWebhookEnabled: body.channelWebhookEnabled ?? false,
        socialWebhookUrl: body.socialWebhookUrl || null,
        distributionWebhookUrl: body.distributionWebhookUrl || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        status: 'DRAFT',
      },
    })

    return NextResponse.json<ApiResponse>({ data: post, message: 'Article créé' })
  } catch (err) {
    console.error(err)
    return NextResponse.json<ApiResponse>({ error: 'Erreur serveur' }, { status: 500 })
  }
}
