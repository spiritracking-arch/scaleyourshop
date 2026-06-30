import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')

export async function getTenantId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('session')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload.tenantId as string
  } catch {
    return null
  }
}
