'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LOGO_DATA_URI } from '@/lib/logo'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const mismatch = confirm.length > 0 && password !== confirm
  const tooShort = password.length > 0 && password.length < 8
  const canSubmit = token && password.length >= 8 && password === confirm

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', fontFamily: 'system-ui, -apple-system, sans-serif', padding: 16 }}>
      <div style={{ width: 380, maxWidth: '100%', padding: 36, background: 'white', borderRadius: 20, border: '1px solid #e5e5e5', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={LOGO_DATA_URI} alt="ScaleYourShop" style={{ width: 44, height: 44, borderRadius: 10, margin: '0 auto 16px', objectFit: 'cover', display: 'block' }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Nouveau mot de passe</h1>
        </div>

        {!token ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: '#fef2f2', color: '#991b1b', fontSize: 14, fontWeight: 600, marginBottom: 20, lineHeight: 1.6 }}>
              Lien invalide — aucun token trouvé. Demandez un nouveau lien de réinitialisation.
            </div>
            <a href="/forgot-password" style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>Demander un nouveau lien →</a>
          </div>
        ) : done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f0fdf4', color: '#166534', fontSize: 14, fontWeight: 600, marginBottom: 20, lineHeight: 1.6 }}>
              ✓ Mot de passe mis à jour avec succès.
            </div>
            <a href="/login" style={{ display: 'inline-block', padding: '11px 28px', borderRadius: 10, border: 'none', background: '#1a1a1a', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Se connecter →
            </a>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>Nouveau mot de passe</label>
                <input
                  value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, boxSizing: 'border-box' }}
                />
                {tooShort && <div style={{ fontSize: 12, color: '#d97706', marginTop: 6 }}>Au moins 8 caractères</div>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>Confirmer le mot de passe</label>
                <input
                  value={confirm} onChange={e => setConfirm(e.target.value)} type="password" placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && canSubmit && !loading && submit()}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, boxSizing: 'border-box' }}
                />
                {mismatch && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>Les mots de passe ne correspondent pas</div>}
              </div>
            </div>

            {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, marginBottom: 16 }}>{error}</div>}

            <button onClick={submit} disabled={!canSubmit || loading} style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: canSubmit ? '#1a1a1a' : '#e5e5e5',
              color: canSubmit ? 'white' : '#aaa',
              fontWeight: 700, fontSize: 14, cursor: canSubmit && !loading ? 'pointer' : 'default',
            }}>
              {loading ? 'Mise à jour…' : 'Réinitialiser le mot de passe'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Chargement…</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
