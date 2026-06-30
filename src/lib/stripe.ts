import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

export type PlanId = 'STARTER' | 'GROWTH' | 'BUSINESS'
export type BillingPeriod = 'monthly' | 'annual'

interface PlanConfig {
  name: string
  mode: 'payment' | 'subscription'
  monthlyAmountCents: number
  annualAmountCents?: number // uniquement pour les plans en abonnement (subscription)
}

export const STRIPE_PLANS: Record<PlanId, PlanConfig> = {
  STARTER: {
    name: 'ScaleYourShop — Starter',
    mode: 'payment',
    monthlyAmountCents: 4900,
  },
  GROWTH: {
    name: 'ScaleYourShop — Growth',
    mode: 'subscription',
    monthlyAmountCents: 9900,
    annualAmountCents: Math.round(9900 * 12 * 0.8),
  },
  BUSINESS: {
    name: 'ScaleYourShop — Business',
    mode: 'subscription',
    monthlyAmountCents: 29900,
    annualAmountCents: Math.round(29900 * 12 * 0.8),
  },
}
