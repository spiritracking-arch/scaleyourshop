'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import ResponsiveStyles from '@/components/ResponsiveStyles'

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erreur API')
  return json
}

interface Shop {
  id: string
  name: string
  url: string
  platform: string
  role: string
  lang: string | null
  status: string
  createdAt: string
}

function Badge({ label, type }: { label: string; type: 'source' | 'target' | 'woo' | 'shopify' }) {
  const styles = {
    source: { bg: '#1a1a1a', color: 'white' },
    target: { bg: '#f0f0f0', color: '#666' },
    woo: { bg: '#96588a18', color: '#96588a' },
    shopify: { bg: '#95bf4718', color: '#5a8f2e' },
  }
  const s = styles[type]
  return <span style={{ padding: '3px 9px', borderRadius: 999, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700 }}>{label}</span>
}

function Input({ label, value, onChange, placeholder, type = 'text', mono, name, autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; mono?: boolean; name?: string; autoComplete?: string
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 7 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        name={name} autoComplete={autoComplete || 'off'}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, fontFamily: mono ? 'monospace' : 'inherit', color: '#1a1a1a', boxSizing: 'border-box' }} />
    </div>
  )
}

function AddShopModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [role, setRole] = useState<'SOURCE' | 'TARGET'>('TARGET')
  const [platform, setPlatform] = useState<'WOOCOMMERCE' | 'SHOPIFY'>('WOOCOMMERCE')
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [secret, setSecret] = useState('')
  const [lang, setLang] = useState('')
  const [testing, setTesting] = useState(false)
  const [tested, setTested] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const canTest = url && key && (role === 'SOURCE' || lang)

  const test = async () => {
    setTesting(true)
    setError('')
    try {
      await api('/api/shops/test-connection', {
        method: 'POST',
        body: JSON.stringify({ url, platform, apiKey: key, apiSecret: secret }),
      })
      setTested(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setTesting(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const hostname = new URL(url.startsWith('http') ? url : 'https://' + url).hostname
      await api('/api/shops', {
        method: 'POST',
        body: JSON.stringify({ name: hostname, url, platform, role, lang: role === 'TARGET' ? lang : undefined, apiKey: key, apiSecret: secret }),
      })
      onAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 460, maxWidth: '100%', maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Ajouter une boutique</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa' }}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 8 }}>Rôle</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['SOURCE', 'TARGET'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                padding: '10px', borderRadius: 10, border: `2px solid ${role === r ? '#1a1a1a' : '#e5e5e5'}`,
                background: role === r ? '#1a1a1a' : 'white', color: role === r ? 'white' : '#666',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>{r === 'SOURCE' ? 'Source' : 'Cible'}</button>
            ))}
          </div>
        </div>

        {role === 'TARGET' && (
          <div style={{ marginBottom: 16 }}>
            <Input label="Code langue" value={lang} onChange={setLang} placeholder="fr, de, es…" name="target-lang" autoComplete="off" />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 8 }}>Plateforme</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['WOOCOMMERCE', 'SHOPIFY'] as const).map(p => (
              <button key={p} onClick={() => setPlatform(p)} style={{
                padding: '10px', borderRadius: 10, border: `2px solid ${platform === p ? '#1a1a1a' : '#e5e5e5'}`,
                background: platform === p ? '#1a1a1a' : 'white', color: platform === p ? 'white' : '#666',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>{p === 'WOOCOMMERCE' ? 'WooCommerce' : 'Shopify'}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
          <Input label="URL" value={url} onChange={v => { setUrl(v); setTested(false) }} placeholder="https://ma-boutique.com" name="shop-url" autoComplete="url" />
          {platform === 'WOOCOMMERCE' ? (
            <>
              <Input label="Consumer Key" value={key} onChange={v => { setKey(v); setTested(false) }} placeholder="ck_xxx" mono name="woo-consumer-key" autoComplete="off" />
              <Input label="Consumer Secret" value={secret} onChange={v => { setSecret(v); setTested(false) }} placeholder="cs_xxx" type="password" mono name="woo-consumer-secret" autoComplete="new-password" />
            </>
          ) : (
            <>
              <Input label="Clé API (Client ID)" value={key} onChange={v => { setKey(v); setTested(false) }} placeholder="7b0f39e1..." mono name="shopify-client-id" autoComplete="off" />
              <Input label="Secret API (Client Secret)" value={secret} onChange={v => { setSecret(v); setTested(false) }} placeholder="shpss_xxx" type="password" mono name="shopify-client-secret" autoComplete="new-password" />
            </>
          )}
        </div>

        {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button onClick={test} disabled={!canTest || testing || tested} style={{
          width: '100%', padding: '11px', borderRadius: 10, border: 'none', marginBottom: 12,
          background: tested ? '#f0fdf4' : canTest && !testing ? '#1a1a1a' : '#e5e5e5',
          color: tested ? '#166534' : canTest && !testing ? 'white' : '#aaa',
          fontWeight: 700, fontSize: 14, cursor: canTest && !testing && !tested ? 'pointer' : 'default',
        }}>
          {testing ? 'Test en cours…' : tested ? '✓ Connexion réussie' : 'Tester la connexion'}
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e5e5', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#888' }}>Annuler</button>
          <button onClick={save} disabled={!tested || saving} style={{
            flex: 2, padding: '11px', borderRadius: 10, border: 'none',
            background: tested ? '#1a1a1a' : '#e5e5e5', color: tested ? 'white' : '#aaa',
            fontWeight: 700, fontSize: 14, cursor: tested ? 'pointer' : 'not-allowed',
          }}>
            {saving ? 'Ajout…' : 'Ajouter la boutique'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = () => {
    api('/api/shops').then(res => { setShops(res.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const remove = async (id: string) => {
    await api(`/api/shops?id=${id}`, { method: 'DELETE' })
    setDeleteId(null)
    load()
  }

  const sources = shops.filter(s => s.role === 'SOURCE')
  const targets = shops.filter(s => s.role === 'TARGET')

  return (
    <div className="app-layout" style={{ display: 'flex', minHeight: '100dvh', background: '#f9f9f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />

      <div className="app-content" style={{ padding: '32px 40px', flex: 1, maxWidth: 860, minWidth: 0 }}>
        <div className="shops-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>Boutiques connectées</h1>
            <p style={{ fontSize: 14, color: '#999', margin: 0 }}>{sources.length} source · {targets.length} cible(s)</p>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '9px 20px', borderRadius: 999, border: 'none', background: '#1a1a1a', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + Ajouter une boutique
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Chargement…</div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.8px', marginBottom: 12 }}>BOUTIQUE SOURCE</div>
              {sources.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#bbb', fontSize: 13, background: 'white', borderRadius: 12, border: '1px solid #e5e5e5' }}>Aucune boutique source</div>}
              {sources.map(shop => (
                <ShopCard key={shop.id} shop={shop} onDelete={() => setDeleteId(shop.id)} />
              ))}
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.8px', marginBottom: 12 }}>BOUTIQUES CIBLES ({targets.length})</div>
              {targets.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#bbb', fontSize: 13, background: 'white', borderRadius: 12, border: '1px solid #e5e5e5' }}>Aucune boutique cible</div>}
              <div style={{ display: 'grid', gap: 10 }}>
                {targets.map(shop => (
                  <ShopCard key={shop.id} shop={shop} onDelete={() => setDeleteId(shop.id)} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {showAdd && <AddShopModal onClose={() => setShowAdd(false)} onAdded={load} />}

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 380, maxWidth: '100%' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', margin: '0 0 10px' }}>Supprimer la boutique ?</h3>
            <p style={{ fontSize: 14, color: '#888', margin: '0 0 24px' }}>Les transferts passés ne seront pas supprimés.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e5e5e5', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#888' }}>Annuler</button>
              <button onClick={() => remove(deleteId)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <ResponsiveStyles css={`
        @media (max-width: 860px) {
          .app-content { padding: 20px 16px !important; max-width: 100% !important; }
          .shops-header { flex-direction: column !important; align-items: flex-start !important; }
          .shop-card { flex-wrap: wrap !important; }
        }
      `} />
    </div>
  )
}

function ShopCard({ shop, onDelete }: { shop: Shop; onDelete: () => void }) {
  return (
    <div className="shop-card" style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e5e5', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
        {shop.role === 'SOURCE' ? '🏪' : '🏬'}
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{shop.name}</span>
          <Badge label={shop.role === 'SOURCE' ? 'Source' : 'Cible'} type={shop.role === 'SOURCE' ? 'source' : 'target'} />
          <Badge label={shop.platform === 'WOOCOMMERCE' ? 'WooCommerce' : 'Shopify'} type={shop.platform === 'WOOCOMMERCE' ? 'woo' : 'shopify'} />
          {shop.lang && <Badge label={shop.lang.toUpperCase()} type="target" />}
        </div>
        <div style={{ fontSize: 12, color: '#bbb', wordBreak: 'break-all' }}>{shop.url}</div>
      </div>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: shop.status === 'ACTIVE' ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
      <button onClick={onDelete} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}>
        Supprimer
      </button>
    </div>
  )
}
