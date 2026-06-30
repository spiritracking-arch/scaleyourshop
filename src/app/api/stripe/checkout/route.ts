import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { stripe, STRIPE_PLANS, type PlanId, type BillingPeriod } from '@/lib/stripe'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req)
    if (!tenantId) return NextResponse.json<ApiResponse>({ error: 'Missing tenant' }, { status: 401 })

    const { plan, billingPeriod } = await req.json() as { plan?: PlanId; billingPeriod?: BillingPeriod }

    if (!plan || !STRIPE_PLANS[plan]) {
      return NextResponse.json<ApiResponse>({ error: 'Plan invalide' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return NextResponse.json<ApiResponse>({ error: 'Tenant introuvable' }, { status: 404 })

    const config = STRIPE_PLANS[plan]
    const isAnnual = config.mode === 'subscription' && billingPeriod === 'annual' && !!config.annualAmountCents
    const amountCents = isAnnual ? config.annualAmountCents! : config.monthlyAmountCents
    const interval: 'month' | 'year' = isAnnual ? 'year' : 'month'

    // Créer ou réutiliser le Customer Stripe
    let stripeCustomerId = tenant.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: tenant.email,
        name: tenant.name,
        metadata: { tenantId },
      })
      stripeCustomerId = customer.id
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId },
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scaleyourshop.app'

    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: config.name + (isAnnual ? ' (facturation annuelle)' : '') },
            unit_amount: amountCents,
            ...(config.mode === 'subscription' ? { recurring: { interval } } : {}),
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/settings?checkout=success`,
      cancel_url: `${baseUrl}/settings?checkout=cancelled`,
      metadata: { tenantId, plan, billingPeriod: isAnnual ? 'annual' : 'monthly' },
      ...(config.mode === 'subscription'
        ? { subscription_data: { metadata: { tenantId, plan, billingPeriod: isAnnual ? 'annual' : 'monthly' } } }
        : { payment_intent_data: { metadata: { tenantId, plan } } }),
    })

    return NextResponse.json<ApiResponse>({ data: { url: session.url } })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    console.error('[stripe checkout]', err)
    return NextResponse.json<ApiResponse>({ error: message }, { status: 500 })
  }
}
