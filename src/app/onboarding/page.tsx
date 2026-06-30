'use client'

import { useState, useEffect, useRef } from 'react'
import { LOGO_DATA_URI } from '@/lib/logo'
import ResponsiveStyles from '@/components/ResponsiveStyles'

const STEPS = ['Bienvenue', 'Boutique source', 'Boutique cible', 'Transfert']

const LANGS = [
  { code: 'fr', flag: '🇫🇷', label: 'Français', labelFr: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch', labelFr: 'Allemand' },
  { code: 'es', flag: '🇪🇸', label: 'Español', labelFr: 'Espagnol' },
  { code: 'it', flag: '🇮🇹', label: 'Italiano', labelFr: 'Italien' },
  { code: 'nl', flag: '🇳🇱', label: 'Nederlands', labelFr: 'Néerlandais' },
  { code: 'pt', flag: '🇵🇹', label: 'Português', labelFr: 'Portugais' },
  { code: 'ro', flag: '🇷🇴', label: 'Română', labelFr: 'Roumain' },
  { code: 'cs', flag: '🇨🇿', label: 'Čeština', labelFr: 'Tchèque' },
  { code: 'hu', flag: '🇭🇺', label: 'Magyar', labelFr: 'Hongrois' },
  { code: 'sv', flag: '🇸🇪', label: 'Svenska', labelFr: 'Suédois' },
  { code: 'da', flag: '🇩🇰', label: 'Dansk', labelFr: 'Danois' },
  { code: 'fi', flag: '🇫🇮', label: 'Suomi', labelFr: 'Finnois' },
  { code: 'sk', flag: '🇸🇰', label: 'Slovenčina', labelFr: 'Slovaque' },
  { code: 'bg', flag: '🇧🇬', label: 'Български', labelFr: 'Bulgare' },
  { code: 'hr', flag: '🇭🇷', label: 'Hrvatski', labelFr: 'Croate' },
  { code: 'el', flag: '🇬🇷', label: 'Ελληνικά', labelFr: 'Grec' },
  { code: 'lt', flag: '🇱🇹', label: 'Lietuvių', labelFr: 'Lituanien' },
  { code: 'lv', flag: '🇱🇻', label: 'Latviešu', labelFr: 'Letton' },
  { code: 'sl', flag: '🇸🇮', label: 'Slovenščina', labelFr: 'Slovène' },
  { code: 'et', flag: '🇪🇪', label: 'Eesti', labelFr: 'Estonien' },
  { code: 'pl', flag: '🇵🇱', label: 'Polski', labelFr: 'Polonais' },
  { code: 'ga', flag: '🇮🇪', label: 'Gaeilge', labelFr: 'Irlandais' },
]

// Pour le dev — sera remplacé par le vrai tenant Clerk plus tard

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erreur API')
  return json
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function Input({ label, placeholder, type = 'text', value, onChange, mono, name, autoComplete }: {
  label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void; mono?: boolean; name?: string; autoComplete?: string
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 7 }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        name={name}
        autoComplete={autoComplete || 'off'}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 8,
          border: '1.5px solid #e0e0e0', fontSize: 14,
          fontFamily: mono ? 'monospace' : 'inherit',
          color: '#1a1a1a', background: 'white', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function PlatformToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
      {['WOOCOMMERCE', 'SHOPIFY'].map(p => (
        <button key={p} onClick={() => onChange(p)} style={{
          padding: '11px', borderRadius: 10,
          border: `2px solid ${value === p ? '#1a1a1a' : '#e5e5e5'}`,
          background: value === p ? '#1a1a1a' : 'white',
          color: value === p ? 'white' : '#666',
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          {p === 'WOOCOMMERCE' ? 'WooCommerce' : 'Shopify'}
        </button>
      ))}
    </div>
  )
}

type ConnState = 'idle' | 'loading' | 'success' | 'error'

function ConnectStatus({ state, count, error }: { state: ConnState; count?: number; error?: string }) {
  if (state === 'idle') return null
  const config = {
    loading: { bg: '#f9f9f9', border: '#e5e5e5', color: '#888' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
    error: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
  }[state]
  return (
    <div style={{ marginTop: 10, padding: '11px 14px', borderRadius: 8, background: config.bg, border: `1px solid ${config.border}`, fontSize: 13, color: config.color, fontWeight: 500 }}>
      {state === 'loading' && 'Test en cours…'}
      {state === 'success' && `✓ Connexion réussie${count ? ` — ${count.toLocaleString()} produits détectés` : ''}`}
      {state === 'error' && `✗ ${error || 'Connexion échouée — vérifiez vos clés'}`}
    </div>
  )
}

// ── Step: Welcome ────────────────────────────────────────────────────────────
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <img src={LOGO_DATA_URI} alt="ScaleYourShop" style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', display: 'block', margin: '0 auto 20px' }} />
      <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#1a1a1a', marginBottom: 10 }}>
        Bienvenue sur ScaleYourShop
      </h2>
      <p style={{ fontSize: 15, color: '#888', lineHeight: 1.6, maxWidth: '42ch', margin: '0 auto 32px' }}>
        Connectez votre boutique source et une boutique cible, puis lancez votre premier transfert.
      </p>
      <button onClick={onNext} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#1a1a1a', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
        C&apos;est parti →
      </button>
    </div>
  )
}

// ── Step: Source ─────────────────────────────────────────────────────────────
interface ShopForm {
  platform: string
  url: string
  key: string
  secret: string
  lang: string
  id?: string
}

function StepSource({ source, setSource, onNext, onBack }: {
  source: ShopForm; setSource: (fn: (s: ShopForm) => ShopForm) => void; onNext: () => void; onBack: () => void
}) {
  const [state, setState] = useState<ConnState>('idle')
  const [count, setCount] = useState<number>()
  const [error, setError] = useState<string>()

  const test = async () => {
    setState('loading')
    try {
      const res = await api('/api/shops/test-connection', {
        method: 'POST',
        body: JSON.stringify({
          url: source.url, platform: source.platform,
          apiKey: source.key, apiSecret: source.secret,
        }),
      })
      setCount(res.data.products)
      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setState('error')
    }
  }

  const ready = state === 'success'

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#1a1a1a', marginBottom: 4 }}>Boutique source</h2>
      <p style={{ fontSize: 14, color: '#999', marginBottom: 22 }}>Votre boutique principale.</p>

      <PlatformToggle value={source.platform} onChange={v => { setSource(s => ({ ...s, platform: v })); setState('idle') }} />

      <div style={{ display: 'grid', gap: 14, marginBottom: 16 }}>
        <Input label="URL de la boutique" placeholder="https://ma-boutique.com" value={source.url} onChange={v => { setSource(s => ({ ...s, url: v })); setState('idle') }} name="source-shop-url" autoComplete="url" />
        {source.platform === 'WOOCOMMERCE' ? (
          <>
            <Input label="Consumer Key" placeholder="ck_xxx" value={source.key} onChange={v => { setSource(s => ({ ...s, key: v })); setState('idle') }} mono name="source-consumer-key" autoComplete="off" />
            <Input label="Consumer Secret" placeholder="cs_xxx" type="password" value={source.secret} onChange={v => { setSource(s => ({ ...s, secret: v })); setState('idle') }} mono name="source-consumer-secret" autoComplete="new-password" />
          </>
        ) : (
          <>
              <Input label="Clé API (Client ID)" placeholder="7b0f39e1..." value={source.key} onChange={v => { setSource(s => ({ ...s, key: v })); setState('idle') }} mono name="source-client-id" autoComplete="off" />
              <Input label="Secret API (Client Secret)" placeholder="shpss_xxx" type="password" value={source.secret} onChange={v => { setSource(s => ({ ...s, secret: v })); setState('idle') }} mono name="source-client-secret" autoComplete="new-password" />
            </>
        )}
      </div>

      <button onClick={test} disabled={!source.url || !source.key || state === 'loading' || ready} style={{
        width: '100%', padding: '11px', borderRadius: 10, border: 'none',
        background: source.url && source.key && !ready ? '#1a1a1a' : '#e5e5e5',
        color: source.url && source.key && !ready ? 'white' : '#aaa',
        fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 4,
      }}>
        {state === 'loading' ? 'Test en cours…' : ready ? '✓ Connectée' : 'Tester la connexion'}
      </button>

      <ConnectStatus state={state} count={count} error={error} />

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={onBack} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e5e5', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#888' }}>← Retour</button>
        <button onClick={onNext} disabled={!ready} style={{
          flex: 2, padding: '11px', borderRadius: 10, border: 'none',
          background: ready ? '#1a1a1a' : '#e5e5e5',
          color: ready ? 'white' : '#aaa',
          fontWeight: 700, fontSize: 14, cursor: ready ? 'pointer' : 'not-allowed',
        }}>
          Continuer →
        </button>
      </div>
    </div>
  )
}

// ── Step: Target ─────────────────────────────────────────────────────────────
function StepTarget({ target, setTarget, onNext, onBack }: {
  target: ShopForm; setTarget: (fn: (t: ShopForm) => ShopForm) => void; onNext: () => void; onBack: () => void
}) {
  const [state, setState] = useState<ConnState>('idle')
  const [error, setError] = useState<string>()

  const test = async () => {
    setState('loading')
    try {
      await api('/api/shops/test-connection', {
        method: 'POST',
        body: JSON.stringify({
          url: target.url, platform: target.platform,
          apiKey: target.key, apiSecret: target.secret,
        }),
      })
      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setState('error')
    }
  }

  const ready = state === 'success'
  const selectedLang = LANGS.find(l => l.code === target.lang)

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#1a1a1a', marginBottom: 4 }}>Boutique cible</h2>
      <p style={{ fontSize: 14, color: '#999', marginBottom: 20 }}>La boutique qui recevra le catalogue traduit.</p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8 }}>Langue cible</label>
        <div className="lang-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {LANGS.map(lang => (
            <button key={lang.code} onClick={() => setTarget(t => ({ ...t, lang: lang.code }))} style={{
              padding: '8px 4px', borderRadius: 8,
              border: `2px solid ${target.lang === lang.code ? '#1a1a1a' : '#e5e5e5'}`,
              background: target.lang === lang.code ? '#1a1a1a' : 'white',
              color: target.lang === lang.code ? 'white' : '#555',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{lang.flag}</span>
              <span style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{lang.label}</span>
              <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{lang.labelFr}</span>
            </button>
          ))}
        </div>
        {selectedLang && (
          <div style={{ marginTop: 8, fontSize: 13, color: '#888' }}>
            Sélectionnée : <strong style={{ color: '#1a1a1a' }}>{selectedLang.flag} {selectedLang.label}</strong>
          </div>
        )}
      </div>

      <PlatformToggle value={target.platform} onChange={v => { setTarget(t => ({ ...t, platform: v })); setState('idle') }} />

      <div style={{ display: 'grid', gap: 14, marginBottom: 14 }}>
        <Input label="URL de la boutique cible" placeholder="https://ma-boutique-fr.com" value={target.url} onChange={v => { setTarget(t => ({ ...t, url: v })); setState('idle') }} name="target-shop-url" autoComplete="url" />
        {target.platform === 'WOOCOMMERCE' ? (
          <>
            <Input label="Consumer Key" placeholder="ck_xxx" value={target.key} onChange={v => { setTarget(t => ({ ...t, key: v })); setState('idle') }} mono name="target-consumer-key" autoComplete="off" />
            <Input label="Consumer Secret" placeholder="cs_xxx" type="password" value={target.secret} onChange={v => { setTarget(t => ({ ...t, secret: v })); setState('idle') }} mono name="target-consumer-secret" autoComplete="new-password" />
          </>
        ) : (
          <>
              <Input label="Clé API (Client ID)" placeholder="7b0f39e1..." value={target.key} onChange={v => { setTarget(t => ({ ...t, key: v })); setState('idle') }} mono name="target-client-id" autoComplete="off" />
              <Input label="Secret API (Client Secret)" placeholder="shpss_xxx" type="password" value={target.secret} onChange={v => { setTarget(t => ({ ...t, secret: v })); setState('idle') }} mono name="target-client-secret" autoComplete="new-password" />
            </>
        )}
      </div>

      <button onClick={test} disabled={!target.url || !target.key || !target.lang || state === 'loading' || ready} style={{
        width: '100%', padding: '11px', borderRadius: 10, border: 'none',
        background: target.url && target.key && target.lang && !ready ? '#1a1a1a' : '#e5e5e5',
        color: target.url && target.key && target.lang && !ready ? 'white' : '#aaa',
        fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 4,
      }}>
        {state === 'loading' ? 'Test en cours…' : ready ? '✓ Connectée' : 'Tester la connexion'}
      </button>

      <ConnectStatus state={state} error={error} />

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={onBack} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e5e5', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#888' }}>← Retour</button>
        <button onClick={onNext} disabled={!ready} style={{
          flex: 2, padding: '11px', borderRadius: 10, border: 'none',
          background: ready ? '#1a1a1a' : '#e5e5e5',
          color: ready ? 'white' : '#aaa',
          fontWeight: 700, fontSize: 14, cursor: ready ? 'pointer' : 'not-allowed',
        }}>
          Configurer le transfert →
        </button>
      </div>
    </div>
  )
}

// ── Step: Transfer ───────────────────────────────────────────────────────────
interface Category { id: string; label: string; count: number }

function StepTransfer({ source, target, onDone, onBack }: {
  source: ShopForm; target: ShopForm; onDone: () => void; onBack: () => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [selectedCat, setSelectedCat] = useState('all')
  const [inventMissingDescription, setInventMissingDescription] = useState(true)
  const [launched, setLaunched] = useState(false)
  const [transferId, setTransferId] = useState<string>()
  const [status, setStatus] = useState<{ status: string; progress: number; logs: string[]; doneProducts: number; totalProducts: number; failedProducts: number; stoppedByQuota?: boolean; quotaCap?: number }>()
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (!source.id) return
    api(`/api/categories?shopId=${source.id}`)
      .then(res => { setCategories(res.data); setLoadingCats(false) })
      .catch(() => setLoadingCats(false))
  }, [source.id])

  const launch = async () => {
    setLaunched(true)
    const cat = categories.find(c => c.id === selectedCat)
    try {
      const res = await api('/api/transfers', {
        method: 'POST',
        body: JSON.stringify({
          sourceShopId: source.id,
          targetShopId: target.id,
          categoryId: selectedCat,
          categoryLabel: cat?.label,
          totalProducts: cat?.count,
          options: { invent_missing_description: inventMissingDescription },
        }),
      })
      setTransferId(res.data.id)
    } catch (err) {
      setStatus({ status: 'ERROR', progress: 100, logs: [err instanceof Error ? err.message : 'Erreur'], doneProducts: 0, totalProducts: 0, failedProducts: 1 })
    }
  }

  useEffect(() => {
    if (!transferId) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await api(`/api/transfers/status?id=${transferId}`)
        setStatus(res.data)
        if (['DONE', 'ERROR', 'PARTIAL'].includes(res.data.status)) {
          clearInterval(pollRef.current)
        }
      } catch {
        clearInterval(pollRef.current)
      }
    }, 2000)
    return () => clearInterval(pollRef.current)
  }, [transferId])

  const cat = categories.find(c => c.id === selectedCat)
  const done = status && ['DONE', 'ERROR', 'PARTIAL'].includes(status.status)

  if (!launched) return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#1a1a1a', marginBottom: 4 }}>Transfert</h2>
      <p style={{ fontSize: 14, color: '#999', marginBottom: 16 }}>Choisissez la catégorie à transférer puis lancez.</p>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24, padding: '12px 14px', borderRadius: 10, background: '#f9f9f9', border: '1px solid #e5e5e5', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={inventMissingDescription}
          onChange={e => setInventMissingDescription(e.target.checked)}
          style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }}
        />
        <span style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>
          <strong>Générer une description si absente sur la source</strong><br />
          <span style={{ color: '#999' }}>Si désactivé, les produits sans description resteront sans description sur la boutique cible plutôt que d'en recevoir une générée par IA à partir du titre seul.</span>
        </span>
      </label>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8 }}>Catégorie à transférer</label>
        {loadingCats ? (
          <div style={{ fontSize: 13, color: '#aaa', padding: 20, textAlign: 'center' }}>Chargement des catégories…</div>
        ) : (
          <div style={{ display: 'grid', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCat(c.id)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                border: `2px solid ${selectedCat === c.id ? '#1a1a1a' : '#e5e5e5'}`,
                background: selectedCat === c.id ? '#1a1a1a' : 'white',
                color: selectedCat === c.id ? 'white' : '#444',
              }}>
                <span style={{ fontSize: 13, fontWeight: selectedCat === c.id ? 700 : 500 }}>{c.label}</span>
                <span style={{ fontSize: 12, opacity: 0.6, flexShrink: 0, marginLeft: 12 }}>{c.count.toLocaleString()} produits</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e5e5', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#888' }}>← Retour</button>
        <button onClick={launch} disabled={loadingCats} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#1a1a1a', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Lancer le transfert →
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#1a1a1a', marginBottom: 4 }}>
        {done ? (status?.status === 'DONE' ? '🎉 Transfert terminé !' : status?.stoppedByQuota ? '⏸ Transfert arrêté — quota atteint' : '⚠ Transfert terminé avec erreurs') : 'Transfert en cours…'}
      </h2>
      <p style={{ fontSize: 14, color: '#999', marginBottom: 16 }}>
        {done ? `${status?.doneProducts} réussis · ${status?.failedProducts} échecs` : 'Ne fermez pas cette fenêtre.'}
      </p>

      {done && status?.stoppedByQuota && (
        <div style={{ padding: '14px 16px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e', marginBottom: 4 }}>
            Limite de votre plan atteinte ({status.quotaCap} produit{status.quotaCap === 1 ? '' : 's'})
          </div>
          <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
            Le reste de la catégorie n&apos;a pas été transféré faute de quota disponible.{' '}
            <a href="/settings" style={{ color: '#92400e', fontWeight: 700, textDecoration: 'underline' }}>
              Passez à un plan supérieur
            </a>{' '}
            pour transférer le reste.
          </div>
        </div>
      )}

      {!done && status && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#aaa' }}>Progression</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{status.progress}%</span>
          </div>
          <div style={{ height: 5, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${status.progress}%`, background: '#1a1a1a', borderRadius: 999, transition: 'width 500ms ease' }} />
          </div>
        </div>
      )}

      <div style={{ background: '#0d0d0d', borderRadius: 10, padding: 14, minHeight: 160, maxHeight: 260, overflowY: 'auto', marginBottom: 20 }}>
        {(status?.logs || ['En attente du worker…']).map((log, i) => (
          <div key={i} style={{ fontSize: 12, color: '#d4d4d4', lineHeight: 1.8, fontFamily: 'monospace' }}>{log}</div>
        ))}
        {!done && <span style={{ fontSize: 12, color: '#555', fontFamily: 'monospace' }}>▌</span>}
      </div>

      {done && (
        <button onClick={onDone} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#1a1a1a', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          Accéder au dashboard →
        </button>
      )}
    </div>
  )
}

// ── Progress steps ────────────────────────────────────────────────────────────
function ProgressSteps({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}>
      {STEPS.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div className="step-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: i <= current ? '#1a1a1a' : '#e5e5e5',
              color: i <= current ? 'white' : '#bbb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, transition: 'all 300ms',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="step-label" style={{ fontSize: 10, color: i === current ? '#1a1a1a' : '#bbb', fontWeight: i === current ? 700 : 400, whiteSpace: 'nowrap' }}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="step-connector" style={{ width: 44, height: 2, background: i < current ? '#1a1a1a' : '#e5e5e5', margin: '0 4px', marginBottom: 18 }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)
  const [source, setSource] = useState<ShopForm>({ platform: 'WOOCOMMERCE', url: '', key: '', secret: '', lang: '' })
  const [target, setTarget] = useState<ShopForm>({ platform: 'WOOCOMMERCE', url: '', key: '', secret: '', lang: 'fr' })

  // Crée la boutique source en base avant de passer à l'étape suivante
  const handleSourceNext = async () => {
    try {
      const res = await api('/api/shops', {
        method: 'POST',
        body: JSON.stringify({
          name: new URL(source.url.startsWith('http') ? source.url : 'https://' + source.url).hostname,
          url: source.url, platform: source.platform, role: 'SOURCE',
          apiKey: source.key, apiSecret: source.secret,
        }),
      })
      setSource(s => ({ ...s, id: res.data.id }))
      setStep(2)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur création boutique source')
    }
  }

  const handleTargetNext = async () => {
    try {
      const res = await api('/api/shops', {
        method: 'POST',
        body: JSON.stringify({
          name: new URL(target.url.startsWith('http') ? target.url : 'https://' + target.url).hostname,
          url: target.url, platform: target.platform, role: 'TARGET', lang: target.lang,
          apiKey: target.key, apiSecret: target.secret,
        }),
      })
      setTarget(t => ({ ...t, id: res.data.id }))
      setStep(3)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur création boutique cible')
    }
  }

  if (finished) return (
    <div style={{ minHeight: '100dvh', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 20 }}>🚀</div>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: '#1a1a1a', letterSpacing: '-1px', marginBottom: 10 }}>Tout est en ligne !</h1>
        <a href="/dashboard" style={{ display: 'inline-block', padding: '13px 36px', borderRadius: 999, border: 'none', background: '#1a1a1a', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
          Voir le dashboard →
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: '#f9f9f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="onboarding-header" style={{ background: 'white', borderBottom: '1px solid #e5e5e5', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={LOGO_DATA_URI} alt="ScaleYourShop" style={{ width: 30, height: 30, borderRadius: 7, objectFit: 'cover' }} />
        <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px', color: '#1a1a1a' }}>Scale<span style={{ color: '#FA0C00' }}>Your</span>Shop</span>
        <span style={{ fontSize: 13, color: '#bbb', marginLeft: 8 }}>— Configuration</span>
      </div>

      <div className="onboarding-container" style={{ maxWidth: 520, margin: '50px auto', padding: '0 24px' }}>
        <ProgressSteps current={step} />
        <div className="onboarding-card" style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e5e5', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
          {step === 1 && <StepSource source={source} setSource={setSource} onNext={handleSourceNext} onBack={() => setStep(0)} />}
          {step === 2 && <StepTarget target={target} setTarget={setTarget} onNext={handleTargetNext} onBack={() => setStep(1)} />}
          {step === 3 && <StepTransfer source={source} target={target} onDone={() => setFinished(true)} onBack={() => setStep(2)} />}
        </div>
      </div>

      <ResponsiveStyles css={`
        @media (max-width: 860px) {
          .onboarding-header { padding: 14px 20px !important; }
          .onboarding-container { padding: 0 16px !important; margin: 28px auto !important; }
          .onboarding-card { padding: 24px !important; }
        }
        @media (max-width: 480px) {
          .onboarding-header { padding: 12px 14px !important; gap: 8px !important; }
          .onboarding-card { padding: 18px !important; }
          .step-connector { width: 16px !important; margin: 0 2px !important; }
          .step-label { font-size: 8px !important; max-width: 56px; overflow: hidden; text-overflow: ellipsis; display: inline-block; }
          .lang-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `} />
    </div>
  )
}
