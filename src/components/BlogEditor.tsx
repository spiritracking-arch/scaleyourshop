'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles, Wand2, ImagePlus, Plus, X, Video, ChevronDown,
  FileText, HelpCircle, Zap, ShieldCheck, Target, Link2, Gauge,
  Globe, Share2, Code2,
} from 'lucide-react'

const T = {
  bg: '#0d0d0d',
  card: '#1f1f1f',
  cardBorder: 'rgba(255,255,255,0.06)',
  inputBg: '#161616',
  inputBorder: 'rgba(255,255,255,0.10)',
  text: '#ffffff',
  textDim: '#a3a3a3',
  textFaint: '#6b6b6b',
  accent: '#006FEE',
  blue: '#006FEE',
  red: '#F31260',
  success: '#17C964',
  warning: '#F5A524',
  danger: '#F31260',
  radiusContainer: 12,
  radiusForm: 18,
  font: "'Inter', system-ui, -apple-system, sans-serif",
}

const EEAT_TYPES = [
  { value: 'CASE_STUDY', label: 'Etude de cas' },
  { value: 'AB_TEST', label: 'A/B test' },
  { value: 'STATISTIC', label: 'Statistique' },
  { value: 'TESTIMONIAL', label: 'Temoignage client' },
  { value: 'EXPERT_QUOTE', label: "Citation d'expert" },
  { value: 'PROPRIETARY_DATA', label: 'Donnee proprietaire' },
]

type BlockKey = 'geo' | 'hook' | 'proof' | 'cta' | 'section'
interface Block {
  id: string
  key: BlockKey
  heading: string
  level: number
  content: string
  imageUrl: string
  imageAlt: string
  proofType?: string
}
interface VideoEmbed { platform: string; url: string }
interface FaqItem { question: string; answer: string }
interface SocialDrafts { linkedin?: string; twitter?: string }

interface PostData {
  id?: string
  title: string
  slug?: string
  excerpt: string
  coverImageUrl: string
  coverImageAlt: string
  blocks: Block[]
  videos: VideoEmbed[]
  faqItems: FaqItem[]
  tags: string[]
  socialDrafts: SocialDrafts
  ctaButtonLabel: string
  ctaButtonUrl: string
  channelBlog: boolean
  channelWebhookEnabled: boolean
  socialWebhookUrl: string
  distributionWebhookUrl: string
  metaTitle: string
  metaDescription: string
  status: 'DRAFT' | 'PUBLISHED'
}

const genId = () => Math.random().toString(36).slice(2, 10)

const EMPTY_POST: PostData = {
  title: '', excerpt: '', coverImageUrl: '', coverImageAlt: '',
  blocks: [
    { id: genId(), key: 'geo', heading: 'Problematique cible', level: 2, content: '', imageUrl: '', imageAlt: '' },
    { id: genId(), key: 'hook', heading: 'La solution directe', level: 2, content: '', imageUrl: '', imageAlt: '' },
    { id: genId(), key: 'proof', heading: 'Preuve et autorite', level: 2, content: '', imageUrl: '', imageAlt: '', proofType: '' },
    { id: genId(), key: 'cta', heading: 'Pourquoi scaleyourshop', level: 2, content: '', imageUrl: '', imageAlt: '' },
    { id: genId(), key: 'section', heading: '', level: 2, content: '', imageUrl: '', imageAlt: '' },
  ],
  videos: [], faqItems: [], tags: [], socialDrafts: {}, ctaButtonLabel: 'Essayer gratuitement', ctaButtonUrl: '/signup',
  channelBlog: true, channelWebhookEnabled: false, socialWebhookUrl: '', distributionWebhookUrl: '',
  metaTitle: '', metaDescription: '', status: 'DRAFT',
}

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erreur API')
  return json
}

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/admin/blog/upload', { method: 'POST', body: fd })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Erreur d'import")
  return json.data.url as string
}

async function aiField(mode: 'generate' | 'fix', fieldLabel: string, currentText: string, articleTitle: string, context?: string): Promise<string> {
  const res = await api('/api/admin/blog/ai-assist', {
    method: 'POST',
    body: JSON.stringify({ action: 'field', mode, fieldLabel, currentText, articleTitle, context }),
  })
  return res.data.text as string
}

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[éèêë]/g, 'e').replace(/[àâ]/g, 'a').replace(/[ùû]/g, 'u')
    .replace(/[ôö]/g, 'o').replace(/[îï]/g, 'i').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

function clampChain(blocks: Block[]): Block[] {
  let prev = 1
  return blocks.map((b) => {
    const max = Math.min(prev + 1, 6)
    const level = Math.max(2, Math.min(b.level, max))
    prev = level
    return { ...b, level }
  })
}

function HoverButton({ children, onClick, disabled, variant = 'default', style, type = 'button' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean
  variant?: 'default' | 'primary' | 'ghost' | 'danger'; style?: React.CSSProperties; type?: 'button' | 'submit'
}) {
  const [hover, setHover] = useState(false)
  const base = {
    default: { bg: T.card, bgHover: 'linear-gradient(135deg, #3a3a3a, #2c2c2c)', color: T.textDim, border: T.inputBorder },
    primary: { bg: T.blue, bgHover: 'linear-gradient(135deg, #3d96ff, #006FEE)', color: T.text, border: 'rgba(0,111,238,0.5)' },
    ghost: { bg: 'transparent', bgHover: 'rgba(255,255,255,0.06)', color: T.textDim, border: T.inputBorder },
    danger: { bg: T.red, bgHover: 'linear-gradient(135deg, #ff4d86, #F31260)', color: T.text, border: 'rgba(243,18,96,0.5)' },
  }[variant]
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        padding: '8px 14px', borderRadius: T.radiusForm, border: `1px solid ${base.border}`,
        background: hover && !disabled ? base.bgHover : base.bg, color: base.color,
        fontSize: 12, fontWeight: 600, fontFamily: T.font, cursor: disabled ? 'default' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6, opacity: disabled ? 0.55 : 1,
        transition: 'background 200ms, transform 150ms', transform: hover && !disabled ? 'translateY(-1px)' : 'none',
        whiteSpace: 'nowrap', ...style,
      }}
    >
      {children}
    </button>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', width: '100%' }}>
      {label}
      <span
        onClick={() => onChange(!checked)}
        style={{ width: 40, height: 22, borderRadius: 999, position: 'relative', flexShrink: 0, background: checked ? 'linear-gradient(135deg, #3d96ff, #006FEE)' : '#3a3a3a', transition: 'background 200ms' }}
      >
        <span style={{ position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#ffffff', transition: 'left 200ms' }} />
      </span>
    </label>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: T.radiusContainer, padding: 22, marginBottom: 16, ...style }}>{children}</div>
}

function inputStyle(multiline?: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '11px 14px', borderRadius: T.radiusForm, border: `1.5px solid ${T.inputBorder}`,
    background: T.inputBg, color: T.text, fontSize: 14, fontFamily: T.font, boxSizing: 'border-box',
    resize: multiline ? 'vertical' : undefined, outline: 'none',
  }
}

function UploadButton({ hasImage, onUploaded, onError }: { hasImage: boolean; onUploaded: (url: string, name: string) => void; onError: (msg: string) => void }) {
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <HoverButton variant="ghost" disabled={busy} onClick={() => inputRef.current?.click()}>
        <ImagePlus size={13} /> {busy ? 'Import...' : hasImage ? 'Remplacer' : 'Image'}
      </HoverButton>
      <input
        ref={inputRef}
        type="file" accept="image/*" style={{ display: 'none' }} disabled={busy}
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          setBusy(true)
          try {
            const url = await uploadImage(f)
            onUploaded(url, f.name)
          } catch (err) {
            onError(err instanceof Error ? err.message : "Erreur d'import")
          } finally {
            setBusy(false)
            e.target.value = ''
          }
        }}
      />
    </>
  )
}

function LevelSelect({ level, maxLevel, onChange }: { level: number; maxLevel: number; onChange: (l: number) => void }) {
  const options: number[] = []
  for (let l = 2; l <= maxLevel; l++) options.push(l)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={level} onChange={(e) => onChange(Number(e.target.value))}
        style={{ appearance: 'none', padding: '6px 26px 6px 10px', borderRadius: T.radiusForm, border: `1px solid ${T.inputBorder}`, background: T.inputBg, color: T.textDim, fontSize: 11, fontWeight: 700, fontFamily: T.font, cursor: 'pointer' }}
      >
        {options.map((l) => <option key={l} value={l}>H{l}</option>)}
      </select>
      <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: T.textFaint }} />
    </div>
  )
}

function AiButtons({ onGenerate, onFix, loading }: { onGenerate: () => void; onFix: () => void; loading: 'gen' | 'fix' | null }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <HoverButton variant="primary" onClick={onGenerate} disabled={loading === 'gen'}>
        <Sparkles size={13} /> {loading === 'gen' ? '...' : 'Generer'}
      </HoverButton>
      <HoverButton variant="ghost" onClick={onFix} disabled={loading === 'fix'}>
        <Wand2 size={13} /> {loading === 'fix' ? '...' : 'Corriger'}
      </HoverButton>
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const r = 46, c = 2 * Math.PI * r, offset = c - (score / 100) * c
  const color = score >= 70 ? T.success : score >= 40 ? T.warning : T.danger
  return (
    <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto' }}>
      <svg width="110" height="110">
        <circle cx="55" cy="55" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={9} fill="none" />
        <circle cx="55" cy="55" r={r} stroke={color} strokeWidth={9} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 55 55)" style={{ transition: 'stroke-dashoffset 300ms' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: T.text }}>{score}%</div>
    </div>
  )
}

export default function BlogEditor({ postId }: { postId?: string }) {
  const router = useRouter()
  const [post, setPost] = useState<PostData>(EMPTY_POST)
  const [loading, setLoading] = useState(!!postId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [tagsInput, setTagsInput] = useState('')
  const [tab, setTab] = useState<'kpi' | 'studio' | 'diffusion' | 'apis'>('kpi')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoPlatform, setVideoPlatform] = useState('YouTube')
  const [diffusing, setDiffusing] = useState(false)

  useEffect(() => {
    if (!postId) return
    api(`/api/admin/blog/${postId}`)
      .then((res) => {
        setPost({ ...EMPTY_POST, ...res.data, blocks: res.data.blocks?.length ? res.data.blocks : EMPTY_POST.blocks })
        setTagsInput((res.data.tags || []).join(', '))
        setLoading(false)
      })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [postId])

  const update = (patch: Partial<PostData>) => setPost((p) => ({ ...p, ...patch }))
  const blocks = useMemo(() => clampChain(post.blocks), [post.blocks])
  const getBlock = (key: BlockKey) => blocks.find((b) => b.key === key)!
  const sections = blocks.filter((b) => b.key === 'section')

  const updateBlock = (id: string, patch: Partial<Block>) =>
    update({ blocks: post.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
  const addSection = () =>
    update({ blocks: [...post.blocks, { id: genId(), key: 'section', heading: '', level: 2, content: '', imageUrl: '', imageAlt: '' }] })
  const removeSection = (id: string) => update({ blocks: post.blocks.filter((b) => b.id !== id) })

  const handleDiffuse = async () => {
    if (!post.channelWebhookEnabled && !post.distributionWebhookUrl?.trim()) {
      setError('Active un canal de diffusion (onglet DIFFUSION ou APIS) avant de diffuser.')
      return
    }
    setError('')
    setDiffusing(true)
    try {
      const payload = {
        meta: { source: 'scaleyourshop_blog', version: '1.0.0', timestamp: new Date().toISOString() },
        article: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          url: post.slug ? `https://scaleyourshop.app/blog/${post.slug}` : null,
          geo_question: getBlock('geo').content,
          semantic_hook: getBlock('hook').content,
          eeat_proof: getBlock('proof').content,
          cta_pitch: getBlock('cta').content,
          tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
          components: {
            faq_count: post.faqItems.length,
            sections_count: sections.length,
            videos_count: post.videos.length,
          },
        },
        media: post.coverImageUrl ? { url: post.coverImageUrl, alt: post.coverImageAlt, type: 'IMAGE' } : null,
        syndication: {
          linkedin_post: post.socialDrafts.linkedin || null,
          twitter_post: post.socialDrafts.twitter || null,
        },
      }

      const targets = [post.channelWebhookEnabled ? post.socialWebhookUrl : null, post.distributionWebhookUrl]
        .filter((u): u is string => !!u && u.trim().length > 0)

      if (targets.length === 0) {
        setError('Aucune URL de webhook valide configurée.')
        return
      }

      const results = await Promise.allSettled(
        targets.map((url) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }))
      )

      const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok))
      if (failed.length > 0) {
        setError(`${failed.length}/${targets.length} webhook(s) ont échoué. Vérifie les URLs configurées.`)
      } else {
        alert(`Article diffusé avec succès vers ${targets.length} destination(s).`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la diffusion')
    } finally {
      setDiffusing(false)
    }
  }

  const handleDelete = async () => {
    if (!postId) return
    if (!confirm('Supprimer définitivement cet article ? Cette action est irréversible.')) return
    try {
      await api(`/api/admin/blog/${postId}`, { method: 'DELETE' })
      router.push('/admin/blog')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  const save = async (statusOverride?: 'DRAFT' | 'PUBLISHED') => {
    setSaving(true)
    setError('')
    try {
      const autoExcerpt = post.excerpt.trim() || getBlock('hook').content.trim().slice(0, 160)
      const payload = { ...post, excerpt: autoExcerpt, blocks, tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean), status: statusOverride || post.status }
      if (postId) {
        await api(`/api/admin/blog/${postId}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        const res = await api('/api/admin/blog', { method: 'POST', body: JSON.stringify(payload) })
        router.push(`/admin/blog/${res.data.id}`)
        return
      }
      if (statusOverride) update({ status: statusOverride })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const runFieldAi = async (mode: 'generate' | 'fix', loadingKey: string, fieldLabel: string, currentText: string, apply: (text: string) => void, context?: string) => {
    setAiLoading(loadingKey)
    setError('')
    try {
      const text = await aiField(mode, fieldLabel, currentText, post.title, context)
      apply(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur IA')
    } finally {
      setAiLoading(null)
    }
  }

  const runInternalLinksAi = async () => {
    if (!postId) { setError('Enregistrez d\'abord l\'article avant de lancer le maillage interne.'); return }
    setAiLoading('links')
    setError('')
    try {
      const listRes = await api('/api/admin/blog')
      const otherArticles = (listRes.data || [])
        .filter((p: any) => p.status === 'PUBLISHED' && p.id !== postId)
        .map((p: any) => ({ title: p.title, slug: p.slug, excerpt: p.excerpt || '' }))

      if (otherArticles.length === 0) {
        setError('Aucun autre article publié à lier pour le moment.')
        return
      }

      const sectionsPayload = blocks.map((b) => ({ id: b.id, heading: b.heading, content: b.content }))
      const res = await api('/api/admin/blog/ai-assist', {
        method: 'POST',
        body: JSON.stringify({ action: 'internal_links', sections: sectionsPayload, otherArticles, articleTitle: post.title }),
      })

      const updated: { id: string; content: string }[] = res.data.sections || []
      update({
        blocks: post.blocks.map((b) => {
          const match = updated.find((u) => u.id === b.id)
          return match ? { ...b, content: match.content } : b
        }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur IA')
    } finally {
      setAiLoading(null)
    }
  }

  const runFaqAi = async () => {
    if (!post.title.trim()) { setError('Renseignez un titre avant de générer la FAQ.'); return }
    setAiLoading('faq')
    setError('')
    try {
      const fullContent = blocks.map((b) => `${b.heading}\n${b.content}`).join('\n\n')
      const res = await api('/api/admin/blog/ai-assist', { method: 'POST', body: JSON.stringify({ action: 'faq', title: post.title, content: fullContent }) })
      update({ faqItems: res.data.faqItems })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur IA')
    } finally {
      setAiLoading(null)
    }
  }

  const runSocialAi = async () => {
    if (!post.title.trim()) { setError('Renseignez un titre avant de générer les posts.'); return }
    setAiLoading('social')
    setError('')
    try {
      const ctaBlock = getBlock('cta')
      const res = await api('/api/admin/blog/ai-assist', { method: 'POST', body: JSON.stringify({ action: 'social', title: post.title, excerpt: post.excerpt, ctaPitch: ctaBlock.content }) })
      update({ socialDrafts: res.data.socialDrafts })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur IA')
    } finally {
      setAiLoading(null)
    }
  }

  const updateFaq = (idx: number, patch: Partial<FaqItem>) => {
    const items = [...post.faqItems]
    items[idx] = { ...items[idx], ...patch }
    update({ faqItems: items })
  }
  const removeFaq = (idx: number) => update({ faqItems: post.faqItems.filter((_, i) => i !== idx) })
  const addFaq = () => update({ faqItems: [...post.faqItems, { question: '', answer: '' }] })

  const geoC = getBlock('geo'), hookC = getBlock('hook'), proofC = getBlock('proof'), ctaC = getBlock('cta')
  const geoScore = (geoC.content.trim().length > 10 ? 30 : 0) + (hookC.content.trim().length >= 50 && hookC.content.trim().length <= 300 ? 70 : 0)
  const eeatScore = (proofC.content.trim().length >= 50 ? 50 : 0) + (ctaC.content.toLowerCase().includes('scaleyourshop') && ctaC.content.trim().length > 20 ? 50 : 0)
  const globalScore = Math.round(geoScore * 0.5 + eeatScore * 0.5)

  const generatedMarkdown = useMemo(() => {
    let md = ''
    if (post.title) md += `# ${post.title}\n\n`
    if (post.coverImageUrl) md += `![${post.coverImageAlt || post.title || 'Image principale'}](${post.coverImageUrl})\n\n`
    blocks.forEach((b) => {
      if (b.heading) md += `${'#'.repeat(b.level)} ${b.heading}\n`
      if (b.content) md += `${b.content}\n\n`
      if (b.imageUrl) md += `![${b.imageAlt || b.heading || 'Illustration'}](${b.imageUrl})\n\n`
    })
    post.videos.forEach((v) => { md += `<!-- embed:${v.platform} -->\n[Voir la video ${v.platform}](${v.url})\n\n` })
    return md.trim()
  }, [post.title, post.coverImageUrl, post.coverImageAlt, blocks, post.videos])

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textFaint, fontFamily: T.font }}>Chargement...</div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: T.bg, color: T.text, fontFamily: T.font }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: 60, borderBottom: `1px solid ${T.cardBorder}`, position: 'sticky', top: 0, background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(10px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/blog" style={{ color: T.textDim, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>&larr; Articles</Link>
          <span style={{ width: 1, height: 14, background: T.cardBorder }} />
          <span style={{ fontWeight: 800, fontSize: 15 }}>scaleyour<span style={{ color: T.accent }}>shop</span></span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'linear-gradient(135deg, #3d96ff, #006FEE)', color: 'white', letterSpacing: 0.4 }}>GROWTH ENGINE</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: post.status === 'PUBLISHED' ? 'rgba(23,201,100,0.15)' : 'rgba(255,255,255,0.08)', color: post.status === 'PUBLISHED' ? T.success : T.textDim, border: `1px solid ${post.status === 'PUBLISHED' ? 'rgba(23,201,100,0.3)' : T.inputBorder}` }}>
            {post.status === 'PUBLISHED' ? 'Publie' : 'Brouillon'}
          </span>
          {post.status === 'PUBLISHED' && post.slug && (
            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: T.accent, textDecoration: 'none', fontWeight: 600 }}>
              Voir l'article &rarr;
            </a>
          )}
          {postId && (
            <HoverButton variant="danger" onClick={handleDelete}>Supprimer</HoverButton>
          )}
          <HoverButton variant="ghost" onClick={handleDiffuse} disabled={diffusing}>{diffusing ? 'Diffusion...' : 'Diffuser l\'article'}</HoverButton>
          <HoverButton variant="ghost" onClick={() => save('DRAFT')} disabled={saving}>Enregistrer brouillon</HoverButton>
          <HoverButton variant="primary" onClick={() => save('PUBLISHED')} disabled={saving}>{saving ? '...' : 'Publier'}</HoverButton>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        <div>
          {error && <div style={{ padding: '12px 16px', borderRadius: T.radiusContainer, background: 'rgba(243,18,96,0.12)', border: '1px solid rgba(243,18,96,0.3)', color: '#FF6B96', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}><ImagePlus size={16} color={T.accent} /> Image principale</div>
              <UploadButton hasImage={!!post.coverImageUrl} onUploaded={(url, name) => update({ coverImageUrl: url, coverImageAlt: post.coverImageAlt || name })} onError={setError} />
            </div>
            {post.coverImageUrl && (
              <>
                <img src={post.coverImageUrl} alt={post.coverImageAlt} style={{ width: '100%', borderRadius: T.radiusContainer, marginBottom: 10, border: `1px solid ${T.cardBorder}` }} />
                <input value={post.coverImageAlt} onChange={(e) => update({ coverImageAlt: e.target.value })} placeholder="Texte alternatif (SEO)" style={inputStyle()} />
              </>
            )}
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}><FileText size={16} color={T.accent} /> Titre de l'article</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, padding: '6px 10px', borderRadius: T.radiusForm, border: `1px solid ${T.inputBorder}` }}>H1</span>
                <AiButtons
                  loading={aiLoading === 'title:gen' ? 'gen' : aiLoading === 'title:fix' ? 'fix' : null}
                  onGenerate={() => runFieldAi('generate', 'title:gen', 'Titre accrocheur e-commerce (H1)', post.title, (t) => update({ title: t }))}
                  onFix={() => runFieldAi('fix', 'title:fix', "Titre de l'article", post.title, (t) => update({ title: t }))}
                />
              </div>
            </div>
            <input value={post.title} onChange={(e) => update({ title: e.target.value })} placeholder="Titre accrocheur e-commerce" style={{ ...inputStyle(), fontSize: 18, fontWeight: 700 }} />
            <div style={{ textAlign: 'right', fontSize: 11, color: T.textFaint, marginTop: 6 }}>{post.title.length} / 60 car.</div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}><HelpCircle size={16} color={T.accent} /> Problematique e-commerce ciblee</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LevelSelect level={geoC.level} maxLevel={2} onChange={(l) => updateBlock(geoC.id, { level: l })} />
                <UploadButton hasImage={!!geoC.imageUrl} onUploaded={(url, name) => updateBlock(geoC.id, { imageUrl: url, imageAlt: geoC.imageAlt || name })} onError={setError} />
                <AiButtons
                  loading={aiLoading === 'geo:gen' ? 'gen' : aiLoading === 'geo:fix' ? 'fix' : null}
                  onGenerate={() => runFieldAi('generate', 'geo:gen', 'Question GEO (problematique tapee dans un moteur de recherche ou une IA)', geoC.content, (t) => updateBlock(geoC.id, { content: t }))}
                  onFix={() => runFieldAi('fix', 'geo:fix', 'Question GEO', geoC.content, (t) => updateBlock(geoC.id, { content: t }))}
                />
              </div>
            </div>
            <input value={geoC.heading} onChange={(e) => updateBlock(geoC.id, { heading: e.target.value })} placeholder={`Titre de section (H${geoC.level})`} style={{ ...inputStyle(), fontWeight: 700, marginBottom: 10 }} />
            <textarea value={geoC.content} onChange={(e) => updateBlock(geoC.id, { content: e.target.value })} rows={2} placeholder="Ex: Comment diviser par 2 les abandons de panier sur Shopify ?" style={inputStyle(true)} />
            {geoC.imageUrl && <img src={geoC.imageUrl} alt={geoC.imageAlt} style={{ width: '100%', borderRadius: T.radiusContainer, marginTop: 10, border: `1px solid ${T.cardBorder}` }} />}
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}><Zap size={16} color={T.accent} /> Hook semantique : la solution directe</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LevelSelect level={hookC.level} maxLevel={Math.min(geoC.level + 1, 6)} onChange={(l) => updateBlock(hookC.id, { level: l })} />
                <UploadButton hasImage={!!hookC.imageUrl} onUploaded={(url, name) => updateBlock(hookC.id, { imageUrl: url, imageAlt: hookC.imageAlt || name })} onError={setError} />
                <AiButtons
                  loading={aiLoading === 'hook:gen' ? 'gen' : aiLoading === 'hook:fix' ? 'fix' : null}
                  onGenerate={() => runFieldAi('generate', 'hook:gen', 'Reponse courte Position Zero (50 a 300 caracteres)', hookC.content, (t) => updateBlock(hookC.id, { content: t }))}
                  onFix={() => runFieldAi('fix', 'hook:fix', 'Hook semantique', hookC.content, (t) => updateBlock(hookC.id, { content: t }))}
                />
              </div>
            </div>
            <input value={hookC.heading} onChange={(e) => updateBlock(hookC.id, { heading: e.target.value })} placeholder={`Titre de section (H${hookC.level})`} style={{ ...inputStyle(), fontWeight: 700, marginBottom: 10 }} />
            <textarea value={hookC.content} onChange={(e) => updateBlock(hookC.id, { content: e.target.value })} rows={3} placeholder="Donnez la reponse immediate et technique" style={inputStyle(true)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: T.textFaint }}>
              <span>Optimise l'extraction en Position Zero.</span><span>{hookC.content.length} / 300 car.</span>
            </div>
            {hookC.imageUrl && <img src={hookC.imageUrl} alt={hookC.imageAlt} style={{ width: '100%', borderRadius: T.radiusContainer, marginTop: 10, border: `1px solid ${T.cardBorder}` }} />}
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}><ShieldCheck size={16} color={T.accent} /> Preuve et chiffre d'autorite (E-E-A-T)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LevelSelect level={proofC.level} maxLevel={Math.min(hookC.level + 1, 6)} onChange={(l) => updateBlock(proofC.id, { level: l })} />
                <UploadButton hasImage={!!proofC.imageUrl} onUploaded={(url, name) => updateBlock(proofC.id, { imageUrl: url, imageAlt: proofC.imageAlt || name })} onError={setError} />
                <AiButtons
                  loading={aiLoading === 'proof:gen' ? 'gen' : aiLoading === 'proof:fix' ? 'fix' : null}
                  onGenerate={() => runFieldAi('generate', 'proof:gen', "Preuve / chiffre d'autorite E-E-A-T", proofC.content, (t) => updateBlock(proofC.id, { content: t }))}
                  onFix={() => runFieldAi('fix', 'proof:fix', 'Preuve E-E-A-T', proofC.content, (t) => updateBlock(proofC.id, { content: t }))}
                />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textDim, marginBottom: 6 }}>Type de preuve</label>
              <div style={{ position: 'relative' }}>
                <select value={proofC.proofType || ''} onChange={(e) => updateBlock(proofC.id, { proofType: e.target.value })} style={{ ...inputStyle(), appearance: 'none', cursor: 'pointer' }}>
                  <option value="">Choisir un type de preuve</option>
                  {EEAT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: T.textFaint }} />
              </div>
            </div>
            <input value={proofC.heading} onChange={(e) => updateBlock(proofC.id, { heading: e.target.value })} placeholder={`Titre de section (H${proofC.level})`} style={{ ...inputStyle(), fontWeight: 700, marginBottom: 10 }} />
            <textarea value={proofC.content} onChange={(e) => updateBlock(proofC.id, { content: e.target.value })} rows={3} placeholder="Ex: En analysant notre cohorte de boutiques partenaires..." style={inputStyle(true)} />
            <div style={{ fontSize: 11, color: T.textFaint, marginTop: 8 }}>Minimum 50 caracteres pour valider le score E-E-A-T.</div>
            {proofC.imageUrl && <img src={proofC.imageUrl} alt={proofC.imageAlt} style={{ width: '100%', borderRadius: T.radiusContainer, marginTop: 10, border: `1px solid ${T.cardBorder}` }} />}
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}><Target size={16} color={T.accent} /> Pitch CTA</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LevelSelect level={ctaC.level} maxLevel={Math.min(proofC.level + 1, 6)} onChange={(l) => updateBlock(ctaC.id, { level: l })} />
                <UploadButton hasImage={!!ctaC.imageUrl} onUploaded={(url, name) => updateBlock(ctaC.id, { imageUrl: url, imageAlt: ctaC.imageAlt || name })} onError={setError} />
                <AiButtons
                  loading={aiLoading === 'cta:gen' ? 'gen' : aiLoading === 'cta:fix' ? 'fix' : null}
                  onGenerate={() => runFieldAi('generate', 'cta:gen', 'Pitch CTA mentionnant scaleyourshop', ctaC.content, (t) => updateBlock(ctaC.id, { content: t }))}
                  onFix={() => runFieldAi('fix', 'cta:fix', 'Pitch CTA', ctaC.content, (t) => updateBlock(ctaC.id, { content: t }))}
                />
              </div>
            </div>
            <input value={ctaC.heading} onChange={(e) => updateBlock(ctaC.id, { heading: e.target.value })} placeholder={`Titre de section (H${ctaC.level})`} style={{ ...inputStyle(), fontWeight: 700, marginBottom: 10 }} />
            <textarea value={ctaC.content} onChange={(e) => updateBlock(ctaC.id, { content: e.target.value })} rows={2} placeholder="Mentionnez explicitement scaleyourshop" style={inputStyle(true)} />
            <div style={{ fontSize: 11, color: T.textFaint, marginTop: 8 }}>Doit mentionner la marque pour valider le score E-E-A-T.</div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textDim, marginBottom: 6 }}>Libelle du bouton CTA</label>
                <input value={post.ctaButtonLabel} onChange={(e) => update({ ctaButtonLabel: e.target.value })} style={inputStyle()} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.textDim, marginBottom: 6 }}>URL du bouton CTA</label>
                <input value={post.ctaButtonUrl} onChange={(e) => update({ ctaButtonUrl: e.target.value })} placeholder="/signup" style={inputStyle()} />
              </div>
            </div>
            {ctaC.imageUrl && <img src={ctaC.imageUrl} alt={ctaC.imageAlt} style={{ width: '100%', borderRadius: T.radiusContainer, marginTop: 10, border: `1px solid ${T.cardBorder}` }} />}
          </Card>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 10px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textDim, letterSpacing: 0.3 }}>SECTIONS DE L'ARTICLE</div>
            <HoverButton variant="ghost" onClick={runInternalLinksAi} disabled={aiLoading === 'links'}>
              <Link2 size={13} /> {aiLoading === 'links' ? 'Analyse...' : 'Maillage interne'}
            </HoverButton>
          </div>
          {sections.map((b, i) => {
            const prevLevel = i === 0 ? ctaC.level : sections[i - 1].level
            const maxLevel = Math.min(prevLevel + 1, 6)
            return (
              <Card key={b.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
                    <FileText size={16} color={T.accent} /> Section {i + 1}{b.heading && ` - /${slugify(b.heading)}`}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LevelSelect level={b.level} maxLevel={maxLevel} onChange={(l) => updateBlock(b.id, { level: l })} />
                    <UploadButton hasImage={!!b.imageUrl} onUploaded={(url, name) => updateBlock(b.id, { imageUrl: url, imageAlt: b.imageAlt || name })} onError={setError} />
                    <AiButtons
                      loading={aiLoading === `sec${b.id}:gen` ? 'gen' : aiLoading === `sec${b.id}:fix` ? 'fix' : null}
                      onGenerate={() => runFieldAi('generate', `sec${b.id}:gen`, `Section d'article (titre + contenu), section numero ${i + 1}`, b.content, (t) => updateBlock(b.id, { content: t, heading: b.heading || 'Nouvelle section' }))}
                      onFix={() => runFieldAi('fix', `sec${b.id}:fix`, 'Contenu de section', b.content, (t) => updateBlock(b.id, { content: t }))}
                    />
                    {sections.length > 1 && (
                      <HoverButton variant="danger" onClick={() => removeSection(b.id)}><X size={12} /></HoverButton>
                    )}
                  </div>
                </div>
                <input value={b.heading} onChange={(e) => updateBlock(b.id, { heading: e.target.value })} placeholder={`Titre de section (H${b.level})`} style={{ ...inputStyle(), fontWeight: 700, marginBottom: 10 }} />
                <textarea value={b.content} onChange={(e) => updateBlock(b.id, { content: e.target.value })} rows={4} placeholder="Contenu de la section" style={inputStyle(true)} />
                {b.imageUrl && (
                  <div style={{ marginTop: 12 }}>
                    <img src={b.imageUrl} alt={b.imageAlt} style={{ width: '100%', borderRadius: T.radiusContainer, border: `1px solid ${T.cardBorder}`, marginBottom: 8 }} />
                    <input value={b.imageAlt} onChange={(e) => updateBlock(b.id, { imageAlt: e.target.value })} placeholder="Texte alternatif (SEO) de cette image" style={inputStyle()} />
                  </div>
                )}
              </Card>
            )
          })}
          <HoverButton variant="ghost" onClick={addSection} style={{ marginBottom: 24 }}><Plus size={14} /> Ajouter une section</HoverButton>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}><HelpCircle size={16} color={T.success} /> FAQ (Schema.org FAQPage)</div>
              <HoverButton variant="primary" onClick={runFaqAi} disabled={aiLoading === 'faq'}><Sparkles size={13} /> {aiLoading === 'faq' ? '...' : 'Generer'}</HoverButton>
            </div>
            {post.faqItems.length === 0 && <div style={{ fontSize: 13, color: T.textFaint, padding: '8px 0 14px' }}>Aucune question pour l'instant.</div>}
            {post.faqItems.map((f, i) => (
              <div key={i} style={{ padding: 14, background: T.inputBg, borderRadius: T.radiusContainer, marginBottom: 10, border: `1px solid ${T.cardBorder}` }}>
                <input value={f.question} onChange={(e) => updateFaq(i, { question: e.target.value })} placeholder="Question" style={{ ...inputStyle(), fontWeight: 600, marginBottom: 8 }} />
                <textarea value={f.answer} onChange={(e) => updateFaq(i, { answer: e.target.value })} placeholder="Reponse" rows={2} style={{ ...inputStyle(true), marginBottom: 8 }} />
                <HoverButton variant="danger" onClick={() => removeFaq(i)}><X size={12} /> Supprimer</HoverButton>
              </div>
            ))}
            <HoverButton variant="ghost" onClick={addFaq}><Plus size={13} /> Ajouter une question</HoverButton>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 12 }}><Video size={16} color={T.accent} /> Inserer une video (YouTube, Instagram, TikTok)</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <select value={videoPlatform} onChange={(e) => setVideoPlatform(e.target.value)} style={{ ...inputStyle(), width: 150 }}>
                <option>YouTube</option><option>Instagram</option><option>TikTok</option>
              </select>
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Coller le lien de la video" style={{ ...inputStyle(), flex: 1, minWidth: 200 }} />
              <HoverButton variant="primary" onClick={() => { if (videoUrl.trim()) { update({ videos: [...post.videos, { platform: videoPlatform, url: videoUrl.trim() }] }); setVideoUrl('') } }}>
                <Plus size={13} /> Inserer
              </HoverButton>
            </div>
            {post.videos.map((v, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: T.inputBg, borderRadius: T.radiusContainer, marginBottom: 6, fontSize: 12, color: T.textDim }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Link2 size={13} /> {v.platform} - {v.url}</span>
                <HoverButton variant="danger" onClick={() => update({ videos: post.videos.filter((_, idx) => idx !== i) })}><X size={12} /></HoverButton>
              </div>
            ))}
          </Card>

          <Card style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}><FileText size={16} color={T.accent} /> Markdown genere automatiquement (SEO-friendly)</div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(23,201,100,0.15)', color: T.success }}>AUTO</span>
            </div>
            <pre style={{ ...inputStyle(true), minHeight: 140, maxHeight: 280, overflow: 'auto', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', color: T.textDim, margin: 0 }}>
              {generatedMarkdown || '// Le markdown apparaitra ici au fur et a mesure de la saisie'}
            </pre>
          </Card>
        </div>

        <div style={{ position: 'sticky', top: 76, alignSelf: 'start' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.cardBorder}`, marginBottom: 16 }}>
            {([['kpi', 'KPI CONTENT'], ['studio', 'STUDIO IA'], ['diffusion', 'DIFFUSION'], ['apis', 'APIS']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: '10px 4px', background: 'none', border: 'none', borderBottom: tab === id ? `2px solid ${T.accent}` : '2px solid transparent', color: tab === id ? T.text : T.textFaint, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'kpi' && (
            <Card>
              <ScoreRing score={globalScore} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, marginBottom: 4 }}>
                <Gauge size={14} color={T.textDim} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Force de frappe de l'article</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: 11, color: T.warning, marginBottom: 18 }}>Score indicatif - la publication n'est jamais bloquee.</div>
              {([['Visibilite moteurs IA (GEO)', geoScore], ['Indice de preuve et conversion (E-E-A-T)', eeatScore]] as const).map(([label, value]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textDim, marginBottom: 6 }}>
                    <span>{label}</span><span style={{ fontWeight: 700, color: T.text }}>{value}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${value}%`, background: value >= 70 ? T.success : value >= 40 ? T.warning : T.danger, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {tab === 'studio' && (
            <Card>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, marginBottom: 14, textTransform: 'uppercase' }}>Studio media IA</div>
              {['Generer une image (Flux)', 'Generer une infographie (SVG)', 'Script video B-Roll'].map((l) => (
                <button key={l} disabled type="button" style={{ padding: '12px 14px', borderRadius: T.radiusForm, border: `1px dashed ${T.inputBorder}`, background: 'transparent', color: T.textFaint, fontSize: 12, fontWeight: 600, cursor: 'not-allowed', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 8, boxSizing: 'border-box', fontFamily: T.font }}>
                  <span>{l}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.08)' }}>BIENTOT</span>
                </button>
              ))}
            </Card>
          )}

          {tab === 'diffusion' && (
            <>
              <Card>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Canaux de distribution actives</div>
                <div style={{ background: T.inputBg, borderRadius: T.radiusContainer, padding: '14px 16px', marginBottom: 10 }}>
                  <Toggle checked={post.channelBlog} onChange={(v) => update({ channelBlog: v })} label={<span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}><Globe size={15} color={T.accent} /> scaleyourshop.com/blog</span>} />
                </div>
                <div style={{ background: T.inputBg, borderRadius: T.radiusContainer, padding: '14px 16px' }}>
                  <Toggle checked={post.channelWebhookEnabled} onChange={(v) => update({ channelWebhookEnabled: v })} label={<span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}><Share2 size={15} color={T.accent} /> Webhook reseaux (LinkedIn / X)</span>} />
                  {post.channelWebhookEnabled && (
                    <input value={post.socialWebhookUrl} onChange={(e) => update({ socialWebhookUrl: e.target.value })} placeholder="Coller l'URL du webhook" style={{ ...inputStyle(), marginTop: 12 }} />
                  )}
                </div>
              </Card>

              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, marginBottom: 12 }}><Code2 size={15} color={T.success} /> Balisage Schema.org JSON-LD</div>
                <pre style={{ ...inputStyle(true), margin: 0, fontFamily: 'monospace', fontSize: 12, color: T.success, whiteSpace: 'pre-wrap', background: T.inputBg }}>
{JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title || '[Titre]',
  description: hookC.content.slice(0, 80) || '[Description]',
}, null, 2)}
                </pre>
              </Card>

              <Card>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, marginBottom: 14, textTransform: 'uppercase' }}>Brouillons reseaux sociaux</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                  <HoverButton variant="primary" onClick={runSocialAi} disabled={aiLoading === 'social'}><Sparkles size={13} /> {aiLoading === 'social' ? '...' : 'Generer'}</HoverButton>
                </div>
                <textarea value={post.socialDrafts.linkedin || ''} onChange={(e) => update({ socialDrafts: { ...post.socialDrafts, linkedin: e.target.value } })} rows={4} placeholder="Post LinkedIn genere" style={{ ...inputStyle(true), marginBottom: 10 }} />
                <textarea value={post.socialDrafts.twitter || ''} onChange={(e) => update({ socialDrafts: { ...post.socialDrafts, twitter: e.target.value } })} rows={3} placeholder="Post Twitter/X genere" style={inputStyle(true)} />
              </Card>
            </>
          )}

          {tab === 'apis' && (
            <Card>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, marginBottom: 14, textTransform: 'uppercase' }}>Webhook de diffusion multi-reseaux</div>
              <input value={post.distributionWebhookUrl} onChange={(e) => update({ distributionWebhookUrl: e.target.value })} placeholder="https://hook.eu1.make.com/..." style={inputStyle()} />
              <div style={{ fontSize: 11, color: T.textFaint, marginTop: 8, lineHeight: 1.5 }}>URL de ton automatisation externe (Make, Zapier, n8n) pour la diffusion multi-reseaux.</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
