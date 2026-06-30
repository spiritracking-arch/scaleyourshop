import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scaleyourshop.app'
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = req.cookies.get('oauth_state')?.value
  const oauthPlan = req.cookies.get('oauth_plan')?.value
  const oauthBilling = req.cookies.get('oauth_billing')?.value

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_state`)
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/google/callback`

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('[google oauth] token exchange failed', errText)
      throw new Error('Échec échange token Google')
    }
    const tokenJson = await tokenRes.json() as { access_token: string }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    })
    if (!userRes.ok) throw new Error('Échec récupération profil Google')
    const googleUser = await userRes.json() as { email: string; name?: string }

    if (!googleUser.email) throw new Error('Email Google manquant')

    let tenant = await prisma.tenant.findUnique({ where: { email: googleUser.email } })
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          passwordHash: null,
        },
      })
    }

    const token = await new SignJWT({ tenantId: tenant.id, email: tenant.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(JWT_SECRET)

    // Si un plan payant avait été choisi avant de partir sur Google, déclencher le Checkout directement
    let redirectTo = `${baseUrl}/dashboard`
    if (oauthPlan && oauthPlan !== 'FREE') {
      try {
        const checkoutRes = await fetch(`${baseUrl}/api/stripe/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: `session=${token}` },
          body: JSON.stringify({
            plan: oauthPlan,
            billingPeriod: oauthBilling === 'annual' ? 'annual' : 'monthly',
          }),
        })
        const checkoutJson = await checkoutRes.json()
        if (checkoutRes.ok && checkoutJson.data?.url) {
          redirectTo = checkoutJson.data.url
        } else {
          redirectTo = `${baseUrl}/settings?checkout=error`
        }
      } catch (e) {
        console.error('[google oauth] checkout trigger failed', e)
        redirectTo = `${baseUrl}/settings?checkout=error`
      }
    }

    const res = NextResponse.redirect(redirectTo)
    res.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    res.cookies.delete('oauth_state')
    res.cookies.delete('oauth_plan')
    res.cookies.delete('oauth_billing')
    return res
  } catch (err) {
    console.error('[google oauth]', err)
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`)
  }
}
