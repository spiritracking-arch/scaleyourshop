'use client'

import { useState } from 'react'
import { LOGO_DATA_URI } from '@/lib/logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur')
      setSent(true)
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
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Mot de passe oublié</h1>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f0fdf4', color: '#166534', fontSize: 14, fontWeight: 600, marginBottom: 20, lineHeight: 1.6 }}>
              Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé. Vérifiez votre boîte mail.
            </div>
            <a href="/login" style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>← Retour à la connexion</a>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 24, textAlign: 'center' }}>
              Indiquez votre email, nous vous envoyons un lien pour choisir un nouveau mot de passe.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>Email</label>
              <input
                value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="vous@exemple.com"
                onKeyDown={e => e.key === 'Enter' && email && !loading && submit()}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, marginBottom: 16 }}>{error}</div>}

            <button onClick={submit} disabled={!email || loading} style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: email ? '#1a1a1a' : '#e5e5e5',
              color: email ? 'white' : '#aaa',
              fontWeight: 700, fontSize: 14, cursor: email && !loading ? 'pointer' : 'default', marginBottom: 16,
            }}>
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#999' }}>
              <a href="/login" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>← Retour à la connexion</a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
