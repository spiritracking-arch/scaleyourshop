export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export interface TocItem {
  id: string
  text: string
  level: number
}

export function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split('\n')
  const items: TocItem[] = []
  const seen = new Map<string, number>()

  for (const line of lines) {
    const m = line.match(/^(#{2,6})\s+(.+)$/)
    if (!m) continue
    const level = m[1].length
    const text = m[2].trim()
    if (!text) continue

    let id = slugifyHeading(text)
    const count = seen.get(id) || 0
    seen.set(id, count + 1)
    if (count > 0) id = `${id}-${count}`

    items.push({ id, text, level })
  }

  return items
}

export interface ArticleBlock {
  id: string
  key: 'geo' | 'hook' | 'proof' | 'cta' | 'section'
  heading: string
  level: number
  content: string
  imageUrl?: string
  imageAlt?: string
  proofType?: string
}

export interface VideoEmbed { platform: string; url: string }

export function buildMarkdownFromPost(post: {
  title: string
  coverImageUrl: string | null
  coverImageAlt: string | null
  blocks: ArticleBlock[]
}): string {
  let md = ''
  if (post.title) md += `# ${post.title}\n\n`
  for (const b of post.blocks || []) {
    if (b.key === 'hook') continue
    if (b.heading) md += `${'#'.repeat(Math.max(2, Math.min(b.level, 6)))} ${b.heading}\n`
    if (b.content) md += `${b.content}\n\n`
    if (b.imageUrl) md += `![${b.imageAlt || b.heading || 'Illustration'}](${b.imageUrl})\n\n`
  }
  return md.trim()
}

export function getYoutubeEmbedUrl(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m) return `https://www.youtube.com/embed/${m[1]}`
  }
  return null
}
