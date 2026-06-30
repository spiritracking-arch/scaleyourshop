import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface VariantOption {
  name: string
  option: string
}

export interface ProductRewrite {
  title: string
  description: string
  shortDescription: string
  metaTitle: string
  metaDescription: string
  slug: string
  variantOptions: VariantOption[]
  descriptionInvented: boolean
  tokensUsed: number
}

const BANNED_WORDS = [
  'crafted', 'elevate', 'effortlessly', 'seamlessly', 'curated', 'robust',
  'meticulous', 'timeless', 'versatile', 'embark', 'showcase', 'transcend',
  'delve', 'moreover', 'furthermore', 'statement piece', 'discover', 'unlock',
]

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function rewriteProduct(
  title: string,
  price: number,
  lang: string,
  sourceDescription?: string,
  variantOptions?: VariantOption[],
  inventMissingDescription = true
): Promise<ProductRewrite> {
  const langLabels: Record<string, string> = {
    fr: 'French', de: 'German', es: 'Spanish', it: 'Italian',
    nl: 'Dutch', pt: 'Portuguese', ro: 'Romanian', cs: 'Czech',
    hu: 'Hungarian', sv: 'Swedish', da: 'Danish', fi: 'Finnish',
    sk: 'Slovak', bg: 'Bulgarian', hr: 'Croatian', el: 'Greek',
    lt: 'Lithuanian', lv: 'Latvian', sl: 'Slovenian', et: 'Estonian',
    pl: 'Polish', ga: 'Irish',
  }

  const targetLang = langLabels[lang] || 'English'
  const cleanSource = sourceDescription ? stripHtml(sourceDescription).slice(0, 800) : ''
  const hasSourceDescription = cleanSource.length > 0
  const descriptionInvented = !hasSourceDescription
  const hasVariantOptions = variantOptions && variantOptions.length > 0
  const variantOptionsJson = hasVariantOptions ? JSON.stringify(variantOptions) : ''

  // Si pas de description source ET qu'on ne veut pas en inventer une,
  // on ne demande même pas à Claude de générer ce champ — on le vide après coup.
  const skipDescription = !hasSourceDescription && !inventMissingDescription

  const sourceWordCount = hasSourceDescription ? cleanSource.split(/\s+/).length : 0

  const descriptionRule = skipDescription
    ? `3. description: leave this field as an empty string "" — no source description was provided and invention is disabled for this transfer.
4. shortDescription: leave this field as an empty string "" too, for the same reason.`
    : `3. description: stay FAITHFUL to the source content and facts — this is a localization, not a creative
   rewrite. Your job is to adapt the TONE and register so it reads naturally for a ${targetLang} audience
   (idiomatic phrasing, natural register, culturally appropriate hook), not to change what the product IS or
   does, not to invent new selling points, and not to deliberately diverge from the source wording for its own
   sake. Do not translate word-for-word in a stiff or robotic way either — write it as a native ${targetLang}
   copywriter naturally would, while preserving every fact and selling point from the source, in the same order
   of importance.
   ${hasSourceDescription ? `HARD REQUIREMENT: the SOURCE DESCRIPTION is approximately ${sourceWordCount} words long. Your "description" output MUST be at least ${Math.max(20, Math.round(sourceWordCount * 0.7))} words — NEVER a short tagline. A short, punchy 1-2 sentence summary is NOT acceptable here, that belongs only in "shortDescription".` : ''}
   - If no source description is provided, invent a plausible, appealing 2-3 sentence description from the title alone.
     Stay generic and avoid inventing specific factual claims (exact materials, dimensions, technical specs) that
     could be wrong — focus on tone and appeal rather than fabricated specifics.
4. shortDescription: a DIFFERENT, punchy 1-2 sentence summary (max 200 chars) highlighting the single strongest selling point.
   Must NOT be a truncation or copy of "description" — write it as a distinct, standalone hook (this appears near the
   add-to-cart button, separate from the full description further down the page). This is the ONLY field allowed to be this short.`

  const prompt = `You are an expert e-commerce copywriter. Rewrite the following product for a ${targetLang} market.

RULES:
1. OUTPUT must be valid JSON only — no markdown, no explanation
2. title: natural ${targetLang}, punchy, max 80 chars. FULLY translate every word, including technical-sounding or English-style source titles (e.g. "Compare at Price", "Multi-location") — never leave English words untranslated just because they sound like a feature name or brand term. Only real, globally recognized brand names (e.g. Nike, Apple) should stay untranslated.
${descriptionRule}
5. metaTitle: max 60 chars, Google-optimized, different from title
6. metaDescription: max 160 chars, casual CTA
7. slug: lowercase, hyphens only, max 50 chars, in ${targetLang}
8. BANNED WORDS (never use, in any language): ${BANNED_WORDS.join(', ')}
9. Infer gender from product name — masculine: status/confidence register, feminine: emotional/self-expression register
10. ALL output strictly and entirely in ${targetLang} — every single word in every field must be in ${targetLang}, with zero exceptions and zero accidental words from any other language (including other Slavic, Germanic or Romance languages). Do not let any word slip in from a different language.
11. Never mention or reference the source marketplace, supplier, or any brand/seller name from the source description
${hasVariantOptions ? `12. variantOptions: a VARIANT_OPTIONS list is provided below (option names like "Color"/"Size" and their values like "Red"/"Large"). FULLY translate both the option name and each option value into ${targetLang}. Return them in the EXACT same order, as a JSON array of the same length, each item shaped {"name": "...", "option": "..."}. Do not merge, skip, or reorder entries.` : ''}

INPUT:
Product: ${title}
Price: ${price}€
SOURCE DESCRIPTION: ${cleanSource || '(none provided)'}
${hasVariantOptions ? `VARIANT_OPTIONS: ${variantOptionsJson}` : ''}

Reminder: write strictly in ${targetLang} only, with zero words from any other language, in every field below.

OUTPUT (JSON only):
{
  "title": "",
  "description": "",
  "shortDescription": "",
  "metaTitle": "",
  "metaDescription": "",
  "slug": ""${hasVariantOptions ? ',\n  "variantOptions": []' : ''}
}`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)

  try {
    const parsed = JSON.parse(clean) as Omit<ProductRewrite, 'tokensUsed' | 'variantOptions' | 'descriptionInvented'> & { variantOptions?: VariantOption[] }

    if (hasSourceDescription && !skipDescription) {
      const outputWordCount = (parsed.description || '').split(/\s+/).filter(Boolean).length
      const requiredMin = Math.max(20, Math.round(sourceWordCount * 0.7))
      console.log(`[claude] description length check — source: ${sourceWordCount} mots, requis min: ${requiredMin}, obtenu: ${outputWordCount} mots${outputWordCount < requiredMin ? ' ⚠ SOUS LE SEUIL' : ' ✓'}`)
    }

    return {
      ...parsed,
      description: skipDescription ? '' : parsed.description,
      shortDescription: skipDescription ? '' : parsed.shortDescription,
      variantOptions: parsed.variantOptions && parsed.variantOptions.length === (variantOptions?.length || 0)
        ? parsed.variantOptions
        : (variantOptions || []),
      descriptionInvented,
      tokensUsed,
    }
  } catch (parseErr) {
    console.error('[claude] JSON invalide ou tronqué — réponse brute:', text.slice(0, 2000), 'stop_reason:', response.stop_reason)
    return {
      title,
      description: skipDescription ? '' : title,
      shortDescription: skipDescription ? '' : title,
      metaTitle: title.slice(0, 60),
      metaDescription: title.slice(0, 160),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50),
      variantOptions: variantOptions || [],
      descriptionInvented,
      tokensUsed,
    }
  }
}
