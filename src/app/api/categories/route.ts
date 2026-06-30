import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { decrypt } from '@/lib/crypto'
import type { ApiResponse } from '@/types'
import { getShopifyAccessToken, fetchShopifyCollections, fetchShopifyProductCount } from '@/lib/transfer/shopify'

interface WooCategory {
  id: number
  name: string
  slug: string
  count: number
  parent: number
}

async function fetchWooCategories(url: string, apiKey: string, apiSecret: string) {
  const base = url.replace(/\/$/, '')
  const allCategories: WooCategory[] = []
  let page = 1

  while (true) {
    const endpoint = `${base}/wp-json/wc/v3/products/categories?per_page=100&page=${page}&consumer_key=${apiKey}&consumer_secret=${apiSecret}&hide_empty=true`

    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) throw new Error(`WooCommerce API error: ${res.status}`)

    const data = await res.json() as WooCategory[]
    if (!data.length) break

    allCategories.push(...data)

    const total = parseInt(res.headers.get('X-WP-TotalPages') || '1')
    if (page >= total) break
    page++
  }

  return allCategories
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .map(c => ({
      id: String(c.id),
      label: c.name,
      slug: c.slug,
      count: c.count,
      parent: c.parent,
    }))
}

async function fetchShopifyCategories(url: string, clientId: string, clientSecret: string) {
  const token = await getShopifyAccessToken(url, clientId, clientSecret)
  const collections = await fetchShopifyCollections(url, token)

  // Pas de "count" direct par collection via REST sans 1 appel par collection —
  // on affiche les collections sans compte précis pour rester rapide à l'onboarding.
  return collections.map(c => ({
    id: String(c.id),
    label: c.title,
    slug: c.handle,
    count: 0,
    parent: 0,
  }))
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req)
    if (!tenantId) return NextResponse.json<ApiResponse>({ error: 'Missing tenant' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const shopId = searchParams.get('shopId')
    if (!shopId) return NextResponse.json<ApiResponse>({ error: 'Missing shopId' }, { status: 400 })

    const shop = await prisma.shop.findUnique({
      where: { id: shopId, tenantId },
    })

    if (!shop) return NextResponse.json<ApiResponse>({ error: 'Boutique introuvable' }, { status: 404 })

    const apiKey = decrypt(shop.apiKey)
    const apiSecret = shop.apiSecret ? decrypt(shop.apiSecret) : ''

    let result

    if (shop.platform === 'WOOCOMMERCE') {
      const categories = await fetchWooCategories(shop.url, apiKey, apiSecret)
      const totalCount = categories.reduce((s, c) => s + c.count, 0)
      result = [
        { id: 'all', label: 'Tout le catalogue', slug: 'all', count: totalCount, parent: 0 },
        ...categories,
      ]
    } else if (shop.platform === 'SHOPIFY') {
      const categories = await fetchShopifyCategories(shop.url, apiKey, apiSecret)
      const totalCount = await fetchShopifyProductCount(shop.url, await getShopifyAccessToken(shop.url, apiKey, apiSecret))
      result = [
        { id: 'all', label: 'Tout le catalogue', slug: 'all', count: totalCount, parent: 0 },
        ...categories,
      ]
    } else {
      return NextResponse.json<ApiResponse>({ error: 'Plateforme non supportée' }, { status: 400 })
    }

    return NextResponse.json<ApiResponse>({ data: result })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json<ApiResponse>({ error: message }, { status: 500 })
  }
}
