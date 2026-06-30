import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import { filterImageUrls, processImage, cleanImageUrl } from '@/lib/transfer/image'
import { rewriteProduct, type VariantOption } from '@/lib/transfer/claude'
import { fetchWooProducts, fetchWooVariations, createWooProduct, createWooVariation } from '@/lib/transfer/woocommerce'
import {
  getShopifyAccessToken,
  fetchShopifyProducts,
  fetchShopifyProductCount,
  createShopifyProduct,
  setShopifyVariantImage,
  type ShopifyProduct,
} from '@/lib/transfer/shopify'
import { sendTransferDoneEmail, sendTransferErrorEmail } from '@/lib/email'
import type { TransferOptions } from '@/types'
import crypto from 'crypto'
import fs from 'fs'

interface ShopRef {
  id: string
  url: string
  platform: string
  lang?: string | null
  apiKey: string
  apiSecret: string | null
}

interface NormalizedVariant {
  price: string
  options: VariantOption[]
  imageUrl?: string
}

interface NormalizedProduct {
  id: string
  name: string
  description: string
  price: string
  sku?: string
  images: string[]
  variants: NormalizedVariant[]
}

type PageCursor = number | string | null

async function log(transferId: string, message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  console.log(`[${level}] ${message}`)
  await prisma.transferLog.create({
    data: { transferId, level, message },
  }).catch(() => {})
}

async function saveImageHash(sourceShopId: string, sku: string, imageHash: string) {
  await prisma.productHash.upsert({
    where: { sourceShopId_imageHash: { sourceShopId, imageHash } },
    create: { sourceShopId, sku, imageHash },
    update: {},
  }).catch(() => {})
}

// ── Normalisation Shopify → format commun ─────────────────────────────────────
function normalizeShopifyProduct(p: ShopifyProduct): NormalizedProduct {
  const variants: NormalizedVariant[] = p.variants.map(v => {
    const img = p.images.find(img => img.id === v.image_id)
    const options: VariantOption[] = []
    if (v.option1) options.push({ name: p.options[0]?.name || 'Option', option: v.option1 })
    if (v.option2) options.push({ name: p.options[1]?.name || 'Option2', option: v.option2 })
    if (v.option3) options.push({ name: p.options[2]?.name || 'Option3', option: v.option3 })
    return { price: v.price, options, imageUrl: img?.src }
  })

  const realVariants = variants.filter(v => !(v.options.length === 1 && v.options[0].option === 'Default Title'))

  return {
    id: String(p.id),
    name: p.title,
    description: p.body_html || '',
    price: p.variants[0]?.price || '9.99',
    images: p.images.map(i => i.src),
    variants: realVariants,
  }
}

async function fetchSourceProductsPage(
  shop: ShopRef,
  categoryId: string | undefined,
  cursor: PageCursor
): Promise<{ products: NormalizedProduct[]; total: number; nextCursor: PageCursor }> {
  if (shop.platform === 'SHOPIFY') {
    const clientId = decrypt(shop.apiKey)
    const clientSecret = shop.apiSecret ? decrypt(shop.apiSecret) : ''
    const token = await getShopifyAccessToken(shop.url, clientId, clientSecret)
    const pageInfo = typeof cursor === 'string' ? cursor : undefined

    const { products, nextPageInfo } = await fetchShopifyProducts(shop.url, token, categoryId, pageInfo, 20)
    const total = await fetchShopifyProductCount(shop.url, token, categoryId)

    return {
      products: products.map(normalizeShopifyProduct),
      total,
      nextCursor: nextPageInfo,
    }
  }

  const apiKey = decrypt(shop.apiKey)
  const apiSecret = shop.apiSecret ? decrypt(shop.apiSecret) : ''
  const page = typeof cursor === 'number' ? cursor : 1

  const { products, total, totalPages } = await fetchWooProducts(shop.url, apiKey, apiSecret, categoryId, page, 20)

  const normalized: NormalizedProduct[] = []
  for (const p of products) {
    let variants: NormalizedVariant[] = []
    if (p.variations?.length > 0) {
      const vs = await fetchWooVariations(shop.url, apiKey, apiSecret, p.id)
      variants = vs.map(v => ({ price: v.price, options: v.attributes, imageUrl: v.image?.src }))
    }
    normalized.push({
      id: String(p.id),
      name: p.name,
      description: p.description,
      price: p.regular_price || p.price || '9.99',
      sku: p.sku,
      images: p.images.map(i => i.src),
      variants,
    })
  }

  return {
    products: normalized,
    total,
    nextCursor: page < totalPages ? page + 1 : null,
  }
}

// ── Construction des options/variantes au format Shopify (max 3 options) ─────
function buildShopifyOptionsAndVariants(variants: NormalizedVariant[], fallbackPrice: string) {
  const optionNames: string[] = []
  for (const v of variants) {
    for (const opt of v.options) {
      if (!optionNames.includes(opt.name)) optionNames.push(opt.name)
    }
  }
  const limitedNames = optionNames.slice(0, 3)

  const shopifyVariants = variants.map(v => {
    const sv: Record<string, unknown> = {
      price: v.price || fallbackPrice,
      // Ne pas suivre l'inventaire — le produit reste toujours achetable,
      // équivalent à manage_stock + stock_quantity élevé côté WooCommerce.
      inventory_management: null,
      inventory_policy: 'continue',
    }
    limitedNames.forEach((name, idx) => {
      const match = v.options.find(o => o.name === name)
      sv[`option${idx + 1}`] = match?.option || 'Default'
    })
    return sv
  })

  return { optionNames: limitedNames, shopifyVariants }
}

async function createProductOnTarget(
  targetShop: ShopRef,
  data: {
    title: string
    slug: string
    description: string
    shortDescription: string
    metaTitle: string
    metaDescription: string
    price: string
    draft: boolean
    imageUrls: string[]
    variants: NormalizedVariant[]
  },
  transferId: string
): Promise<{ id: string }> {
  if (targetShop.platform === 'SHOPIFY') {
    const clientId = decrypt(targetShop.apiKey)
    const clientSecret = targetShop.apiSecret ? decrypt(targetShop.apiSecret) : ''
    const token = await getShopifyAccessToken(targetShop.url, clientId, clientSecret)

    const payload: Record<string, unknown> = {
      title: data.title,
      body_html: data.description,
      handle: data.slug,
      status: data.draft ? 'draft' : 'active',
      images: data.imageUrls.map(url => ({ src: url })),
      metafields_global_title_tag: data.metaTitle,
      metafields_global_description_tag: data.metaDescription,
    }

    if (data.variants.length > 0) {
      const { optionNames, shopifyVariants } = buildShopifyOptionsAndVariants(data.variants, data.price)
      payload.options = optionNames.map(name => ({ name }))
      payload.variants = shopifyVariants
    } else {
      payload.variants = [{
        price: data.price,
        inventory_management: null,
        inventory_policy: 'continue',
      }]
    }

    const created = await createShopifyProduct(targetShop.url, token, payload)

    if (data.variants.length > 0) {
      for (let i = 0; i < data.variants.length; i++) {
        const v = data.variants[i]
        const createdVariant = created.variants[i]
        if (v.imageUrl && createdVariant) {
          try {
            await setShopifyVariantImage(targetShop.url, token, created.id, createdVariant.id, v.imageUrl)
          } catch (err) {
            await log(transferId, `⚠ Image variante non assignée: ${err instanceof Error ? err.message : 'erreur'}`, 'WARN')
          }
        }
      }
      await log(transferId, `✓ ${data.variants.length} variation(s) créée(s) avec prix et image dédiée`)
    }

    return { id: String(created.id) }
  }

  const apiKey = decrypt(targetShop.apiKey)
  const apiSecret = targetShop.apiSecret ? decrypt(targetShop.apiSecret) : ''

  const payload: Record<string, unknown> = {
    name: data.title,
    slug: data.slug,
    description: data.description,
    short_description: data.shortDescription,
    regular_price: data.price,
    status: data.draft ? 'draft' : 'publish',
    meta_data: [
      { key: '_yoast_wpseo_title', value: data.metaTitle },
      { key: '_yoast_wpseo_metadesc', value: data.metaDescription },
    ],
    images: data.imageUrls.map(url => ({ src: url })),
    manage_stock: true,
    stock_quantity: 99,
  }

  if (data.variants.length > 0) {
    const attributes = new Map<string, string[]>()
    for (const v of data.variants) {
      for (const opt of v.options) {
        if (!attributes.has(opt.name)) attributes.set(opt.name, [])
        attributes.get(opt.name)!.push(opt.option)
      }
    }
    payload.type = 'variable'
    payload.regular_price = ''
    payload.attributes = Array.from(attributes.entries()).map(([name, options]) => ({
      name, variation: true, visible: true, options: [...new Set(options)],
    }))
  }

  const created = await createWooProduct(targetShop.url, apiKey, apiSecret, payload)

  if (data.variants.length > 0) {
    for (const v of data.variants) {
      try {
        const variationPayload: Record<string, unknown> = {
          regular_price: v.price || data.price,
          attributes: v.options.map(o => ({ name: o.name, option: o.option })),
        }
        if (v.imageUrl) {
          variationPayload.image = { src: v.imageUrl }
        }
        await createWooVariation(targetShop.url, apiKey, apiSecret, created.id, variationPayload)
      } catch (err) {
        await log(transferId, `⚠ Variation non créée: ${err instanceof Error ? err.message : 'erreur'}`, 'WARN')
      }
    }
    await log(transferId, `✓ ${data.variants.length} variation(s) créée(s) avec prix et image dédiée`)
  }

  return { id: String(created.id) }
}

// ── Traduit les options/valeurs de variantes (dédupliquées pour limiter le coût) ─
function translateVariantOptions(
  variants: NormalizedVariant[],
  translated: VariantOption[],
  uniqueOriginals: VariantOption[]
): NormalizedVariant[] {
  if (translated.length !== uniqueOriginals.length) return variants

  const map = new Map<string, VariantOption>()
  uniqueOriginals.forEach((orig, i) => {
    map.set(`${orig.name}|${orig.option}`, translated[i])
  })

  return variants.map(v => ({
    ...v,
    options: v.options.map(o => map.get(`${o.name}|${o.option}`) || o),
  }))
}

async function processProduct(
  product: NormalizedProduct,
  sourceShop: ShopRef,
  targetShop: ShopRef,
  transferId: string,
  options: TransferOptions
) {
  const lang = targetShop.lang || 'fr'
  const price = parseFloat(product.price) || 9.99
  // ID produit source utilisé comme identifiant stable — garantit l'unicité du slug cible
  // ET matérialise le lien traçable entre produit source et produit cible (cf. mapping interne).
  const suffix = product.id

  // Dédupliquer les paires (nom, valeur) de variantes pour limiter le coût de traduction
  const uniqueOptionsMap = new Map<string, VariantOption>()
  if (options.variants) {
    for (const v of product.variants) {
      for (const opt of v.options) {
        uniqueOptionsMap.set(`${opt.name}|${opt.option}`, opt)
      }
    }
  }
  const uniqueOriginals = Array.from(uniqueOptionsMap.values())

  const rewritten = await rewriteProduct(product.name, price, lang, product.description, uniqueOriginals, options.invent_missing_description)
  await log(transferId, `🤖 ${product.name} → ${rewritten.title}`)
  if (rewritten.descriptionInvented && !options.invent_missing_description) {
    await log(transferId, `ℹ Pas de description source — description laissée vide (génération désactivée)`, 'WARN')
  } else if (rewritten.descriptionInvented) {
    await log(transferId, `ℹ Pas de description source — description générée par IA à partir du titre seul, à relire avant publication`, 'WARN')
  }

  const cleanUrls = options.clean_url ? filterImageUrls(product.images) : product.images
  const imageUrls: string[] = []
  const seenHashes = new Set<string>()

  for (let i = 0; i < Math.min(cleanUrls.length, 8); i++) {
    const result = await processImage(cleanUrls[i], rewritten.slug, lang, i + 1)
    if (!result) continue

    if (seenHashes.has(result.hash)) {
      fs.unlinkSync(result.filepath)
      continue
    }

    seenHashes.add(result.hash)
    await saveImageHash(sourceShop.id, product.sku || product.id, result.hash)

    imageUrls.push(`${process.env.NEXT_PUBLIC_APP_URL}/uploads/${result.filename}`)
  }

  let translatedVariants = product.variants
  if (options.variants && uniqueOriginals.length > 0) {
    translatedVariants = translateVariantOptions(product.variants, rewritten.variantOptions, uniqueOriginals)
  }

  const processedVariants: NormalizedVariant[] = []
  if (options.variants && translatedVariants.length > 0) {
    let varIndex = 0
    for (const v of translatedVariants) {
      varIndex++
      let processedImageUrl: string | undefined
      if (v.imageUrl) {
        const cleanVarUrl = options.clean_url ? cleanImageUrl(v.imageUrl) : v.imageUrl
        const varResult = await processImage(cleanVarUrl, rewritten.slug, lang, 100 + varIndex)
        if (varResult) {
          processedImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/uploads/${varResult.filename}`
        }
      }
      processedVariants.push({ price: v.price, options: v.options, imageUrl: processedImageUrl })
    }
  }

  const created = await createProductOnTarget(targetShop, {
    title: rewritten.title,
    slug: rewritten.slug + '-' + suffix,
    description: rewritten.description,
    shortDescription: rewritten.shortDescription,
    metaTitle: rewritten.metaTitle,
    metaDescription: rewritten.metaDescription,
    price: String(price),
    draft: options.draft,
    imageUrls,
    variants: processedVariants,
  }, transferId)

  await log(transferId, `✓ Produit créé sur cible (ID: ${created.id})`)
  return { id: created.id, tokensUsed: rewritten.tokensUsed }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { transferId } = await req.json()
  if (!transferId) return NextResponse.json({ error: 'Missing transferId' }, { status: 400 })

  runTransfer(transferId).catch(async (err) => {
    console.error('Transfer failed:', err)
    await prisma.transfer.update({
      where: { id: transferId },
      data: { status: 'ERROR', finishedAt: new Date() },
    }).catch(() => {})
  })

  return NextResponse.json({ message: 'Worker lancé', transferId })
}

async function runTransfer(transferId: string) {
  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: {
      sourceShop: true,
      targetShop: true,
      tenant: true,
    },
  })

  if (!transfer) throw new Error('Transfer not found')

  await prisma.transfer.update({
    where: { id: transferId },
    data: { status: 'RUNNING', startedAt: new Date() },
  })

  await log(transferId, `🚀 Démarrage du transfert`)
  await log(transferId, `📦 Source: ${transfer.sourceShop.url} (${transfer.sourceShop.platform})`)
  await log(transferId, `🎯 Cible: ${transfer.targetShop.url} (${transfer.targetShop.platform}, ${transfer.targetShop.lang})`)

  const options = transfer.options as unknown as TransferOptions
  const quotaCap = (transfer.options as Record<string, unknown>)?.quotaCap as number | undefined

  if (quotaCap !== undefined) {
    await log(transferId, `⚠ Quota restant insuffisant pour la totalité de la catégorie — arrêt automatique après ${quotaCap} produit(s) réussis.`, 'WARN')
  }

  const sourceShop: ShopRef = {
    id: transfer.sourceShop.id,
    url: transfer.sourceShop.url,
    platform: transfer.sourceShop.platform,
    apiKey: transfer.sourceShop.apiKey,
    apiSecret: transfer.sourceShop.apiSecret,
  }

  const targetShop: ShopRef = {
    id: transfer.targetShop.id,
    url: transfer.targetShop.url,
    platform: transfer.targetShop.platform,
    lang: transfer.targetShop.lang,
    apiKey: transfer.targetShop.apiKey,
    apiSecret: transfer.targetShop.apiSecret,
  }

  let cursor: PageCursor = null
  let totalSet = false
  let done = 0
  let failed = 0
  let quotaStopped = false

  outer: while (true) {
    const { products, total, nextCursor } = await fetchSourceProductsPage(
      sourceShop,
      transfer.categoryId || undefined,
      cursor
    )

    if (!totalSet) {
      await prisma.transfer.update({
        where: { id: transferId },
        data: { totalProducts: total },
      })
      await log(transferId, `📦 ${total} produits à transférer`)
      totalSet = true
    }

    if (!products.length) break

    for (const product of products) {
      if (quotaCap !== undefined && done >= quotaCap) {
        quotaStopped = true
        break outer
      }

      try {
        await processProduct(product, sourceShop, targetShop, transferId, options)
        done++
        await prisma.transfer.update({
          where: { id: transferId },
          data: { doneProducts: done },
        })
      } catch (err) {
        failed++
        const msg = err instanceof Error ? err.message : 'Erreur inconnue'
        await log(transferId, `✗ ${product.name}: ${msg}`, 'ERROR')
        await prisma.transfer.update({
          where: { id: transferId },
          data: { failedProducts: failed },
        })
      }
    }

    if (nextCursor === null) break
    cursor = nextCursor
  }

  if (quotaStopped) {
    await log(transferId, `⛔ Limite de quota atteinte (${quotaCap} produit(s)) — arrêt automatique. Passez à un plan supérieur pour transférer le reste.`, 'WARN')
  }

  const finalStatus = quotaStopped
    ? 'PARTIAL'
    : failed === 0 ? 'DONE' : done === 0 ? 'ERROR' : 'PARTIAL'

  await prisma.transfer.update({
    where: { id: transferId },
    data: { status: finalStatus, finishedAt: new Date() },
  })

  await log(transferId, `🎉 Terminé — ${done} réussis · ${failed} échecs`, failed > 0 ? 'WARN' : 'INFO')

  if (transfer.tenant?.email) {
    if (finalStatus === 'DONE') {
      sendTransferDoneEmail(transfer.tenant.email, {
        transferId, done, targetName: transfer.targetShop.name,
      }).catch(() => {})
    } else {
      sendTransferErrorEmail(transfer.tenant.email, {
        transferId, done, failed, targetName: transfer.targetShop.name,
      }).catch(() => {})
    }
  }
}
