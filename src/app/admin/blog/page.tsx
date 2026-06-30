'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const T = {
  bg: '#0d0d0d',
  card: '#1f1f1f',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#ffffff',
  textDim: '#a3a3a3',
  textFaint: '#6b6b6b',
  accent: '#006FEE',
  success: '#17C964',
  radiusContainer: 12,
  radiusForm: 18,
  font: "'Inter', system-ui, -apple-system, sans-serif",
}

interface PostRow {
  id: string
  slug: string
  title: string
  excerpt: string
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  coverImageUrl: string | null
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<PostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/blog')
      .then((res) => res.json())
      .then((json) => {
        if (json.error) { setError(json.error); return }
        setPosts(json.data || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (d: string | null) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Supprimer définitivement "${title || '(sans titre)'}" ? Cette action est irréversible.`)) return
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      setPosts((p) => p.filter((post) => post.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: T.bg, color: T.text, fontFamily: T.font }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: 60, borderBottom: `1px solid ${T.cardBorder}`, position: 'sticky', top: 0, background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(10px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin" style={{ color: T.textDim, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>&larr; Admin</Link>
          <span style={{ width: 1, height: 14, background: T.cardBorder }} />
          <span style={{ fontWeight: 800, fontSize: 15 }}>scaleyour<span style={{ color: T.accent }}>shop</span></span>
        </div>
        <Link href="/admin/blog/new" style={{
          padding: '9px 18px', borderRadius: T.radiusForm, border: 'none', background: T.accent,
          color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none',
        }}>
          + Nouvel article
        </Link>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Articles du blog</h1>

        {error && <div style={{ padding: '12px 16px', borderRadius: T.radiusContainer, background: 'rgba(243,18,96,0.12)', border: '1px solid rgba(243,18,96,0.3)', color: '#FF6B96', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        {loading && <div style={{ color: T.textFaint, fontSize: 14 }}>Chargement...</div>}

        {!loading && posts.length === 0 && !error && (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: T.textFaint, fontSize: 14, border: `1px solid ${T.cardBorder}`, borderRadius: T.radiusContainer, background: T.card }}>
            Aucun article pour le moment.
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {posts.map((p) => (
            <Link key={p.id} href={`/admin/blog/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                display: 'flex', gap: 16, alignItems: 'center', padding: 16,
                background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: T.radiusContainer,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 10, flexShrink: 0, backgroundSize: 'cover', backgroundPosition: 'center',
                  background: p.coverImageUrl ? `url(${p.coverImageUrl})` : 'linear-gradient(135deg, rgba(0,111,238,0.3), rgba(0,111,238,0.05))',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title || '(sans titre)'}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, flexShrink: 0,
                      background: p.status === 'PUBLISHED' ? 'rgba(23,201,100,0.15)' : 'rgba(255,255,255,0.08)',
                      color: p.status === 'PUBLISHED' ? T.success : T.textDim,
                    }}>
                      {p.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: T.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.excerpt || 'Pas de description'}</div>
                </div>
                <div style={{ fontSize: 12, color: T.textFaint, flexShrink: 0 }}>
                  {p.status === 'PUBLISHED' ? formatDate(p.publishedAt) : `Modifié ${formatDate(p.updatedAt)}`}
                </div>
                <button
                  onClick={(e) => handleDelete(e, p.id, p.title)}
                  style={{
                    flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(243,18,96,0.3)',
                    background: 'rgba(243,18,96,0.1)', color: '#F31260', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
