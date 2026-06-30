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
    const redirectUri = `${baseUrl}/api/auth/github/callback`

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) throw new Error('Échec échange token GitHub')
    const tokenJson = await tokenRes.json() as { access_token?: string; error?: string }
    if (!tokenJson.access_token) throw new Error(tokenJson.error || 'Pas de access_token GitHub')

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        'User-Agent': 'ScaleYourShop',
      },
    })
    if (!userRes.ok) throw new Error('Échec récupération profil GitHub')
    const githubUser = await userRes.json() as { login: string; name?: string; email?: string | null }

    // L'email peut être privé sur le profil GitHub — fallback sur /user/emails
    let email = githubUser.email
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
          'User-Agent': 'ScaleYourShop',
        },
      })
      if (emailsRes.ok) {
        const emails = await emailsRes.json() as { email: string; primary: boolean; verified: boolean }[]
        const primary = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified)
        email = primary?.email || null
      }
    }

    if (!email) throw new Error('Aucun email GitHub disponible (même via /user/emails)')

    let tenant = await prisma.tenant.findUnique({ where: { email } })
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          email,
          name: githubUser.name || githubUser.login,
          passwordHash: null,
        },
      })
    }

    const token = await new SignJWT({ tenantId: tenant.id, email: tenant.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(JWT_SECRET)

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
        console.error('[github oauth] checkout trigger failed', e)
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
    console.error('[github oauth]', err)
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_failed`)
  }
}
