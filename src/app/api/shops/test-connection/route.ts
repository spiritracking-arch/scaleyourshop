import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, ShopCredentials } from '@/types'
import { getShopifyAccessToken, fetchShopifyProductCount } from '@/lib/transfer/shopify'

// ── WooCommerce connection test ───────────────────────────────────────────────
async function testWooCommerce(url: string, apiKey: string, apiSecret: string) {
  const base = url.replace(/\/$/, '')
  const endpoint = `${base}/wp-json/wc/v3/products?per_page=1&consumer_key=${apiKey}&consumer_secret=${apiSecret}`

  const res = await fetch(endpoint, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`)

  const total = res.headers.get('X-WP-Total')
  return { products: parseInt(total || '0') }
}

// ── Shopify connection test ───────────────────────────────────────────────────
// Depuis le 1er janvier 2026, Shopify exige un échange OAuth client_credentials :
// apiKey = client_id, apiSecret = client_secret. On génère un jeton avant de tester.
async function testShopify(url: string, clientId: string, clientSecret: string) {
  let normalizedUrl = url.replace(/\/$/, '')
  if (!normalizedUrl.startsWith('http')) normalizedUrl = `https://${normalizedUrl}`

  const token = await getShopifyAccessToken(normalizedUrl, clientId, clientSecret)
  const count = await fetchShopifyProductCount(normalizedUrl, token)
  return { products: count }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ShopCredentials

    const { url, platform, apiKey, apiSecret } = body

    if (!url || !platform || !apiKey) {
      return NextResponse.json<ApiResponse>(
        { error: 'Missing required fields: url, platform, apiKey' },
        { status: 400 }
      )
    }

    let result: { products: number }

    if (platform === 'WOOCOMMERCE') {
      if (!apiSecret) {
        return NextResponse.json<ApiResponse>(
          { error: 'apiSecret required for WooCommerce' },
          { status: 400 }
        )
      }
      result = await testWooCommerce(url, apiKey, apiSecret)
    } else if (platform === 'SHOPIFY') {
      if (!apiSecret) {
        return NextResponse.json<ApiResponse>(
          { error: 'apiSecret (Secret API / client secret) required for Shopify' },
          { status: 400 }
        )
      }
      result = await testShopify(url, apiKey, apiSecret)
    } else {
      return NextResponse.json<ApiResponse>(
        { error: 'Unsupported platform' },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse<{ products: number }>>({
      data: result,
      message: `Connexion réussie — ${result.products.toLocaleString()} produits détectés`,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connexion échouée'
    return NextResponse.json<ApiResponse>(
      { error: message },
      { status: 500 }
    )
  }
}
