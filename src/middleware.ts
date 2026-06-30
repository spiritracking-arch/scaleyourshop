import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')

const PROTECTED_PATHS = ['/dashboard', '/transfers', '/shops', '/settings', '/onboarding']
const AUTH_PATHS = ['/login', '/signup']
const ADMIN_PATHS = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('session')?.value

  let isAuthenticated = false
  let tenantId: string | null = null

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      isAuthenticated = true
      tenantId = payload.tenantId as string
    } catch {
      isAuthenticated = false
    }
  }

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p))
  const isAdminPage = ADMIN_PATHS.some(p => pathname.startsWith(p))

  if ((isProtected || isAdminPage) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (isAdminPage && isAuthenticated) {
    const res = NextResponse.next()
    res.headers.set('x-tenant-id-check', tenantId || '')
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/transfers/:path*', '/shops/:path*', '/settings/:path*', '/onboarding/:path*', '/admin/:path*', '/login', '/signup'],
}
