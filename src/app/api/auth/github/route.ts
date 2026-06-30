import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const plan = searchParams.get('plan')
  const billing = searchParams.get('billing')

  const state = crypto.randomBytes(16).toString('hex')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scaleyourshop.app'
  const redirectUri = `${baseUrl}/api/auth/github/callback`

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'user:email',
    state,
  })

  const res = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
  res.cookies.set('oauth_state', state, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 300, path: '/',
  })
  if (plan) {
    res.cookies.set('oauth_plan', plan, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 300, path: '/',
    })
  }
  if (billing) {
    res.cookies.set('oauth_billing', billing, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 300, path: '/',
    })
  }
  return res
}
