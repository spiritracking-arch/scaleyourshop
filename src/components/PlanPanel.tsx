'use client'

import { useEffect, useState } from 'react'
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

const PLAN_INFO: Record<string, { label: string; price: string; limits: string }> = {
  FREE: { label: 'Free', price: 'Gratuit', limits: '5 produits au total · 2 boutiques' },
  STARTER: { label: 'Starter', price: '49€ (one-shot)', limits: '100 produits au total · 3 boutiques' },
  GROWTH: { label: 'Growth', price: '99€/mois', limits: '500 produits/mois · 10 boutiques' },
  BUSINESS: { label: 'Business', price: '299€/mois', limits: '5 000 produits/mois · boutiques illimitées' },
}

const STARTER_PRICE = 49
const GROWTH_MONTHLY = 99
const GROWTH_ANNUAL_MONTHLY_EQUIV = Math.round(GROWTH_MONTHLY * 0.8)
const GROWTH_ANNUAL_TOTAL = Math.round(GROWTH_MONTHLY * 0.8 * 12)
const BUSINESS_MONTHLY = 299
const BUSINESS_ANNUAL_MONTHLY_EQUIV = Math.round(BUSINESS_MONTHLY * 0.8)
const BUSINESS_ANNUAL_TOTAL = Math.round(BUSINESS_MONTHLY * 0.8 * 12)

export default function PlanPanel() {
  const [plan, setPlan] = useState('FREE')
  const [quotaUsed, setQuotaUsed] = useState(0)
  const [quotaLimit, setQuotaLimit] = useState<number | null>(null)
  const [quotaType, setQuotaType] = useState<'lifetime' | 'monthly'>('lifetime')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState('')
  const [annualBilling, setAnnualBilling] = useState(false)

  useEffect(() => {
    api('/api/dashboard').then(res => {
      setPlan(res.data.plan)
      setQuotaUsed(res.data.quotaUsed)
      setQuotaLimit(res.data.quotaLimit)
      setQuotaType(res.data.quotaType)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const info = PLAN_INFO[plan] || PLAN_INFO.FREE

  const startCheckout = async (targetPlan: 'STARTER' | 'GROWTH' | 'BUSINESS') => {
    setCheckoutLoading(targetPlan)
    setCheckoutError('')
    try {
      const res = await api('/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          plan: targetPlan,
          billingPeriod: targetPlan !== 'STARTER' && annualBilling ? 'annual' : 'monthly',
        }),
      })
      if (res.data?.url) {
        window.location.href = res.data.url
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Erreur lors de la création du paiement')
      setCheckoutLoading(null)
    }
  }

  if (loading) {
    return <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5e5', padding: 24, marginBottom: 20, color: '#aaa', fontSize: 14 }}>Chargement du plan…</div>
  }

  return (
    <>
      {checkoutError && (
        <div style={{ padding: '14px 18px', borderRadius: 10, background: '#fef2f2', color: '#991b1b', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
          {checkoutError}
        </div>
      )}

      {plan === 'FREE' ? (
        <div style={{ background: '#fffbeb', borderRadius: 16, padding: 24, border: '2px solid #fde68a', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#92400e', letterSpacing: '0.8px', padding: '3px 10px', borderRadius: 999, background: '#fde68a' }}>ESSAI GRATUIT</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-1px', color: '#1a1a1a', marginBottom: 4 }}>
            {quotaUsed} / {quotaLimit ?? '∞'} produits utilisés
          </div>
          <div style={{ height: 8, borderRadius: 999, background: '#fef3c7', overflow: 'hidden', marginTop: 12, marginBottom: 10 }}>
            <div style={{
              height: '100%', borderRadius: 999, background: '#d97706',
              width: `${quotaLimit ? Math.min(100, Math.round((quotaUsed / quotaLimit) * 100)) : 0}%`,
              transition: 'width 300ms ease',
            }} />
          </div>
          <div style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
            {quotaLimit !== null && quotaUsed >= quotaLimit
              ? "Quota d'essai épuisé — passez à un plan payant pour continuer."
              : `Plus que ${quotaLimit !== null ? quotaLimit - quotaUsed : '?'} produit(s) disponible(s) à l'essai. Aucune carte requise pour tester.`}
          </div>
        </div>
      ) : (
        <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 24, color: 'white', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#666', fontWeight: 700, letterSpacing: '0.8px', marginBottom: 6 }}>PLAN ACTUEL</div>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-1px', marginBottom: 4 }}>{info.label}</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>{info.price} · {info.limits}</div>
          {quotaLimit !== null && (
            <>
              <div style={{ height: 6, borderRadius: 999, background: '#333', overflow: 'hidden', marginBottom: 6 }}>
                <div style={{
                  height: '100%', borderRadius: 999, background: 'white',
                  width: `${Math.min(100, Math.round((quotaUsed / quotaLimit) * 100))}%`,
                  transition: 'width 300ms ease',
                }} />
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {quotaUsed}/{quotaLimit} produits {quotaType === 'lifetime' ? 'au total' : 'ce mois'}
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e5e5', padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>Changer de plan</div>
          <div style={{ display: 'inline-flex', background: '#f0f0f0', borderRadius: 999, padding: 3 }}>
            {[{ label: 'Mensuel', val: false }, { label: 'Annuel −20%', val: true }].map(({ label, val }) => (
              <button key={label} onClick={() => setAnnualBilling(val)} style={{
                padding: '6px 14px', borderRadius: 999, border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                background: annualBilling === val ? 'white' : 'transparent',
                color: annualBilling === val ? '#1a1a1a' : '#787878',
                boxShadow: annualBilling === val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {annualBilling && (
          <div style={{ fontSize: 11, color: '#999', marginBottom: 14, lineHeight: 1.5 }}>
            Facturation annuelle (Growth et Business) · Payé d'avance, non remboursable · Renouvellement automatique, annulable à tout moment avant l'échéance.
          </div>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          <div className="plan-row" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            padding: '14px 16px', borderRadius: 10, border: plan === 'STARTER' ? '2px solid #1a1a1a' : '1px solid #e5e5e5',
            background: plan === 'STARTER' ? '#f9f9f9' : 'white',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>Starter — {STARTER_PRICE}€</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>Paiement unique · 100 produits au total · 3 boutiques</div>
            </div>
            {plan === 'STARTER' ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#999', whiteSpace: 'nowrap' }}>Plan actuel</span>
            ) : (
              <button
                className="plan-row-btn"
                onClick={() => startCheckout('STARTER')}
                disabled={checkoutLoading !== null}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none', whiteSpace: 'nowrap',
                  background: '#1a1a1a', color: 'white', fontWeight: 600, fontSize: 13,
                  cursor: checkoutLoading !== null ? 'default' : 'pointer',
                  opacity: checkoutLoading !== null && checkoutLoading !== 'STARTER' ? 0.5 : 1,
                }}
              >
                {checkoutLoading === 'STARTER' ? 'Redirection…' : 'Choisir'}
              </button>
            )}
          </div>

          <div className="plan-row" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            padding: '14px 16px', borderRadius: 10, border: plan === 'GROWTH' ? '2px solid #1a1a1a' : '1px solid #e5e5e5',
            background: plan === 'GROWTH' ? '#f9f9f9' : 'white',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>
                Growth — {annualBilling ? `${GROWTH_ANNUAL_MONTHLY_EQUIV}€/mois` : `${GROWTH_MONTHLY}€/mois`}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                {annualBilling
                  ? `Facturé ${GROWTH_ANNUAL_TOTAL}€/an · 500 produits/mois · 10 boutiques`
                  : 'Abonnement mensuel · 500 produits/mois · 10 boutiques'}
              </div>
            </div>
            {plan === 'GROWTH' ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#999', whiteSpace: 'nowrap' }}>Plan actuel</span>
            ) : (
              <button
                className="plan-row-btn"
                onClick={() => startCheckout('GROWTH')}
                disabled={checkoutLoading !== null}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none', whiteSpace: 'nowrap',
                  background: '#1a1a1a', color: 'white', fontWeight: 600, fontSize: 13,
                  cursor: checkoutLoading !== null ? 'default' : 'pointer',
                  opacity: checkoutLoading !== null && checkoutLoading !== 'GROWTH' ? 0.5 : 1,
                }}
              >
                {checkoutLoading === 'GROWTH' ? 'Redirection…' : 'Choisir'}
              </button>
            )}
          </div>

          <div className="plan-row" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            padding: '14px 16px', borderRadius: 10, border: plan === 'BUSINESS' ? '2px solid #1a1a1a' : '1px solid #e5e5e5',
            background: plan === 'BUSINESS' ? '#f9f9f9' : 'white',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>
                Business — {annualBilling ? `${BUSINESS_ANNUAL_MONTHLY_EQUIV}€/mois` : `${BUSINESS_MONTHLY}€/mois`}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                {annualBilling
                  ? `Facturé ${BUSINESS_ANNUAL_TOTAL}€/an · 5 000 produits/mois · boutiques illimitées`
                  : '5 000 produits/mois · boutiques illimitées · onboarding personnalisé'}
              </div>
            </div>
            {plan === 'BUSINESS' ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#999', whiteSpace: 'nowrap' }}>Plan actuel</span>
            ) : (
              <button
                className="plan-row-btn"
                onClick={() => startCheckout('BUSINESS')}
                disabled={checkoutLoading !== null}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none', whiteSpace: 'nowrap',
                  background: '#1a1a1a', color: 'white', fontWeight: 600, fontSize: 13,
                  cursor: checkoutLoading !== null ? 'default' : 'pointer',
                  opacity: checkoutLoading !== null && checkoutLoading !== 'BUSINESS' ? 0.5 : 1,
                }}
              >
                {checkoutLoading === 'BUSINESS' ? 'Redirection…' : 'Choisir'}
              </button>
            )}
          </div>
        </div>
      </div>

      <ResponsiveStyles css={`
        @media (max-width: 860px) {
          .plan-row { flex-direction: column !important; align-items: stretch !important; }
          .plan-row-btn { width: 100% !important; }
        }
      `} />
    </>
  )
}
