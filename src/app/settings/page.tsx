'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import PlanPanel from '@/components/PlanPanel'
import ResponsiveStyles from '@/components/ResponsiveStyles'

async function api(path: string) {
  const res = await fetch(path)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erreur API')
  return json
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const checkoutStatus = searchParams.get('checkout')

  useEffect(() => {
    api('/api/auth/me').then(res => setEmail(res.data.email)).catch(() => {})
  }, [])

  return (
    <div className="app-layout" style={{ display: 'flex', minHeight: '100dvh', background: '#f9f9f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />

      <div className="app-content" style={{ padding: '32px 40px', flex: 1, maxWidth: 700, minWidth: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '0 0 24px' }}>Paramètres</h1>

        {checkoutStatus === 'success' && (
          <div style={{ padding: '14px 18px', borderRadius: 10, background: '#f0fdf4', color: '#166534', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
            ✓ Paiement confirmé — votre plan a été mis à jour.
          </div>
        )}
        {checkoutStatus === 'cancelled' && (
          <div style={{ padding: '14px 18px', borderRadius: 10, background: '#fffbeb', color: '#92400e', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
            Paiement annulé — votre plan n'a pas changé.
          </div>
        )}
        {checkoutStatus === 'error' && (
          <div style={{ padding: '14px 18px', borderRadius: 10, background: '#fef2f2', color: '#991b1b', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
            Votre compte a été créé, mais le paiement n'a pas pu démarrer. Choisissez un plan ci-dessous pour réessayer.
          </div>
        )}

        <PlanPanel />

        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5e5', padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', marginBottom: 4 }}>Compte</div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>Tenant de développement</div>
          <div style={{ fontSize: 13, color: '#666', fontFamily: 'monospace', wordBreak: 'break-all' }}>{email}</div>
        </div>

        <a href="/shops" style={{ display: 'block', padding: '16px 20px', borderRadius: 12, border: '1px solid #e5e5e5', background: 'white', textDecoration: 'none', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', marginBottom: 2 }}>Gérer les boutiques →</div>
          <div style={{ fontSize: 13, color: '#999' }}>Ajouter, modifier ou supprimer vos boutiques connectées</div>
        </a>
      </div>

      <ResponsiveStyles css={`
        @media (max-width: 860px) {
          .app-content { padding: 20px 16px !important; max-width: 100% !important; }
        }
      `} />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#aaa' }}>Chargement…</div>}>
      <SettingsContent />
    </Suspense>
  )
}
