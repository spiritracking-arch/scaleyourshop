import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import type { ApiResponse } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function requireAdmin(req: NextRequest) {
  const tenantId = await getTenantId(req)
  if (!tenantId) return null
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant?.isAdmin) return null
  return tenant
}

const BRAND_VOICE = `Tu écris pour le blog de ScaleYourShop, un SaaS B2B qui permet aux e-commerçants de transférer et dupliquer leur catalogue produit entre boutiques, dans les 4 combinaisons suivantes : Shopify vers Shopify, WooCommerce vers WooCommerce, Shopify vers WooCommerce, et WooCommerce vers Shopify. L'usage typique : dupliquer une boutique existante vers un nouveau marché, une nouvelle marque, ou migrer de plateforme.

Capacités produit précises à respecter dans tes textes :
- ScaleYourShop prend en charge l'intégralité d'une fiche produit lors du transfert (titre, description, images, variantes, prix, attributs, catégories).
- Pour la description produit, l'app ne fait pas une traduction littérale : elle effectue une REFORMULATION IA qui adapte le contenu au marché cible (ton, références culturelles, formulations idiomatiques).
- Si la description source est absente ou de mauvaise qualité, l'app génère automatiquement une description de qualité professionnelle pour la fiche produit transférée, plutôt que de transférer un champ vide ou médiocre.
Ne jamais décrire cette fonctionnalité comme une simple "traduction" — utilise "reformulation adaptée au marché cible" ou "adaptation IA". Ne jamais prétendre que ScaleYourShop ne supporte qu'une seule plateforme ou qu'un seul sens de transfert — les 4 combinaisons sont disponibles. N'invente pas de fonctionnalités génériques (configuration multi-devises, logistique transfrontalière, support douanier, etc.) qui ne font pas partie du produit réel décrit ci-dessus.

Ton de marque : expert et technique. Vocabulaire précis, orienté praticien avancé du e-commerce (pas de vulgarisation excessive, pas de tournures marketing creuses). Tu peux utiliser des termes techniques (CAC, taux de conversion, SKU, feed produit, API REST, webhook, etc.) sans les expliquer comme à un débutant. Phrases denses en information, sans remplissage.

RÈGLE ABSOLUE, prioritaire sur tout le reste : tu n'inventes JAMAIS de chiffre, pourcentage, statistique, étude, sondage, ou citation d'une source externe (Shopify, WooCommerce, cabinet d'analyse, etc.), sauf si ce chiffre exact a été explicitement fourni dans le titre, le contexte ou le texte à corriger donnés en entrée. Si aucune donnée chiffrée fiable n'est fournie, écris en restant purement qualitatif (sans aucun chiffre inventé) plutôt que d'inventer une statistique pour "faire sérieux". N'attribue jamais une affirmation à "des rapports de Shopify", "une étude récente", ou toute source non citée explicitement dans l'input — c'est une fausse attribution, strictement interdite.

Écriture humaine, à respecter systématiquement :
- N'utilise JAMAIS le tiret cadratin (—) ni le tiret demi-cadratin (–). Utilise des parenthèses, une virgule, ou une nouvelle phrase à la place. Un tiret simple (-) reste acceptable dans une liste ou un mot composé.
- Pas d'accroche générique type "Dans le monde actuel du e-commerce...", "À l'ère du digital...", "Dans un contexte où...". Commence directement par le fait ou l'idée concrète.
- Pas de locution de remplissage type "Il est important de noter que", "En somme", "Force est de constater", "Il convient de souligner que". Va droit au fait.
- Pas de triade mécanique (ne regroupe pas systématiquement 3 adjectifs ou 3 qualités en rafale, ex: "rapide, efficace et fiable"). Varie le nombre d'éléments énumérés, ou n'en cite qu'un ou deux quand c'est suffisant.
- Pas de question rhétorique en guise d'accroche type "Et si vous pouviez enfin... ?". Affirme directement.
- Varie volontairement la longueur des phrases : alterne phrases courtes et phrases plus développées, ne produis pas une cadence régulière. Évite le parallélisme syntaxique entre phrases consécutives (ne commence pas systématiquement par le sujet, ne calque pas la même structure d'une phrase à l'autre).
- N'équilibre pas mécaniquement les arguments ("d'un côté... de l'autre côté..."). Une opinion ou un constat tranché, assumé, sonne plus humain qu'une neutralité de façade.
- Supprime les transitions méta ("Voyons maintenant...", "Passons à...", "Pour conclure..."). Enchaîne directement sur l'idée suivante.
- Une idée par phrase. Évite d'empiler les qualificatifs ou les subordonnées dans une même phrase.
- N'écris JAMAIS de commentaire sur ta propre démarche de rédaction (du type "Je vais combiner...", "Voici comment je vais procéder...", "Pour répondre à cette demande..."). Ta réponse doit contenir UNIQUEMENT le texte final attendu, jamais une trace de ton raisonnement ou de ta méthode.
- N'ajoute JAMAIS d'étiquette méta avant le contenu lui-même, du type "L'argument de crédibilité :", "Voici la preuve :", "En résumé :", "Point clé :". Écris directement le contenu attendu pour ce champ, sans préfixe explicatif ni titre annonçant ce que tu vas dire.

Format skimmable (structure F-shaped, lecture en survol) :
- Phrases courtes en début de paragraphe : la première phrase doit porter l'idée principale à elle seule, sans subordonnée.
- Paragraphes de 2 à 4 phrases maximum. Si le sujet demande plus de développement, découpe en plusieurs paragraphes plutôt qu'un bloc dense.
- Utilise une liste à puces (avec des tirets) dès qu'il y a 3 éléments énumérables ou plus (avantages, étapes, caractéristiques), plutôt qu'une phrase qui les énumère en continu.
- Mets en gras (avec **) les chiffres clés et les 2-3 mots-clés les plus importants de chaque paragraphe, pour qu'un lecteur en survol capte l'essentiel sans tout lire.

Répartition éditoriale stricte, à respecter selon le champ concerné :
- Question GEO, Hook sémantique, Preuve E-E-A-T, et Sections : contenu purement informatif et factuel sur le SUJET de l'article (le marché, la problématique e-commerce traitée, les enjeux du secteur). Tu peux mentionner que des outils de transfert/duplication catalogue existent en général, mais SANS nommer ScaleYourShop, sans pitch commercial, sans formulation du type "ScaleYourShop permet de...". Ces champs informent un lecteur qui s'intéresse au sujet, pas à un produit.
- Seul le champ "Pitch CTA" (et lui uniquement) doit présenter ScaleYourShop, ses capacités, et inciter à l'action commerciale. C'est le seul endroit légitime pour parler du produit par son nom.`

// ── Le system prompt (BRAND_VOICE) est mis en cache cote Anthropic (cache_control)
// pour eviter de le repayer en entier a chaque appel : ~90% moins cher pendant 5 minutes
// d'utilisation continue, ce qui couvre une session d'edition typique.
async function askClaude(userPrompt: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: [{ type: 'text', text: BRAND_VOICE, cache_control: { type: 'ephemeral' } } as any],
    messages: [{ role: 'user', content: userPrompt }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return text.replace(/```json|```/g, '').trim()
}

async function askClaudeWithSearch(userPrompt: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: [{ type: 'text', text: BRAND_VOICE, cache_control: { type: 'ephemeral' } } as any],
    messages: [{ role: 'user', content: userPrompt }],
    tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
  })
  const text = response.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
  return text.replace(/```json|```/g, '').trim()
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Accès refusé' }, { status: 403 })

  try {
    const body = await req.json()
    const { action } = body as { action: 'field' | 'faq' | 'social' | 'internal_links' }

    if (action === 'field') {
      const { mode, fieldLabel, currentText, articleTitle, context } = body as {
        mode: 'generate' | 'fix'
        fieldLabel: string
        currentText?: string
        articleTitle?: string
        context?: string
      }
      if (!articleTitle?.trim() && !currentText?.trim()) {
        return NextResponse.json<ApiResponse>({ error: 'Titre de l\'article ou texte existant requis' }, { status: 400 })
      }

      const isHook = /hook|position zero|r[ée]ponse courte/i.test(fieldLabel)
      const lengthConstraint = isHook
        ? '\nContrainte stricte : le texte produit doit faire entre 50 et 300 caractères exactement. Compte les caractères et ajuste avant de répondre.'
        : ''

      const isProof = /preuve|e-e-a-t/i.test(fieldLabel) && mode === 'generate'

      if (isProof) {
        const searchPrompt = `Champ à rédiger : "${fieldLabel}", pour un article dont le titre est : "${articleTitle || ''}"
${context ? `Contexte additionnel : ${context}` : ''}

Effectue une recherche web pour trouver une statistique, étude ou donnée chiffrée RÉELLE, récente et vérifiable, en lien direct avec le sujet de l'article ci-dessus (le marché ou la problématique e-commerce traités, pas ScaleYourShop).

Rédige ensuite un court paragraphe de preuve/autorité intégrant cette donnée réelle. Cite la source sous forme de lien markdown cliquable pointant vers l'URL réelle de la page trouvée, juste après le chiffre (ex: "27% des ventes ([Shopify, 2024](https://www.shopify.com/...))"). N'utilise jamais une URL inventée : si tu ne peux pas identifier l'URL exacte de la source, écris le nom de la source sans lien plutôt que d'inventer une URL. Si tu ne trouves aucune donnée fiable et vérifiable sur le sujet précis, dis-le explicitement dans le texte plutôt que d'inventer un chiffre.

Une fois ta recherche terminée, ta réponse finale doit contenir UNIQUEMENT le paragraphe de preuve lui-même. N'écris RIEN d'autre avant ou après : pas de phrase expliquant quelles données tu as trouvées, pas de "Je vais combiner...", pas de bilan de ta recherche, pas de balise HTML ou XML (pas de <cite>, <source>, ou toute autre balise). Le tout premier caractère de ta réponse doit être le début du paragraphe final, en texte brut et markdown standard uniquement (gras, lien).`
        const text = await askClaudeWithSearch(searchPrompt)
        return NextResponse.json<ApiResponse>({ data: { text } })
      }

      const prompt = mode === 'fix'
        ? `Tu relis et corriges un champ existant. Champ concerné : "${fieldLabel}".
Texte actuel à corriger (orthographe, syntaxe, précision technique, sans changer le sens ni inventer de faits ou de chiffres absents du texte d'origine) :
"""${currentText || ''}"""
${lengthConstraint}
Réponds uniquement avec le texte corrigé, sans guillemets, sans préambule, sans note explicative.`
        : `Titre de l'article : "${articleTitle || ''}"
${context ? `Contexte additionnel : ${context}` : ''}
Champ à rédiger : "${fieldLabel}".
${lengthConstraint}
Rédige un texte court et dense en français, adapté à ce champ précis, sans inventer de statistiques ou de faits non déductibles du titre/contexte fourni. Réponds uniquement avec le texte, sans guillemets, sans préambule.`

      const text = await askClaude(prompt)
      return NextResponse.json<ApiResponse>({ data: { text } })
    }

    if (action === 'internal_links') {
      const { sections, otherArticles, articleTitle } = body as {
        sections: { id: string; heading: string; content: string }[]
        otherArticles: { title: string; slug: string; excerpt: string }[]
        articleTitle?: string
      }
      if (!otherArticles || otherArticles.length === 0) {
        return NextResponse.json<ApiResponse>({ data: { sections } })
      }

      const articlesList = otherArticles.map((a) => `- "${a.title}" -> /blog/${a.slug} (${a.excerpt})`).join('\n')
      const sectionsList = sections.map((s) => `[ID:${s.id}] "${s.heading}"\n${s.content}`).join('\n\n---\n\n')

      const prompt = `Tu fais du maillage interne SEO pour l'article : "${articleTitle || ''}".

Voici les autres articles déjà publiés sur le blog, disponibles pour être liés :
${articlesList}

Voici les sections de l'article actuel :
${sectionsList}

Pour chaque section, insère au maximum 1 ou 2 liens markdown vers un autre article de la liste, UNIQUEMENT si le sujet de cet autre article est réellement pertinent par rapport à une phrase déjà présente dans le texte de la section. Le texte du lien (l'ancre) doit être un groupe de mots déjà existant dans la section, jamais une phrase inventée ou ajoutée artificiellement. N'insère aucun lien si rien n'est réellement pertinent dans une section donnée : laisse alors son contenu identique. Ne modifie rien d'autre dans le texte (pas de reformulation, pas de correction).

Réponds UNIQUEMENT avec un JSON valide, sans préambule ni balises de code, sous cette forme exacte :
[{"id": "ID_DE_LA_SECTION", "content": "contenu avec les liens inseres"}]`

      const raw = await askClaude(prompt)
      const parsed = JSON.parse(raw)
      return NextResponse.json<ApiResponse>({ data: { sections: parsed } })
    }

    const { title, content, excerpt, ctaPitch } = body as {
      title?: string; content?: string; excerpt?: string; ctaPitch?: string
    }
    if (!title || !title.trim()) {
      return NextResponse.json<ApiResponse>({ error: 'Titre requis pour l\'assistance IA' }, { status: 400 })
    }

    if (action === 'faq') {
      const cleanContent = (content || '').replace(/<[^>]*>/g, ' ').slice(0, 3000)
      const prompt = `Titre de l'article : "${title}"
Contenu de l'article (peut être partiel) : """${cleanContent || '(pas encore de contenu, base-toi uniquement sur le titre)'}"""

Génère 3 à 5 questions fréquentes avec des réponses précises et techniques, en français, que se poserait un e-commerçant avancé en lisant cet article. Base-toi UNIQUEMENT sur ce qui est réellement présent dans le titre/contenu fourni.

Réponds UNIQUEMENT avec un JSON valide, sans préambule ni balises de code, sous cette forme exacte :
[{"question": "", "answer": ""}]`
      const raw = await askClaude(prompt)
      const parsed = JSON.parse(raw)
      return NextResponse.json<ApiResponse>({ data: { faqItems: parsed } })
    }

    if (action === 'social') {
      const prompt = `Titre de l'article : "${title}"
Extrait : "${excerpt || ''}"
Contexte du CTA : "${ctaPitch || ''}"

Génère deux posts courts annonçant cet article :
1. linkedin : ton expert et technique, 2 à 4 paragraphes courts, sans emoji superflu (1 maximum si pertinent), termine par une invitation implicite à lire l'article (sans URL fictive).
2. twitter : moins de 260 caractères, dense et factuel, 1 emoji maximum.

Réponds UNIQUEMENT avec un JSON valide, sans préambule ni balises de code, sous cette forme exacte :
{"linkedin": "", "twitter": ""}`
      const raw = await askClaude(prompt)
      const parsed = JSON.parse(raw)
      return NextResponse.json<ApiResponse>({ data: { socialDrafts: parsed } })
    }

    return NextResponse.json<ApiResponse>({ error: 'Action inconnue' }, { status: 400 })
  } catch (err) {
    console.error('[blog ai-assist]', err)
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json<ApiResponse>({ error: message }, { status: 500 })
  }
}
