export interface WooProduct {
  id: number
  name: string
  slug: string
  price: string
  regular_price: string
  description: string
  short_description: string
  images: { id: number; src: string; alt: string }[]
  categories: { id: number; name: string; slug: string }[]
  variations: number[]
  type: string
  status: string
  sku: string
}

export interface WooVariation {
  id: number
  price: string
  attributes: { name: string; option: string }[]
  image?: { src: string }
}

// ── Fetch products from WooCommerce ──────────────────────────────────────────
export async function fetchWooProducts(
  url: string,
  apiKey: string,
  apiSecret: string,
  categoryId?: string,
  page = 1,
  perPage = 20
): Promise<{ products: WooProduct[]; total: number; totalPages: number }> {
  const base = url.replace(/\/$/, '')
  let endpoint = `${base}/wp-json/wc/v3/products?per_page=${perPage}&page=${page}&consumer_key=${apiKey}&consumer_secret=${apiSecret}&status=publish`

  if (categoryId && categoryId !== 'all') {
    endpoint += `&category=${categoryId}`
  }

  const res = await fetch(endpoint, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) throw new Error(`WooCommerce fetch error: ${res.status}`)

  const products = await res.json() as WooProduct[]
  const total = parseInt(res.headers.get('X-WP-Total') || '0')
  const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1')

  return { products, total, totalPages }
}

// ── Fetch variations ─────────────────────────────────────────────────────────
export async function fetchWooVariations(
  url: string,
  apiKey: string,
  apiSecret: string,
  productId: number
): Promise<WooVariation[]> {
  const base = url.replace(/\/$/, '')
  const endpoint = `${base}/wp-json/wc/v3/products/${productId}/variations?per_page=100&consumer_key=${apiKey}&consumer_secret=${apiSecret}`

  const res = await fetch(endpoint, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) return []
  return res.json() as Promise<WooVariation[]>
}

// ── Create product on target WooCommerce ─────────────────────────────────────
export async function createWooProduct(
  url: string,
  apiKey: string,
  apiSecret: string,
  productData: Record<string, unknown>
): Promise<{ id: number }> {
  const base = url.replace(/\/$/, '')
  const endpoint = `${base}/wp-json/wc/v3/products?consumer_key=${apiKey}&consumer_secret=${apiSecret}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify(productData),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WooCommerce create error: ${res.status} — ${err}`)
  }

  return res.json() as Promise<{ id: number }>
}

// ── Create variation on target WooCommerce product ───────────────────────────
export async function createWooVariation(
  url: string,
  apiKey: string,
  apiSecret: string,
  productId: number,
  variationData: Record<string, unknown>
): Promise<{ id: number }> {
  const base = url.replace(/\/$/, '')
  const endpoint = `${base}/wp-json/wc/v3/products/${productId}/variations?consumer_key=${apiKey}&consumer_secret=${apiSecret}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify(variationData),
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WooCommerce variation create error: ${res.status} — ${err}`)
  }

  return res.json() as Promise<{ id: number }>
}
