const API_VERSION = '2024-10'

function normalizeShopUrl(url: string): string {
  let u = url.replace(/\/$/, '')
  if (!u.startsWith('http')) u = `https://${u}`
  return u
}

// ── Jeton d'accès (client_credentials grant) ──────────────────────────────────
// Le jeton expire après 24h (86399s) — on le récupère à la demande, avec un cache
// en mémoire simple par boutique pour éviter de regénérer un jeton à chaque appel.
const tokenCache = new Map<string, { token: string; expiresAt: number }>()

export async function getShopifyAccessToken(
  shopUrl: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const cacheKey = shopUrl
  const cached = tokenCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token
  }

  const base = normalizeShopUrl(shopUrl)
  const res = await fetch(`${base}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }).toString(),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Shopify auth error: ${res.status} — ${err}`)
  }

  const data = await res.json() as { access_token: string; expires_in: number }
  tokenCache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  })

  return data.access_token
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface ShopifyVariant {
  id: number
  price: string
  option1?: string | null
  option2?: string | null
  option3?: string | null
  image_id?: number | null
}

export interface ShopifyImage {
  id: number
  src: string
}

export interface ShopifyProduct {
  id: number
  title: string
  body_html: string
  handle: string
  status: string
  variants: ShopifyVariant[]
  images: ShopifyImage[]
  options: { name: string; values: string[] }[]
}

interface ShopifyProductsPage {
  products: ShopifyProduct[]
  nextPageInfo: string | null
}

function extractNextPageInfo(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  const match = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>; rel="next"/)
  return match ? match[1] : null
}

// ── Fetch products from Shopify (source) ─────────────────────────────────────
export async function fetchShopifyProducts(
  url: string,
  accessToken: string,
  collectionId?: string,
  pageInfo?: string,
  limit = 20
): Promise<ShopifyProductsPage> {
  const base = normalizeShopUrl(url)
  let endpoint = `${base}/admin/api/${API_VERSION}/products.json?limit=${limit}&status=active`

  if (pageInfo) {
    endpoint = `${base}/admin/api/${API_VERSION}/products.json?limit=${limit}&page_info=${pageInfo}`
  } else if (collectionId && collectionId !== 'all') {
    endpoint += `&collection_id=${collectionId}`
  }

  const res = await fetch(endpoint, {
    headers: { 'X-Shopify-Access-Token': accessToken },
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Shopify fetch error: ${res.status} — ${err}`)
  }

  const data = await res.json() as { products: ShopifyProduct[] }
  const nextPageInfo = extractNextPageInfo(res.headers.get('Link'))

  return { products: data.products, nextPageInfo }
}

// ── Fetch product count for a collection ──────────────────────────────────────
export async function fetchShopifyProductCount(
  url: string,
  accessToken: string,
  collectionId?: string
): Promise<number> {
  const base = normalizeShopUrl(url)
  let endpoint = `${base}/admin/api/${API_VERSION}/products/count.json?status=active`
  if (collectionId && collectionId !== 'all') {
    endpoint += `&collection_id=${collectionId}`
  }

  const res = await fetch(endpoint, {
    headers: { 'X-Shopify-Access-Token': accessToken },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) return 0
  const data = await res.json() as { count: number }
  return data.count
}

// ── Fetch collections (équivalent des catégories WooCommerce) ────────────────
export interface ShopifyCollection {
  id: number
  title: string
  handle: string
}

export async function fetchShopifyCollections(
  url: string,
  accessToken: string
): Promise<ShopifyCollection[]> {
  const base = normalizeShopUrl(url)
  const results: ShopifyCollection[] = []

  for (const type of ['custom_collections', 'smart_collections']) {
    const endpoint = `${base}/admin/api/${API_VERSION}/${type}.json?limit=250`
    const res = await fetch(endpoint, {
      headers: { 'X-Shopify-Access-Token': accessToken },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) continue
    const data = await res.json() as { [key: string]: ShopifyCollection[] }
    const list = data[type] || []
    results.push(...list)
  }

  return results
}

// ── Create product on target Shopify ─────────────────────────────────────────
export async function createShopifyProduct(
  url: string,
  accessToken: string,
  productData: Record<string, unknown>
): Promise<{ id: number; variants: { id: number; option1?: string; option2?: string }[] }> {
  const base = normalizeShopUrl(url)
  const endpoint = `${base}/admin/api/${API_VERSION}/products.json`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ product: productData }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Shopify create error: ${res.status} — ${err}`)
  }

  const data = await res.json() as { product: { id: number; variants: { id: number; option1?: string; option2?: string }[] } }
  return data.product
}

// ── Associer une image à une variante (appel séparé après création) ──────────
export async function setShopifyVariantImage(
  url: string,
  accessToken: string,
  productId: number,
  variantId: number,
  imageSrc: string
): Promise<void> {
  const base = normalizeShopUrl(url)

  const imgRes = await fetch(`${base}/admin/api/${API_VERSION}/products/${productId}/images.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ image: { src: imageSrc, variant_ids: [variantId] } }),
    signal: AbortSignal.timeout(20000),
  })

  if (!imgRes.ok) {
    const err = await imgRes.text()
    throw new Error(`Shopify variant image error: ${imgRes.status} — ${err}`)
  }
}
