'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { LOGO_DATA_URI } from '@/lib/logo'
import ResponsiveStyles from '@/components/ResponsiveStyles'

const NAV = [
  { label: 'Tableau de bord', href: '/dashboard' },
  { label: 'Transferts', href: '/transfers' },
  { label: 'Boutiques', href: '/shops' },
  { label: 'Paramètres', href: '/settings' },
]

export default function Sidebar({ plan }: { plan?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <>
      <div className="app-topbar" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 56, background: 'white', borderBottom: '1px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 500 }}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src={LOGO_DATA_URI} alt="ScaleYourShop" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }} />
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.3px', color: '#1a1a1a' }}>Scale<span style={{ color: '#FA0C00' }}>Your</span>Shop</span>
        </a>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#1a1a1a', padding: 6, lineHeight: 1 }}
        >
          ☰
        </button>
      </div>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 998 }}
        />
      )}

      <aside className={`app-sidebar${mobileOpen ? ' open' : ''}`} style={{ width: 220, background: 'white', borderRight: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100dvh', position: 'sticky', top: 0, zIndex: 999 }}>
        <a href="/dashboard" style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src={LOGO_DATA_URI} alt="ScaleYourShop" style={{ width: 30, height: 30, borderRadius: 7, objectFit: 'cover' }} />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px', color: '#1a1a1a' }}>Scale<span style={{ color: '#FA0C00' }}>Your</span>Shop</span>
        </a>

        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map(item => {
            const isActive = pathname === item.href
            return (
              <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)} style={{
                display: 'block', textAlign: 'left', padding: '9px 12px', borderRadius: 8, textDecoration: 'none',
                background: isActive ? '#f5f5f5' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14, color: isActive ? '#1a1a1a' : '#888',
                marginBottom: 2,
              }}>
                {item.label}
              </a>
            )
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
          <a href="/onboarding" onClick={() => setMobileOpen(false)} style={{ display: 'block', textAlign: 'center', padding: '9px', borderRadius: 8, border: '1.5px solid #e5e5e5', fontSize: 13, fontWeight: 600, color: '#1a1a1a', textDecoration: 'none', marginBottom: 12 }}>
            + Nouveau transfert
          </a>
          {plan && (
            <div style={{ padding: '12px', borderRadius: 10, background: '#f9f9f9', border: '1px solid #e5e5e5', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: '0.8px', marginBottom: 4 }}>PLAN ACTUEL</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a1a' }}>{plan}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: 'block', width: '100%', textAlign: 'center', padding: '9px',
              borderRadius: 8, border: 'none', background: 'transparent',
              fontSize: 13, fontWeight: 600, color: '#bbb', cursor: loggingOut ? 'default' : 'pointer',
            }}
          >
            {loggingOut ? 'Déconnexion…' : 'Déconnexion'}
          </button>
        </div>
      </aside>

      <ResponsiveStyles css={`
        @media (max-width: 860px) {
          .app-topbar { display: flex !important; }
          .app-layout { flex-direction: column !important; }
          .app-sidebar {
            position: fixed !important;
            top: 0; left: 0;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 2px 0 24px rgba(0,0,0,0.15);
          }
          .app-sidebar.open { transform: translateX(0) !important; }
        }
      `} />
    </>
  )
}
