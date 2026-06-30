'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Tenant {
  id: string
  email: string
  name: string
  plan: string
  status: string
  isAdmin: boolean
  shopsCount: number
  transfersCount: number
  productsTransferred: number
  tokensUsed: number
  mrr: number
  createdAt: string
}

interface Transfer {
  id: string
  tenantEmail: string
  tenantName: string
  category: string
  source: string
  target: string
  targetLang: string | null
  status: string
  totalProducts: number
  doneProducts: number
  failedProducts: number
  tokensUsed: number
  createdAt: string
}

interface AdminData {
  stats: {
    totalTenants: number
    activeTenants: number
    totalMRR: number
    totalShops: number
    totalTransfers: number
    planBreakdown: Record<string, number>
    totalTokensUsed: number
    avgTokensPerProduct: number
  }
  tenants: Tenant[]
  transfers: Transfer[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return `il y a ${d}j`
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    RUNNING: { label: 'En cours', bg: '#f0f0f0', color: '#1a1a1a' },
    PENDING: { label: 'En attente', bg: '#f0f0f0', color: '#666' },
    DONE: { label: 'Terminé', bg: '#f0fdf4', color: '#166534' },
    ERROR: { label: 'Erreur', bg: '#fef2f2', color: '#991b1b' },
    PARTIAL: { label: 'Partiel', bg: '#fffbeb', color: '#92400e' },
    ACTIVE: { label: 'Actif', bg: '#f0fdf4', color: '#166534' },
    TRIAL: { label: 'Essai', bg: '#fffbeb', color: '#92400e' },
    SUSPENDED: { label: 'Suspendu', bg: '#fef2f2', color: '#991b1b' },
    CHURNED: { label: 'Churné', bg: '#f5f5f5', color: '#999' },
  }
  const c = config[status] || { label: status, bg: '#f0f0f0', color: '#666' }
  return <span style={{ padding: '3px 9px', borderRadius: 999, background: c.bg, color: c.color, fontSize: 11, fontWeight: 700 }}>{c.label}</span>
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, [string, string]> = {
    FREE: ['#fffbeb', '#92400e'],
    STARTER: ['#f0f0f0', '#888'],
    GROWTH: ['#1a1a1a', '#fff'],
    BUSINESS: ['#333', '#fff'],
  }
  const [bg, color] = colors[plan] || colors.FREE
  return <span style={{ padding: '3px 9px', borderRadius: 999, background: bg, color, fontSize: 11, fontWeight: 700 }}>{plan}</span>
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'tenants' | 'transfers'>('overview')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/overview')
      .then(res => res.json())
      .then(json => {
        if (json.error) throw new Error(json.error)
        setData(json.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontFamily: 'system-ui, sans-serif' }}>
      Chargement…
    </div>
  )

  if (!data) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b', fontFamily: 'system-ui, sans-serif' }}>
      Accès refusé — réservé aux administrateurs
    </div>
  )

  const filteredTenants = data.tenants.filter(t =>
    t.email.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase())
  )

  const topConsumers = [...data.tenants]
    .filter(t => !t.isAdmin)
    .sort((a, b) => b.tokensUsed - a.tokensUsed)
    .slice(0, 5)

  return (
    <div style={{ minHeight: '100dvh', background: '#f9f9f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      <div style={{ background: '#1a1a1a', padding: '0 40px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#333', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🌍</div>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>ScaleYourShop</span>
          <span style={{ fontSize: 12, color: '#666', marginLeft: 6, fontWeight: 700, letterSpacing: '0.5px' }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/admin/blog" style={{ fontSize: 13, color: '#aaa', textDecoration: 'none', fontWeight: 600 }}>📝 Blog</Link>
        <div style={{ display: 'flex', gap: 4, background: '#2a2a2a', borderRadius: 8, padding: 4 }}>
          {(['overview', 'tenants', 'transfers'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 16px', borderRadius: 6, border: 'none',
              background: tab === t ? 'white' : 'transparent',
              color: tab === t ? '#1a1a1a' : '#888',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              {t === 'overview' ? "Vue d'ensemble" : t === 'tenants' ? 'Clients' : 'Transferts'}
            </button>
          ))}
        </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
              {[
                { label: 'MRR', value: `${data.stats.totalMRR}€` },
                { label: 'Clients actifs', value: data.stats.activeTenants },
                { label: 'Boutiques connectées', value: data.stats.totalShops },
                { label: 'Transferts totaux', value: data.stats.totalTransfers },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #e5e5e5' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.5px', marginBottom: 8 }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', color: '#1a1a1a' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
              <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.5px', marginBottom: 8 }}>TOKENS CLAUDE CONSOMMÉS</div>
                <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', color: '#1a1a1a' }}>{formatTokens(data.stats.totalTokensUsed)}</div>
              </div>
              <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.5px', marginBottom: 8 }}>MOYENNE / PRODUIT</div>
                <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', color: '#1a1a1a' }}>{data.stats.avgTokensPerProduct.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5e5', padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', marginBottom: 16 }}>Répartition des plans</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {Object.entries(data.stats.planBreakdown).map(([plan, count]) => (
                    <div key={plan}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>{plan}</span>
                        <span style={{ color: '#888' }}>{count} client(s)</span>
                      </div>
                      <div style={{ height: 6, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: data.stats.activeTenants > 0 ? `${(count / data.stats.activeTenants) * 100}%` : '0%', background: '#1a1a1a', borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 18, padding: 14, background: '#f9f9f9', borderRadius: 10, border: '1px solid #e5e5e5' }}>
                  <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 4 }}>ARR ESTIMÉ</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#1a1a1a', letterSpacing: '-1px' }}>{data.stats.totalMRR * 12}€</div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5e5', padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', marginBottom: 16 }}>Top consommation tokens</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {topConsumers.length === 0 && <div style={{ color: '#bbb', fontSize: 13 }}>Aucune donnée</div>}
                  {topConsumers.map((t, i) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: '#bbb' }}>{t.plan} · {t.productsTransferred} produits</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{formatTokens(t.tokensUsed)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'tenants' && (
          <div>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un client…"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }}
            />
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
              <div style={{ padding: '12px 22px', borderBottom: '1px solid #f0f0f0', display: 'grid', gridTemplateColumns: '2fr 1fr 70px 80px 70px 70px 90px', gap: 12, fontSize: 11, fontWeight: 700, color: '#aaa' }}>
                <span>CLIENT</span><span>PLAN</span><span>BOUTIQ.</span><span>PRODUITS</span><span>TOKENS</span><span>MRR</span><span>INSCRIT</span>
              </div>
              {filteredTenants.filter(t => !t.isAdmin).map((t, i, arr) => (
                <div key={t.id} style={{ padding: '14px 22px', borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'grid', gridTemplateColumns: '2fr 1fr 70px 80px 70px 70px 90px', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#bbb' }}>{t.email}</div>
                  </div>
                  <PlanBadge plan={t.plan} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t.shopsCount}</span>
                  <span style={{ fontSize: 13, color: '#666' }}>{t.productsTransferred.toLocaleString()}</span>
                  <span style={{ fontSize: 13, color: '#666' }}>{formatTokens(t.tokensUsed)}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t.mrr > 0 ? `${t.mrr}€` : '—'}</span>
                  <span style={{ fontSize: 12, color: '#bbb' }}>{timeAgo(t.createdAt)}</span>
                </div>
              ))}
              {filteredTenants.filter(t => !t.isAdmin).length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#bbb' }}>Aucun client trouvé</div>
              )}
            </div>
          </div>
        )}

        {tab === 'transfers' && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            <div style={{ padding: '12px 22px', borderBottom: '1px solid #f0f0f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 70px 90px', gap: 12, fontSize: 11, fontWeight: 700, color: '#aaa' }}>
              <span>CLIENT</span><span>SOURCE → CIBLE</span><span>CATÉGORIE</span><span>PRODUITS</span><span>TOKENS</span><span>STATUT</span>
            </div>
            {data.transfers.map((t, i) => (
              <div key={t.id} style={{ padding: '14px 22px', borderBottom: i < data.transfers.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 70px 90px', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.tenantName}</div>
                  <div style={{ fontSize: 11, color: '#bbb' }}>{t.tenantEmail}</div>
                </div>
                <div style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>{t.source} → {t.target}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{t.category}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.doneProducts}/{t.totalProducts}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{formatTokens(t.tokensUsed)}</div>
                <StatusBadge status={t.status} />
              </div>
            ))}
            {data.transfers.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#bbb' }}>Aucun transfert</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
