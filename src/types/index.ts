export type ApiResponse<T = unknown> = {
  data?: T
  error?: string
  message?: string
}

export type ShopPlatform = 'WOOCOMMERCE' | 'SHOPIFY'
export type ShopRole = 'SOURCE' | 'TARGET'
export type TransferStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'PARTIAL'

export interface ShopCredentials {
  url: string
  platform: ShopPlatform
  apiKey: string
  apiSecret?: string
}

export interface TransferOptions {
  translate_title: boolean
  translate_desc: boolean
  rewrite_meta: boolean
  rewrite_slug: boolean
  variants: boolean
  skip_existing: boolean
  draft: boolean
  strip_exif: boolean
  clean_url: boolean
  rename_files: boolean
  resize_webp: boolean
  fake_useragent: boolean
  strip_json_meta: boolean
  // Si false et qu'aucune description source n'existe, ne pas en inventer une —
  // évite tout risque d'affirmation factuelle fausse sur un produit non documenté.
  invent_missing_description: boolean
}

export const DEFAULT_TRANSFER_OPTIONS: TransferOptions = {
  translate_title: true,
  translate_desc: true,
  rewrite_meta: true,
  rewrite_slug: true,
  variants: true,
  skip_existing: true,
  draft: false,
  strip_exif: true,
  clean_url: true,
  rename_files: true,
  resize_webp: true,
  fake_useragent: true,
  strip_json_meta: true,
  invent_missing_description: true,
}
export const PLAN_LIMITS: Record<string, { monthlyProducts: number; maxShops: number; quotaType: 'lifetime' | 'monthly' }> = {
  FREE: { monthlyProducts: 5, maxShops: 2, quotaType: 'lifetime' },
  STARTER: { monthlyProducts: 100, maxShops: 3, quotaType: 'lifetime' },
  GROWTH: { monthlyProducts: 500, maxShops: 10, quotaType: 'monthly' },
  BUSINESS: { monthlyProducts: 5000, maxShops: Infinity, quotaType: 'monthly' }, // "illimité" en façade, plafond technique réel pour limiter l'exposition aux coûts API Claude
}
