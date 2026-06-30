import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { prisma } from '@/lib/prisma'
import { LOGO_DATA_URI } from '@/lib/logo'
import { extractToc, slugifyHeading, buildMarkdownFromPost, getYoutubeEmbedUrl, type ArticleBlock, type VideoEmbed } from '@/lib/blog-utils'
import BlogFaqAccordion from '@/components/BlogFaqAccordion'

interface FaqItem { question: string; answer: string }

const AUTHOR = {
  name: 'Camille G.',
  role: 'Marketing digital et développement',
  bio: "J'aide les e-commerçants à dupliquer et localiser leur catalogue produit vers de nouveaux marchés européens, sans repartir de zéro.",
  photoUrl: 'https://avatars.githubusercontent.com/u/283448413?v=4',
  linkedinUrl: 'https://fr.linkedin.com/in/camille-guerineau-a52200a9',
  orcidUrl: 'https://orcid.org/0009-0009-0364-6396',
  githubUrl: 'https://github.com/spiritracking-arch',
}

async function getPost(slug: string) {
  return prisma.blogPost.findUnique({ where: { slug } })
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#fff', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>
  )
}
function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.17c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.21-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.15v3.19c0 .3.21.66.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
  )
}
function OrcidIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#A6CE39"><circle cx="12" cy="12" r="12" fill="#A6CE39"/><path fill="#fff" d="M7.37 7.06a1.13 1.13 0 1 1 0-2.26 1.13 1.13 0 0 1 0 2.26zM6.6 8.6h1.55v9.34H6.6V8.6zm3.4 0h3.58c3.4 0 4.9 2.44 4.9 4.67 0 2.43-1.9 4.67-4.88 4.67H10V8.6zm1.55 1.38v6.58h1.9c3 0 3.7-2.28 3.7-3.29 0-1.78-1.13-3.29-3.77-3.29h-1.83z"/></svg>
  )
}

function flattenText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(flattenText).join('')
  if (children && typeof children === 'object' && 'props' in (children as any)) {
    return flattenText((children as any).props.children)
  }
  return ''
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post || post.status !== 'PUBLISHED') return { title: 'Article introuvable — ScaleYourShop' }

  return {
    title: post.metaTitle || `${post.title} — ScaleYourShop`,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
      type: 'article',
    },
  }
}

export const revalidate = 60

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post || post.status !== 'PUBLISHED') notFound()

  const blocks = (post.blocks as unknown as ArticleBlock[]) || []
  const videos = (post.videos as unknown as VideoEmbed[]) || []
  const faqItems = (post.faqItems as unknown as FaqItem[]) || []

  // Tous les blocs (GEO, Hook, Preuve, CTA, Sections) sont rendus dans le meme flux,
  // chacun avec son propre niveau Hn -> le sommaire reflete exactement ce qui s'affiche.
  const markdown = buildMarkdownFromPost({ title: '', coverImageUrl: null, coverImageAlt: null, blocks })
  const toc = blocks
    .filter((b) => b.heading?.trim())
    .map((b) => ({ id: slugifyHeading(b.heading), text: b.heading, level: b.level }))
  const hookBlock = blocks.find((b) => b.key === 'hook')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: post.coverImageUrl || undefined,
        datePublished: post.publishedAt?.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        author: { '@type': 'Organization', name: AUTHOR.name },
      },
      ...(faqItems.length > 0 ? [{
        '@type': 'FAQPage',
        mainEntity: faqItems.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }] : []),
    ],
  }

  const CtaButton = () => (
    <Link href={post.ctaButtonUrl} style={{
      display: 'block', textAlign: 'center', padding: '10px', borderRadius: 12,
      background: '#006FEE', color: '#ffffff', fontWeight: 500, fontSize: 13,
      textDecoration: 'none', border: '1px solid rgba(0,111,238,0.3)',
    }}>
      {post.ctaButtonLabel}
    </Link>
  )

  return (
    <div style={{ minHeight: '100dvh', background: '#0A0A0C', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style dangerouslySetInnerHTML={{ __html: `
        .blog-mobile-only { display: none; }
        @media (max-width: 860px) {
          .blog-grid { grid-template-columns: 1fr !important; }
          .blog-sidebar-desktop { display: none !important; }
          .blog-mobile-only { display: block !important; }
        }
      ` }} />

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(10,10,12,0.85)', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={LOGO_DATA_URI} alt="ScaleYourShop" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Scale<span style={{ color: '#006FEE' }}>Your</span>Shop</span>
          </Link>
          <Link href="/blog" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>← Blog</Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 24px' }}>
        {post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {post.tags.map(t => (
              <span key={t} style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 9999, background: 'rgba(0,111,238,0.15)', color: '#ffffff' }}>{t}</span>
            ))}
          </div>
        )}
        <h1 style={{ fontSize: 'clamp(28px,4.5vw,44px)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.025em', margin: 0 }}>{post.title}</h1>

        {hookBlock?.content && (
          <div id={hookBlock.heading ? slugifyHeading(hookBlock.heading) : undefined} style={{
            marginTop: 28, padding: '18px 20px', borderRadius: 16,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#10B981', marginBottom: 8, letterSpacing: '0.5px' }}>REPONSE RAPIDE</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{renderBold(hookBlock.content)}</div>
          </div>
        )}
      </div>

      {post.coverImageUrl && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 8px' }}>
          <img src={post.coverImageUrl} alt={post.coverImageAlt || post.title} style={{ width: '100%', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
      )}

      {toc.length > 0 && (
        <div className="blog-mobile-only" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: '0.5px' }}>SOMMAIRE</div>
            <nav style={{ display: 'grid', gap: 8 }}>
              {toc.map(item => (
                <a key={`m-${item.id}`} href={`#${item.id}`} style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
                  paddingLeft: (item.level - 2) * 14, lineHeight: 1.4,
                }}>
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 96px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 40 }} className="blog-grid">

        <div>
          <div style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
            <ReactMarkdown
              components={{
                h2: ({ children }) => { const text = flattenText(children); return <h2 id={slugifyHeading(text)} style={{ fontSize: 24, fontWeight: 600, color: '#fff', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>{children}</h2> },
                h3: ({ children }) => { const text = flattenText(children); return <h3 id={slugifyHeading(text)} style={{ fontSize: 19, fontWeight: 600, color: '#fff', margin: '32px 0 12px' }}>{children}</h3> },
                h4: ({ children }) => { const text = flattenText(children); return <h4 id={slugifyHeading(text)} style={{ fontSize: 17, fontWeight: 600, color: '#fff', margin: '28px 0 10px' }}>{children}</h4> },
                h5: ({ children }) => { const text = flattenText(children); return <h5 id={slugifyHeading(text)} style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '24px 0 8px' }}>{children}</h5> },
                h6: ({ children }) => { const text = flattenText(children); return <h6 id={slugifyHeading(text)} style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '20px 0 8px' }}>{children}</h6> },
                p: ({ children }) => <p style={{ margin: '0 0 18px' }}>{children}</p>,
                a: ({ href, children }) => {
                  const isExternal = href?.startsWith('http')
                  return (
                    <a
                      href={href}
                      style={{ color: '#006FEE', textDecoration: 'underline' }}
                      {...(isExternal ? { target: '_blank', rel: 'nofollow noopener noreferrer' } : {})}
                    >
                      {children}
                    </a>
                  )
                },
                ul: ({ children }) => <ul style={{ margin: '0 0 18px', paddingLeft: 22 }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ margin: '0 0 18px', paddingLeft: 22 }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: 8 }}>{children}</li>,
                img: ({ src, alt }) => <img src={src} alt={alt} style={{ width: '100%', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', margin: '8px 0 24px' }} />,
                strong: ({ children }) => <strong style={{ color: '#fff', fontWeight: 600 }}>{children}</strong>,
                code: ({ children }) => <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 6, color: '#10B981' }}>{children}</code>,
                blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid #006FEE', paddingLeft: 16, margin: '0 0 18px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>{children}</blockquote>,
                table: ({ children }) => <div style={{ overflowX: 'auto', marginBottom: 18 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>{children}</table></div>,
                th: ({ children }) => <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 }}>{children}</th>,
                td: ({ children }) => <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{children}</td>,
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>

          {videos.length > 0 && (
            <div style={{ marginTop: 40, display: 'grid', gap: 16 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>VIDÉOS</div>
              {videos.map((v, i) => {
                const embedUrl = v.platform === 'YouTube' ? getYoutubeEmbedUrl(v.url) : null
                if (embedUrl) {
                  return (
                    <div key={i} style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#000' }}>
                      <iframe
                        src={embedUrl}
                        title={`Vidéo YouTube ${i + 1}`}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  )
                }
                return (
                  <a key={i} href={v.url} target="_blank" rel="nofollow noopener noreferrer" style={{ display: 'block', padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', textDecoration: 'none', fontSize: 14 }}>
                    Voir sur {v.platform} →
                  </a>
                )
              })}
            </div>
          )}

          {faqItems.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 18px' }}>Questions fréquentes</h2>
              <BlogFaqAccordion items={faqItems} />
            </div>
          )}

          <div style={{ marginTop: 48, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <img
              src={AUTHOR.photoUrl}
              alt={AUTHOR.name}
              style={{ width: 44, height: 44, borderRadius: 9999, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{AUTHOR.name}</div>
              <div style={{ fontSize: 12, color: '#006FEE', fontWeight: 500, marginBottom: 8 }}>{AUTHOR.role}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 8 }}>{AUTHOR.bio}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a href={AUTHOR.linkedinUrl} target="_blank" rel="nofollow noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', fontSize: 12, color: '#fff', fontWeight: 500 }}>
                  <LinkedInIcon /> LinkedIn
                </a>
                <a href={AUTHOR.orcidUrl} target="_blank" rel="nofollow noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', fontSize: 12, color: '#fff', fontWeight: 500 }}>
                  <OrcidIcon /> ORCID
                </a>
                <a href={AUTHOR.githubUrl} target="_blank" rel="nofollow noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', fontSize: 12, color: '#fff', fontWeight: 500 }}>
                  <GithubIcon /> GitHub
                </a>
              </div>
            </div>
          </div>

          <div className="blog-mobile-only" style={{
            marginTop: 24, background: 'linear-gradient(135deg, rgba(0,111,238,0.15), rgba(0,111,238,0.05))',
            border: '1px solid rgba(0,111,238,0.2)', borderRadius: 16, padding: 18,
          }}>
            <CtaButton />
          </div>
        </div>

        <div className="blog-sidebar-desktop">
          <div style={{ position: 'sticky', top: 84, display: 'grid', gap: 16 }}>
            {toc.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 16 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: '0.5px' }}>SOMMAIRE</div>
                <nav style={{ display: 'grid', gap: 8 }}>
                  {toc.map(item => (
                    <a key={item.id} href={`#${item.id}`} style={{
                      fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
                      paddingLeft: (item.level - 2) * 14, lineHeight: 1.4,
                    }}>
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            <div style={{
              background: 'linear-gradient(135deg, rgba(0,111,238,0.15), rgba(0,111,238,0.05))',
              border: '1px solid rgba(0,111,238,0.2)', borderRadius: 16, padding: 18,
            }}>
              <CtaButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
