import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { LOGO_DATA_URI } from '@/lib/logo'

export const metadata: Metadata = {
  title: 'Blog — ScaleYourShop',
  description: 'Guides, retours d\'expérience et bonnes pratiques pour scaler votre catalogue e-commerce vers de nouveaux marchés européens.',
}

export const revalidate = 60

async function getPosts() {
  return prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    select: {
      slug: true, title: true, excerpt: true, coverImageUrl: true,
      coverImageAlt: true, tags: true, publishedAt: true,
    },
  })
}

function formatDate(d: Date | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function BlogListPage() {
  const posts = await getPosts()

  return (
    <div style={{ minHeight: '100dvh', background: '#0A0A0C', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(10,10,12,0.85)', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={LOGO_DATA_URI} alt="ScaleYourShop" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Scale<span style={{ color: '#006FEE' }}>Your</span>Shop</span>
          </Link>
          <Link href="/signup" style={{ padding: '10px', borderRadius: 12, border: '1px solid rgba(0,111,238,0.3)', background: '#006FEE', color: '#ffffff', fontWeight: 500, fontSize: 12, textDecoration: 'none' }}>
            Essayer gratuitement
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px 32px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#10B981', marginBottom: 12, letterSpacing: '0.5px' }}>// BLOG</div>
        <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.025em', margin: '0 0 16px', fontFamily: 'Inter' }}>
          Guides pour scaler votre<br />catalogue e-commerce
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: '60ch', lineHeight: 1.6, margin: 0 }}>
          Retours d'expérience, bonnes pratiques et études de cas pour étendre votre boutique WooCommerce ou Shopify vers de nouveaux marchés.
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 96px' }}>
        {posts.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, background: 'rgba(255,255,255,0.03)' }}>
            Aucun article publié pour le moment.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {posts.map(p => (
              <Link key={p.slug} href={`/blog/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 16, padding: 16, height: '100%', display: 'flex', flexDirection: 'column',
                  transition: 'border-color 150ms ease, transform 150ms ease',
                }}>
                  <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, background: p.coverImageUrl ? `url(${p.coverImageUrl})` : 'linear-gradient(135deg, rgba(0,111,238,0.25), rgba(16,185,129,0.1))', backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 14, flexShrink: 0 }} />
                  {p.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      {p.tags.slice(0, 2).map(t => (
                        <span key={t} style={{ fontSize: 10, fontWeight: 500, padding: '3px 9px', borderRadius: 9999, background: 'rgba(0,111,238,0.15)', color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>{t}</span>
                      ))}
                    </div>
                  )}
                  <h2 style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35, margin: '0 0 8px', color: '#fff' }}>{p.title}</h2>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: '0 0 14px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.excerpt}</p>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>{formatDate(p.publishedAt)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
