import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { sendPaymentOkEmail, sendPaymentFailedEmail } from '@/lib/email'
import type Stripe from 'stripe'

async function getCardLast4(paymentIntentId: string | null): Promise<string> {
  if (!paymentIntentId) return '----'
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['payment_method'] })
    const pm = pi.payment_method
    if (pm && typeof pm !== 'string' && pm.card) return pm.card.last4
  } catch (err) {
    console.error('[stripe webhook] getCardLast4 failed', err)
  }
  return '----'
}

export async function POST(req: NextRequest) {
  console.log('[stripe webhook] Requête reçue à', new Date().toISOString())
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe webhook] Signature invalide', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const tenantId = session.metadata?.tenantId
        const plan = session.metadata?.plan as 'STARTER' | 'GROWTH' | undefined
        if (!tenantId || !plan) break

        const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : null

        const tenant = await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            plan,
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
            stripeSubscriptionId,
          },
        })

        // Récupérer le last4 (best-effort) — disponible seulement pour les paiements uniques (Starter),
        // pas pour les abonnements (Growth) où l'API Stripe n'expose pas directement le payment_intent
        const paymentIntentId: string | null = typeof session.payment_intent === 'string' ? session.payment_intent : null
        const last4 = await getCardLast4(paymentIntentId)
        const amount = `${((session.amount_total || 0) / 100).toFixed(2)}€`

        sendPaymentOkEmail(tenant.email, { plan, amount, last4 }).catch(() => {})
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
        if (!customerId) break

        const tenant = await prisma.tenant.findUnique({ where: { stripeCustomerId: customerId } })
        if (!tenant) break

        const last4 = '----'
        const amount = `${((invoice.amount_due || 0) / 100).toFixed(2)}€`

        sendPaymentFailedEmail(tenant.email, { amount, last4 }).catch(() => {})
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const tenant = await prisma.tenant.findFirst({ where: { stripeSubscriptionId: sub.id } })
        if (!tenant) break

        // Un abonnement annulé retombe sur FREE — STARTER est un palier payant (49€)
        // qui doit être acheté explicitement, jamais accordé automatiquement.
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { plan: 'FREE', stripeSubscriptionId: null },
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        if (sub.status === 'canceled' || sub.status === 'unpaid') {
          const tenant = await prisma.tenant.findFirst({ where: { stripeSubscriptionId: sub.id } })
          if (tenant) {
            // Même règle que customer.subscription.deleted : retour sur FREE, pas STARTER.
            await prisma.tenant.update({
              where: { id: tenant.id },
              data: { plan: 'FREE', stripeSubscriptionId: null },
            })
          }
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[stripe webhook] Erreur de traitement', event.type, err)
    // On répond 200 quand même pour éviter que Stripe ne retente indéfiniment
    // un événement qu'on ne saura jamais traiter correctement
  }

  return NextResponse.json({ received: true })
}
