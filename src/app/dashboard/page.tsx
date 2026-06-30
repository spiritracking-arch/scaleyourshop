'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import PlanPanel from '@/components/PlanPanel'
import ResponsiveStyles from '@/components/ResponsiveStyles'

async function api(path: string) {
  const res = await fetch(path)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erreur API')
  return json
}

interface Transfer {
  id: string
  category: string
  source: string
  target: string
  targetLang: string | null
  status: string
  progress: number
  totalProducts: number
  doneProducts: number
  failedProducts: number
  lastLog: string | null
  createdAt: string
}

interface Shop {
  id: string
  name: string
  url: string
  platform: string
  role: string
  lang: string | null
  status: string
}

interface DashboardData {
  stats: {
    totalProductsTransferred: number
    activeShops: number
    langsCount: number
    successRate: number
  }
  transfers: Transfer[]
  shops: Shop[]
  plan: string
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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string; dot?: boolean }> = {
    RUNNING: { label: 'En cours', bg: '#f0f0f0', color: '#1a1a1a', dot: true },
    PENDING: { label: 'En attente', bg: '#f0f0f0', color: '#666' },
    DONE: { label: 'Terminé', bg: '#f0fdf4', color: '#166534' },
    ERROR: { label: 'Erreur', bg: '#fef2f2', color: '#991b1b' },
    PARTIAL: { label: 'Partiel', bg: '#fffbeb', color: '#92400e' },
  }
  const c = config[status] || config.PENDING
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: c.bg, color: c.color, fontSize: 12, fontWeight: 600 }}>
      {c.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a1a1a', display: 'inline-block' }} />}
      {c.label}
    </span>
  )
}

function ProgressBar({ value, status }: { value: number; status: string }) {
  const color = status === 'ERROR' ? '#ef4444' : status === 'RUNNING' ? '#1a1a1a' : '#22c55e'
  return (
    <div style={{ height: 4, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 999, transition: 'width 1s ease' }} />
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    api('/api/dashboard').then(res => { setData(res.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#999' }}>
      Chargement…
    </div>
  )

  if (!data) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#999' }}>
      Erreur de chargement
    </div>
  )

  const running = data.transfers.find(t => t.status === 'RUNNING')
  const stats = [
    { label: 'Produits transférés', value: data.stats.totalProductsTransferred.toLocaleString() },
    { label: 'Boutiques cibles', value: data.stats.activeShops },
    { label: 'Langues couvertes', value: data.stats.langsCount },
    { label: 'Taux de succès', value: `${data.stats.successRate}%` },
  ]

  return (
    <div className="app-layout" style={{ display: 'flex', minHeight: '100dvh', background: '#f9f9f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar plan={data.plan} />

      <div className="app-content" style={{ padding: '32px 40px', flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <div className="dash-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: '#1a1a1a', margin: 0 }}>Tableau de bord</h1>
            <p style={{ fontSize: 14, color: '#999', margin: '4px 0 0' }}>Voici l&apos;état de vos transferts</p>
          </div>
          <a href="/onboarding" style={{ padding: '10px 22px', borderRadius: 999, border: 'none', background: '#1a1a1a', color: 'white', fontWeight: 600, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            + Nouveau transfert
          </a>
        </div>

        <PlanPanel />

        <div className="dash-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #e5e5e5' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#aaa', letterSpacing: '0.5px', marginBottom: 8 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: '#1a1a1a' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {running && (
          <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 24, marginBottom: 32, color: 'white' }}>
            <div className="dash-running-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 600, letterSpacing: '0.8px', marginBottom: 4 }}>TRANSFERT ACTIF</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{running.category}</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{running.source} → {running.target}</div>
              </div>
              <div className="dash-running-progress" style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1px' }}>{running.progress}%</div>
                <div style={{ fontSize: 12, color: '#666' }}>{running.doneProducts}/{running.totalProducts} produits</div>
              </div>
            </div>
            <div style={{ height: 6, background: '#333', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${running.progress}%`, background: 'white', borderRadius: 999, transition: 'width 1s ease' }} />
            </div>
            {running.lastLog && <div style={{ fontSize: 12, color: '#888', marginTop: 12, fontFamily: 'monospace' }}>{running.lastLog}</div>}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5e5', marginBottom: 32 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>Transferts récents</span>
          </div>
          <div>
            {data.transfers.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#bbb', fontSize: 14 }}>Aucun transfert pour le moment</div>
            )}
            {data.transfers.map((t, i) => (
              <div key={t.id} className="dash-transfer-row" style={{ padding: '16px 24px', borderBottom: i < data.transfers.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'grid', gridTemplateColumns: '1fr 160px 160px 100px', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', marginBottom: 3 }}>{t.category}</div>
                  <div style={{ fontSize: 12, color: '#bbb' }}>{t.source} → {t.target} · {t.totalProducts} produits · {timeAgo(t.createdAt)}</div>
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>{t.targetLang}</div>
                <div>
                  <ProgressBar value={t.progress} status={t.status} />
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{t.progress}%</div>
                </div>
                <div><StatusBadge status={t.status} /></div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5e5' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>Boutiques</span>
            <a href="/onboarding" style={{ fontSize: 13, color: '#999', textDecoration: 'none' }}>Ajouter une boutique →</a>
          </div>
          <div className="dash-shops-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {data.shops.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#bbb', fontSize: 14, gridColumn: '1 / -1' }}>Aucune boutique connectée</div>
            )}
            {data.shops.map((shop, i) => (
              <div key={shop.id} style={{ padding: '18px 20px', borderRight: i % 4 !== 3 ? '1px solid #f5f5f5' : 'none', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: shop.role === 'SOURCE' ? '#1a1a1a' : '#f0f0f0', color: shop.role === 'SOURCE' ? 'white' : '#888' }}>
                    {shop.role === 'SOURCE' ? 'SRC' : shop.lang?.toUpperCase() || 'TGT'}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop.name}</span>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: shop.status === 'ACTIVE' ? '#22c55e' : '#ef4444', marginLeft: 'auto', flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: 11, color: '#bbb' }}>{shop.platform} · {shop.url}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveStyles css={`
        @media (max-width: 860px) {
          .app-content { padding: 20px 16px !important; }
          .dash-header { flex-direction: column !important; align-items: flex-start !important; }
          .dash-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-running-header { flex-direction: column !important; align-items: flex-start !important; }
          .dash-running-progress { text-align: left !important; }
          .dash-transfer-row { grid-template-columns: 1fr !important; gap: 8px !important; }
          .dash-shops-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .dash-stats-grid { grid-template-columns: 1fr !important; }
          .dash-shops-grid { grid-template-columns: 1fr !important; }
        }
      `} />
    </div>
  )
}
