import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

export async function POST() {
  const res = NextResponse.json<ApiResponse>({ message: 'Déconnecté' })
  res.cookies.set('session', '', { maxAge: 0, path: '/' })
  return res
}
