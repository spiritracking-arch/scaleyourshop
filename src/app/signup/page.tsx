'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LOGO_DATA_URI } from '@/lib/logo'

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter — 49€ (paiement unique)',
  GROWTH: 'Growth — 99€/mois',
  BUSINESS: 'Business — 299€/mois',
}

function SignupContent() {
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan')
  const billingParam = searchParams.get('billing')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')

      if (planParam && planParam !== 'FREE') {
        try {
          const checkoutRes = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              plan: planParam,
              billingPeriod: billingParam === 'annual' ? 'annual' : 'monthly',
            }),
          })
          const checkoutJson = await checkoutRes.json()
          if (checkoutRes.ok && checkoutJson.data && checkoutJson.data.url) {
            window.location.href = checkoutJson.data.url
            return
          }
          window.location.href = '/settings?checkout=error'
          return
        } catch (e) {
          window.location.href = '/settings?checkout=error'
          return
        }
      }

      window.location.href = '/onboarding'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }

  const valid = email && password.length >= 8

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: 380, padding: 36, background: 'white', borderRadius: 20, border: '1px solid #e5e5e5', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={LOGO_DATA_URI} alt="ScaleYourShop" style={{ width: 44, height: 44, borderRadius: 10, margin: '0 auto 16px', objectFit: 'cover', display: 'block' }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Créer un compte</h1>
        </div>

        {planParam && PLAN_LABELS[planParam] && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f0f9ff', border: '1px solid #bae6fd', fontSize: 13, color: '#075985', marginBottom: 20, textAlign: 'center' }}>
            Vous allez démarrer avec le plan <strong>{PLAN_LABELS[planParam]}</strong>
          </div>
        )}

        <a href={`/api/auth/google${planParam ? `?plan=${planParam}${billingParam ? `&billing=${billingParam}` : ''}` : ''}`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          width: '100%', padding: '11px', borderRadius: 10, border: '1.5px solid #e0e0e0',
          background: 'white', color: '#1a1a1a', fontWeight: 600, fontSize: 14,
          textDecoration: 'none', marginBottom: 20, boxSizing: 'border-box',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.08-1.81 2.72v2.26h2.92c1.7-1.57 2.69-3.88 2.69-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33C2.44 15.98 5.48 18 9 18z"/>
            <path fill="#FBBC05" d="M3.97 10.72c-.18-.54-.28-1.12-.28-1.72s.1-1.18.28-1.72V4.95H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          Continuer avec Google
        </a>

        <a href={`/api/auth/github${planParam ? `?plan=${planParam}${billingParam ? `&billing=${billingParam}` : ''}` : ''}`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          width: '100%', padding: '11px', borderRadius: 10, border: '1.5px solid #e0e0e0',
          background: 'white', color: '#1a1a1a', fontWeight: 600, fontSize: 14,
          textDecoration: 'none', marginBottom: 20, boxSizing: 'border-box',
        }}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="#1a1a1a">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Continuer avec GitHub
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
          <span style={{ fontSize: 12, color: '#bbb' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
        </div>

        <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>Nom</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Marc Dubois"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="vous@exemple.com"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>Mot de passe</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="8 caractères minimum"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
        </div>

        {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <button onClick={submit} disabled={!valid || loading} style={{
          width: '100%', padding: '12px', borderRadius: 10, border: 'none',
          background: valid ? '#1a1a1a' : '#e5e5e5',
          color: valid ? 'white' : '#aaa',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 16,
        }}>
          {loading ? (planParam && planParam !== 'FREE' ? 'Redirection vers le paiement…' : 'Création…') : 'Créer mon compte'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#999' }}>
          Déjà un compte ? <a href="/login" style={{ color: '#1a1a1a', fontWeight: 600 }}>Se connecter</a>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Chargement…</div>}>
      <SignupContent />
    </Suspense>
  )
}
