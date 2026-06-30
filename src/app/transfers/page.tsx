'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
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
  const config: Record<string, { label: string; bg: string; color: string }> = {
    RUNNING: { label: 'En cours', bg: '#f0f0f0', color: '#1a1a1a' },
    PENDING: { label: 'En attente', bg: '#f0f0f0', color: '#666' },
    DONE: { label: 'Terminé', bg: '#f0fdf4', color: '#166534' },
    ERROR: { label: 'Erreur', bg: '#fef2f2', color: '#991b1b' },
    PARTIAL: { label: 'Partiel', bg: '#fffbeb', color: '#92400e' },
  }
  const c = config[status] || config.PENDING
  return <span style={{ padding: '4px 10px', borderRadius: 999, background: c.bg, color: c.color, fontSize: 12, fontWeight: 600 }}>{c.label}</span>
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api('/api/dashboard').then(res => { setTransfers(res.data.transfers); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? transfers : transfers.filter(t => t.status === filter)

  return (
    <div className="app-layout" style={{ display: 'flex', minHeight: '100dvh', background: '#f9f9f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />

      <div className="app-content" style={{ padding: '32px 40px', flex: 1, maxWidth: 1000, minWidth: 0 }}>
        <div className="transfers-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>Transferts</h1>
            <p style={{ fontSize: 14, color: '#999', margin: 0 }}>{transfers.length} transfert(s)</p>
          </div>
          <a href="/onboarding" style={{ padding: '9px 20px', borderRadius: 999, border: 'none', background: '#1a1a1a', color: 'white', fontWeight: 600, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            + Nouveau transfert
          </a>
        </div>

        <div className="transfers-filters" style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {['all', 'RUNNING', 'DONE', 'ERROR', 'PARTIAL', 'PENDING'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 14px', borderRadius: 8, border: `1px solid ${filter === f ? '#1a1a1a' : '#e5e5e5'}`,
              background: filter === f ? '#1a1a1a' : 'white', color: filter === f ? 'white' : '#666',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
            }}>
              {f === 'all' ? 'Tous' : f === 'RUNNING' ? 'En cours' : f === 'DONE' ? 'Terminés' : f === 'ERROR' ? 'Erreurs' : f === 'PARTIAL' ? 'Partiels' : 'En attente'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Chargement…</div>
        ) : (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#bbb', fontSize: 14 }}>Aucun transfert</div>
            )}
            {filtered.map((t, i) => (
              <div key={t.id} style={{ padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                <div className="transfer-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', marginBottom: 2 }}>{t.category}</div>
                    <div style={{ fontSize: 12, color: '#bbb' }}>{t.source} → {t.target} ({t.targetLang}) · {timeAgo(t.createdAt)}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div style={{ height: 4, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${t.progress}%`, background: t.status === 'ERROR' ? '#ef4444' : t.status === 'RUNNING' ? '#1a1a1a' : '#22c55e', borderRadius: 999 }} />
                </div>
                <div style={{ fontSize: 12, color: '#bbb' }}>
                  {t.doneProducts} réussis · {t.failedProducts} échecs · {t.totalProducts} total
                  {t.lastLog && <span style={{ marginLeft: 8, fontFamily: 'monospace', color: '#aaa' }}>· {t.lastLog}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ResponsiveStyles css={`
        @media (max-width: 860px) {
          .app-content { padding: 20px 16px !important; max-width: 100% !important; }
          .transfers-header { flex-direction: column !important; align-items: flex-start !important; }
          .transfer-card-head { flex-direction: column !important; }
        }
      `} />
    </div>
  )
}
