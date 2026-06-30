'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LOGO_DATA_URI } from '@/lib/logo'

// ── Data ─────────────────────────────────────────────────────────────────────
type Step = {
  id: string; tag: string; title: string; badge: string
  problem: string; solution: string; before: string; after: string
}

const PIPELINE: Step[] = [
  { id: 'auth', tag: '01 · CONNEXION_API', title: 'Connexion authentifiée aux deux boutiques', badge: 'API',
    problem: "Le transfert entre boutique mère et boutique géo doit passer par les APIs officielles (Shopify Admin / WooCommerce REST), pas par scraping HTML.",
    solution: "Le client autorise l'app via OAuth ou clés API. On stocke le mapping shop_source ↔ shop_cible explicitement — un lien déclaré, pas une fuite à corriger.",
    before: 'Aucune connexion\ndéclarée', after: 'shop_source: monsite-fr (autorisé)\nshop_cible:  monsite-de (autorisé)\nscope: read/write_products' },
  { id: 'fetch', tag: '02 · RÉCUPÉRATION', title: 'Lecture du catalogue source via API', badge: 'API',
    problem: "Récupérer fiches, variantes, stocks et images sans dépendre du HTML ni de signatures CDN.",
    solution: "Appel direct aux endpoints produits/variantes/images. Les données arrivent structurées (JSON), pas de parsing d'URLs.",
    before: 'GET /products.json\n(scraping)', after: 'GET /admin/api/2024-10/\n     products.json\nAuthorization: Bearer …' },
  { id: 'image', tag: '03 · IMAGES', title: 'Traitement image standard', badge: 'WebP',
    problem: "Les images sources peuvent être lourdes ou dans un format non optimal pour la cible.",
    solution: "Conversion WebP, compression qualité 85, tailles responsive. Aucun bruit ni désynchro — l'image reste fidèle, juste optimisée.",
    before: 'JPEG · 1200×1200\n340 KB', after: 'WebP · 400/800/1600\n~120 KB (800px)' },
  { id: 'filename', tag: '04 · NOMMAGE', title: 'Nommage cohérent et traçable', badge: 'Files',
    problem: "Des noms incohérents entre boutiques rendent la maintenance et le support difficiles.",
    solution: "Convention stable : slug + variante + langue. Le lien au produit source reste lisible pour le support et la sync de stock.",
    before: 'IMG_20240512_3.jpg', after: 'montre-skull-homme-\nvariante-noir-01.webp' },
  { id: 'dedup', tag: '05 · DÉDUPLICATION', title: 'Déduplication par hash', badge: 'Hash',
    problem: "Sans contrôle, la même image est uploadée plusieurs fois (par variante, par langue), gonflant le stockage.",
    solution: "Hash SHA256 avant upload. Si l'image existe déjà côté cible, on réutilise l'ID au lieu de réuploader.",
    before: '3 variantes →\n3 uploads identiques', after: '3 variantes →\n1 fichier, 3 références' },
  { id: 'localize', tag: '06 · LOCALISATION', title: 'Adaptation réelle par marché', badge: 'LLM',
    problem: "Une traduction littérale ne suffit pas : unités, devise, réglementation, ton et attentes diffèrent par pays.",
    solution: "Traduction + adaptation réelle : conversion d'unités, devise locale, mentions légales du pays, ton, FAQ et livraison. L'IA ajoute de la valeur locale.",
    before: 'Titre FR copié →\ntraduit littéralement DE', after: 'Titre + desc réécrits DE\ntailles cm · prix EUR\ngarantie légale DE' },
  { id: 'seo', tag: '07 · SEO_MULTI-PAYS', title: 'Contenu compatible hreflang', badge: 'SEO',
    problem: "Sans signalisation, Google peut voir deux catalogues proches comme du contenu dupliqué.",
    solution: "Contenu réellement localisé par boutique, prêt à être signalé via hreflang (WPML/Polylang, Shopify Markets). Le contenu rend la déclaration pertinente.",
    before: 'Traduit littéralement\nbase hreflang faible', after: '<link rel="alternate"\n hreflang="de-DE"\n href="…/produit" />' },
  { id: 'json', tag: '08 · PAYLOAD', title: 'Payload avec traçabilité de mapping', badge: 'JSON',
    problem: "Pour synchroniser stocks et mises à jour, il faut savoir quel produit cible correspond à quel produit source.",
    solution: "Le payload conserve un mapping interne source↔cible (sync stock/prix futures) sans l'exposer publiquement sur la fiche.",
    before: '{ "source_url":"…",\n  "supplier_id":"…" }\n// exposé', after: '{ "title":"Totenkopf-Uhr",\n  "internal_mapping":{…},\n  "status":"published" }' },
  { id: 'rollout', tag: '09 · RYTHME', title: 'Déploiement progressif', badge: 'Rollout',
    problem: "Publier des centaines de produits d'un coup sur un domaine récent ressemble à un pattern automatisé.",
    solution: "Étalement sur jours/semaines avec planification dans l'app — ça correspond aussi à un vrai rythme d'expansion business.",
    before: '1200 produits\nen 40 minutes', after: '1200 produits\nsur 3 semaines, par lots' },
]

const MARKETS = ['FR','DE','ES','IT','NL','BE','PT','AT','PL','SE','DK','FI','IE','GR','CZ','RO','HU','SK','LU','SI','HR','EE']
const NEG = ['Traduction littérale (Google Translate)','Scraping HTML fragile','Pas de hreflang déclaré','Filenames incohérents','Aucun mapping source↔cible','Import massif instantané']
const POS = ['Localisation IA réelle (unités, devise, ton)','Connexion API officielle (OAuth/clés)','hreflang + sitemap par marché','Nommage cohérent et traçable','Mapping conservé pour la sync stock','Déploiement progressif par lots']
const BOOT = [
  { text: '> init scaleyourshop.pipeline', color: '#22c55e' },
  { text: '> auth shop_source ......... ok', color: '#22c55e' },
  { text: '> auth shop_cible .......... ok', color: '#22c55e' },
  { text: '> load 9 modules ........... ok', color: '#22c55e' },
  { text: '> ready ▮', color: '#ffffff' },
]

// ── Keyframes + hover (injected once) ────────────────────────────────────────
const GLOBAL_CSS = `
  .syg *{box-sizing:border-box}
  .syg ::selection{background:#FA0C00;color:#fff}
  @keyframes syg-glRed{0%{clip-path:inset(0 0 0 0);transform:translate(2px,0)}15%{clip-path:inset(18% 0 62% 0);transform:translate(4px,-1px)}30%{clip-path:inset(66% 0 8% 0);transform:translate(1px,1px)}45%{clip-path:inset(40% 0 38% 0);transform:translate(3px,0)}60%{clip-path:inset(8% 0 78% 0);transform:translate(2px,1px)}75%,100%{clip-path:inset(0 0 0 0);transform:translate(2px,0)}}
  @keyframes syg-glCyan{0%{clip-path:inset(0 0 0 0);transform:translate(-2px,0)}15%{clip-path:inset(72% 0 12% 0);transform:translate(-4px,1px)}30%{clip-path:inset(22% 0 58% 0);transform:translate(-1px,-1px)}45%{clip-path:inset(50% 0 30% 0);transform:translate(-3px,0)}60%{clip-path:inset(4% 0 84% 0);transform:translate(-2px,-1px)}75%,100%{clip-path:inset(0 0 0 0);transform:translate(-2px,0)}}
  @keyframes syg-glSkew{0%,86%,100%{transform:skewX(0deg)}88%{transform:skewX(7deg)}90%{transform:skewX(-5deg)}92%{transform:skewX(3deg)}94%{transform:skewX(0deg)}}
  @keyframes syg-ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes syg-gridDrift{from{background-position:0 0}to{background-position:0 56px}}
  @keyframes syg-scan{from{transform:translateY(-120%)}to{transform:translateY(120%)}}
  @keyframes syg-pulse{0%,100%{opacity:.35}50%{opacity:.9}}
  @keyframes syg-blink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes syg-btnGlitch{0%{text-shadow:0 0 0 transparent;transform:translateY(-1px)}25%{text-shadow:-2px 0 #00e5ff,2px 0 #ff2d2d}50%{transform:translate(1px,-2px)}75%{text-shadow:2px 0 #00e5ff,-2px 0 #ff2d2d}100%{text-shadow:0 0 0 transparent;transform:translateY(-1px)}}
  @keyframes syg-revealUp{0%{opacity:0;transform:translateY(28px)}55%{opacity:1}68%{transform:translateY(0) skewX(0deg)}71%{transform:translateY(0) skewX(2.5deg)}74%{transform:translateY(0) skewX(-1.5deg)}77%{transform:translateY(0) skewX(0deg)}100%{opacity:1;transform:translateY(0)}}
  .syg-btn:hover{animation:syg-btnGlitch .4s steps(2,end) infinite}
  .syg-btn-primary:hover{box-shadow:0 0 44px rgba(250,12,0,0.65)}
  .syg-btn-ghost:hover{border-color:#FA0C00;color:#fff}
  .syg-btn-cta:hover{box-shadow:0 0 56px rgba(250,12,0,0.7)}
  .syg-reveal{opacity:0}
  .syg-reveal.in{animation:syg-revealUp .75s cubic-bezier(.2,.7,.2,1) forwards}
  .syg-hamburger{display:none}
  @media (max-width:860px){
    .syg-nav-links{display:none !important}
    .syg-hamburger{display:flex !important}
    .syg-pipeline-grid{grid-template-columns:1fr !important}
    .syg-compare-grid{grid-template-columns:1fr !important}
  }
`

const FONT = "'Space Grotesk', system-ui, sans-serif"
const MONO = "'Space Mono', ui-monospace, monospace"

export default function PageInternationalGlitch() {
  const [active, setActive] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [booting, setBooting] = useState(true)
  const [bootStep, setBootStep] = useState(1)
  const [bootFade, setBootFade] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const barRef = useRef<HTMLDivElement | null>(null)
  const labRef = useRef<HTMLDivElement | null>(null)

  // boot sequence
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 2; i <= BOOT.length; i++) timers.push(setTimeout(() => setBootStep(i), (i - 1) * 180))
    const base = BOOT.length * 180
    timers.push(setTimeout(() => setBootFade(true), base + 350))
    timers.push(setTimeout(() => setBooting(false), base + 750))
    return () => timers.forEach(clearTimeout)
  }, [])

  // pipeline autoplay
  useEffect(() => {
    if (!autoplay) return
    const t = setInterval(() => setActive(p => (p + 1) % PIPELINE.length), 3800)
    return () => clearInterval(t)
  }, [autoplay])

  // scroll reveal
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.syg-reveal'))
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  // scroll progress
  useEffect(() => {
    const onScroll = () => {
      const max = (document.documentElement.scrollHeight - window.innerHeight) || 1
      const p = Math.min(100, Math.max(0, Math.round(window.scrollY / max * 100)))
      if (barRef.current) barRef.current.style.width = p + '%'
      if (labRef.current) labRef.current.textContent = 'scroll: ' + p + '%'
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const select = (i: number) => { setAutoplay(false); setActive(i) }
  const cur = PIPELINE[active]
  const ticker = (
    <>{MARKETS.map((m, i) => (
      <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <span style={{ color: '#fff', padding: '0 14px' }}>{m}</span>
        <span style={{ color: '#FA0C00' }}>·</span>
      </span>
    ))}</>
  )

  return (
    <div className="syg" style={{ background: '#0a0a0a', color: '#fff', fontFamily: FONT, overflow: 'hidden', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* SCROLL PROGRESS */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 60, background: '#161616' }}>
        <div ref={barRef} style={{ height: '100%', width: '0%', background: '#FA0C00', boxShadow: '0 0 10px #FA0C00', transition: 'width 90ms linear' }} />
      </div>
      <div ref={labRef} style={{ position: 'fixed', bottom: 14, right: 14, zIndex: 60, fontFamily: MONO, fontSize: 10, color: '#FA0C00', letterSpacing: '0.5px', pointerEvents: 'none', background: 'rgba(10,10,10,0.7)', padding: '3px 8px', borderRadius: 6, border: '1px solid #2a0c08' }}>scroll: 0%</div>

      {/* BOOT */}
      {booting && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: bootFade ? 0 : 1, transition: 'opacity .4s ease' }}>
          <div style={{ fontFamily: MONO, fontSize: 14, lineHeight: 2.1, width: 'min(460px,82vw)' }}>
            {BOOT.map((b, i) => (
              <div key={i} style={{ color: b.color, opacity: i < bootStep ? 1 : 0, transition: 'opacity 120ms' }}>{b.text}</div>
            ))}
          </div>
        </div>
      )}

      {/* NAV */}
      <div style={{ position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, padding: '0 28px', borderBottom: '1px solid #161616', background: 'rgba(10,10,10,0.6)', backdropFilter: 'blur(8px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
          <img src={LOGO_DATA_URI} alt="ScaleYourShop" style={{ width: 30, height: 30, borderRadius: 7, objectFit: 'cover', boxShadow: '0 0 18px rgba(250,12,0,0.5)' }} />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.4px', color: '#fff' }}>Scale<span style={{ color: '#FA0C00' }}>Your</span>Shop</span>
        </Link>
        <div className="syg-nav-links" style={{ display: 'flex', gap: 26, alignItems: 'center', fontFamily: MONO, fontSize: 12 }}>
          <a href="#pipeline" style={{ color: '#666', textDecoration: 'none' }}>pipeline</a>
          <a href="/#pricing" style={{ color: '#666', textDecoration: 'none' }}>marchés</a>
          <a href="/#pricing" style={{ color: '#666', textDecoration: 'none' }}>tarifs</a>
          <Link href="/signup" style={{ padding: '8px 18px', borderRadius: 999, background: '#fff', color: '#0a0a0a', fontWeight: 700, letterSpacing: '-0.2px', textDecoration: 'none' }}>essai_gratuit</Link>
        </div>
        <button
          className="syg-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          style={{ alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8, border: '1px solid #2a2a2a', background: '#0c0c0c', color: '#fff', fontSize: 16, cursor: 'pointer' }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
        {menuOpen && (
          <div style={{ position: 'fixed', top: 60, left: 0, right: 0, height: 'calc(100dvh - 60px)', zIndex: 9998, background: '#0a0a0a', padding: 24, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', fontFamily: MONO }}>
            <a href="#pipeline" onClick={() => setMenuOpen(false)} style={{ padding: '14px 4px', fontSize: 15, color: '#fff', textDecoration: 'none', fontWeight: 600, borderBottom: '1px solid #1a1a1a' }}>pipeline</a>
            <a href="/#pricing" onClick={() => setMenuOpen(false)} style={{ padding: '14px 4px', fontSize: 15, color: '#fff', textDecoration: 'none', fontWeight: 600, borderBottom: '1px solid #1a1a1a' }}>marchés</a>
            <a href="/#pricing" onClick={() => setMenuOpen(false)} style={{ padding: '14px 4px', fontSize: 15, color: '#fff', textDecoration: 'none', fontWeight: 600, borderBottom: '1px solid #1a1a1a' }}>tarifs</a>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link href="/signup" onClick={() => setMenuOpen(false)} style={{ display: 'inline-block', padding: '14px 40px', borderRadius: 999, background: '#fff', color: '#0a0a0a', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                essai_gratuit
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* HERO */}
      <div style={{ position: 'relative', padding: '96px 28px 84px', textAlign: 'center', borderBottom: '1px solid #161616' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#FA0C0010 1px,transparent 1px),linear-gradient(90deg,#FA0C0010 1px,transparent 1px)', backgroundSize: '56px 56px', animation: 'syg-gridDrift 5s linear infinite', WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 35%,#000 0%,transparent 75%)', maskImage: 'radial-gradient(ellipse 80% 70% at 50% 35%,#000 0%,transparent 75%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 680, height: 480, background: 'radial-gradient(circle,#FA0C0022 0%,transparent 65%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: 130, background: 'linear-gradient(transparent,#FA0C0008,transparent)', animation: 'syg-scan 6s linear infinite' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 880, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '6px 15px', borderRadius: 999, background: '#120606', border: '1px solid #2a0c08', fontFamily: MONO, fontSize: 11, letterSpacing: '1px', color: '#FA0C00', marginBottom: 30 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FA0C00', animation: 'syg-pulse 1.6s ease-in-out infinite' }} />
            PIPELINE_PROPRIÉTAIRE // 9_ÉTAPES
          </div>

          <h1 style={{ fontSize: 'clamp(2.7rem,7.5vw,5.6rem)', fontWeight: 700, lineHeight: 1.0, letterSpacing: '-3px', margin: '0 0 26px' }}>
            <span style={{ display: 'block', color: '#fff' }}>Votre catalogue.</span>
            <span style={{ display: 'inline-block', position: 'relative', animation: 'syg-glSkew 5.5s infinite', color: '#FA0C00' }}>
              <span style={{ position: 'relative', zIndex: 3 }}>22 marchés.</span>
              <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, color: '#00e5ff', mixBlendMode: 'screen', animation: 'syg-glCyan 2.6s steps(2,end) infinite' }}>22 marchés.</span>
              <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, color: '#ffffff', mixBlendMode: 'screen', animation: 'syg-glRed 3.3s steps(2,end) infinite' }}>22 marchés.</span>
            </span>
            <span style={{ display: 'block', color: '#3a3a3a' }}>En règle.</span>
          </h1>

          <p style={{ fontFamily: FONT, fontSize: 17, lineHeight: 1.65, color: '#888', maxWidth: '54ch', margin: '0 auto 38px' }}>
            ScaleYourShop ne traduit pas — il <strong style={{ color: '#fff', fontWeight: 600 }}>localise</strong>. Chaque produit transféré passe par 9 étapes qui adaptent réellement votre catalogue à chaque marché. Relation déclarée et transparente entre vos boutiques — pas une dissimulation.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#pipeline" className="syg-btn syg-btn-primary" style={{ padding: '14px 30px', borderRadius: 999, background: '#FA0C00', color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '-0.2px', boxShadow: '0 0 30px rgba(250,12,0,0.4)', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>Voir la pipeline →</a>
            <Link href="/signup" className="syg-btn syg-btn-ghost" style={{ padding: '14px 30px', borderRadius: 999, border: '1px solid #2a2a2a', background: 'transparent', color: '#aaa', fontWeight: 600, fontSize: 15, fontFamily: MONO, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>commencer_gratuitement</Link>
          </div>
        </div>
      </div>

      {/* TICKER */}
      <div style={{ position: 'relative', borderBottom: '1px solid #161616', background: '#0c0c0c', overflow: 'hidden', padding: '16px 0', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)', maskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)' }}>
        <div style={{ display: 'flex', width: 'max-content', animation: 'syg-ticker 28s linear infinite', fontFamily: MONO, fontSize: 13, letterSpacing: '1px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>{ticker}</div>
          <div style={{ display: 'flex', alignItems: 'center' }} aria-hidden>{ticker}</div>
        </div>
      </div>

      {/* PIPELINE */}
      <div id="pipeline" className="syg-reveal" style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '2px', color: '#FA0C00', marginBottom: 14 }}>[ 9 ÉTAPES · AUTOMATISÉES · ACTIVÉES PAR DÉFAUT ]</div>
          <h2 style={{ fontSize: 'clamp(1.9rem,3.4vw,2.8rem)', fontWeight: 700, letterSpacing: '-1.5px', margin: '0 0 12px' }}>La pipeline de localisation</h2>
          <p style={{ fontSize: 15, color: '#777', maxWidth: '52ch', margin: '0 auto', fontFamily: MONO }}>&gt; cliquez une étape pour voir ce qui est transformé<span style={{ animation: 'syg-blink 1.1s step-end infinite' }}>_</span></p>
        </div>

        <div className="syg-pipeline-grid" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 26, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {PIPELINE.map((s, i) => {
              const on = i === active
              return (
                <div key={s.id} onClick={() => select(i)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', borderRadius: 12, cursor: 'pointer', transition: 'all 200ms', border: `1px solid ${on ? '#FA0C00' : '#1a1a1a'}`, background: on ? '#150909' : '#0c0c0c', boxShadow: on ? '0 0 0 1px rgba(250,12,0,0.25),0 10px 30px rgba(250,12,0,0.12)' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: MONO, fontSize: 12, fontWeight: 700, background: on ? '#FA0C00' : '#161616', color: on ? '#fff' : '#555', boxShadow: on ? '0 0 16px rgba(250,12,0,0.4)' : 'none' }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: on ? '#fff' : '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: on ? '#FA0C00' : '#555', letterSpacing: '0.4px' }}>{s.tag}</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, padding: '4px 9px', borderRadius: 999, background: on ? 'rgba(250,12,0,0.12)' : '#161616', color: on ? '#FA0C00' : '#666', border: `1px solid ${on ? 'rgba(250,12,0,0.35)' : '#222'}`, flexShrink: 0 }}>{s.badge}</div>
                </div>
              )
            })}
          </div>

          <div style={{ position: 'sticky', top: 20, background: '#0e0e0e', border: '1px solid #1d1d1d', borderRadius: 18, padding: 30, boxShadow: '0 0 0 1px #FA0C0014,0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#FA0C00', letterSpacing: '0.5px' }}>{cur.tag}</span>
              <span style={{ width: 1, height: 13, background: '#2a2a2a' }} />
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#FA0C00', color: '#fff' }}>{cur.badge}</span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.6px', margin: '0 0 18px', lineHeight: 1.2 }}>{cur.title}</h3>
            <div style={{ padding: '13px 16px', background: '#150707', border: '1px solid #2a0c08', borderRadius: 11, marginBottom: 12 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: '#FA0C00', letterSpacing: '1px', marginBottom: 7 }}>// PROBLÈME</div>
              <div style={{ fontSize: 13, color: '#cc9988', lineHeight: 1.6 }}>{cur.problem}</div>
            </div>
            <div style={{ padding: '13px 16px', background: '#08130b', border: '1px solid #0d3018', borderRadius: 11, marginBottom: 20 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: '#22c55e', letterSpacing: '1px', marginBottom: 7 }}>// SOLUTION</div>
              <div style={{ fontSize: 13, color: '#8fc9a4', lineHeight: 1.6 }}>{cur.solution}</div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: '1px', marginBottom: 10 }}>// TRANSFORMATION</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#070707', border: '1px solid #1a1a1a', borderRadius: 10, padding: 14 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: '#666', letterSpacing: '1px', marginBottom: 8 }}>AVANT</div>
                <pre style={{ margin: 0, fontFamily: MONO, fontSize: 11, color: '#888', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{cur.before}</pre>
              </div>
              <div style={{ background: '#070b07', border: '1px solid #0d3018', borderRadius: 10, padding: 14 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: '#22c55e', letterSpacing: '1px', marginBottom: 8 }}>APRÈS</div>
                <pre style={{ margin: 0, fontFamily: MONO, fontSize: 11, color: '#86efac', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{cur.after}</pre>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 24 }}>
              {PIPELINE.map((_, i) => (
                <div key={i} onClick={() => select(i)} style={{ width: i === active ? 22 : 7, height: 7, borderRadius: 999, background: i === active ? '#FA0C00' : '#2a2a2a', cursor: 'pointer', transition: 'all 300ms', boxShadow: i === active ? '0 0 12px rgba(250,12,0,0.6)' : 'none' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COMPARE */}
      <div className="syg-reveal" style={{ borderTop: '1px solid #161616', background: '#0c0c0c', padding: '80px 28px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,3.2vw,2.4rem)', fontWeight: 700, letterSpacing: '-1px', margin: '0 0 10px' }}>Import basique <span style={{ color: '#3a3a3a' }}>vs</span> ScaleYourShop</h2>
            <p style={{ fontFamily: MONO, fontSize: 13, color: '#666', margin: 0 }}>diff --git a/basique b/scaleyourshop</p>
          </div>
          <div className="syg-compare-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#555', marginBottom: 18, fontFamily: MONO }}>- import_basique</div>
              <div style={{ display: 'grid', gap: 11 }}>
                {NEG.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, lineHeight: 1.45 }}>
                    <span style={{ color: '#555', fontWeight: 700, fontFamily: MONO, flexShrink: 0 }}>−</span>
                    <span style={{ color: '#666' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#0e0a0a', border: '1px solid #2a0c08', borderRadius: 16, padding: 24, boxShadow: '0 0 0 1px #FA0C0014' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#FA0C00', marginBottom: 18, fontFamily: MONO }}>+ scaleyourshop</div>
              <div style={{ display: 'grid', gap: 11 }}>
                {POS.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, lineHeight: 1.45 }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, fontFamily: MONO, flexShrink: 0 }}>+</span>
                    <span style={{ color: '#ddd' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="syg-reveal" style={{ position: 'relative', textAlign: 'center', padding: '100px 28px', borderTop: '1px solid #161616', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: '-30%', left: '50%', transform: 'translateX(-50%)', width: 720, height: 520, background: 'radial-gradient(circle,#FA0C0018 0%,transparent 65%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 700, letterSpacing: '-2px', lineHeight: 1.05, margin: '0 0 18px' }}>Scalez vers toute<br />l'Europe, sans bruit.</h2>
          <p style={{ fontSize: 16, color: '#888', lineHeight: 1.6, maxWidth: '46ch', margin: '0 auto 34px' }}>9 étapes de localisation activées par défaut. Aucune configuration. Votre catalogue est prêt pour chaque marché dès le premier transfert.</p>
          <Link href="/signup" className="syg-btn syg-btn-cta" style={{ display: 'inline-block', padding: '16px 44px', borderRadius: 999, background: '#FA0C00', color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', boxShadow: '0 0 40px rgba(250,12,0,0.45)', cursor: 'pointer', textDecoration: 'none' }}>Commencer gratuitement →</Link>
          <div style={{ fontFamily: MONO, fontSize: 12, color: '#555', marginTop: 18 }}>// sans_carte_bancaire · pipeline_complète_dès_le_premier_transfert</div>
        </div>
      </div>
    </div>
  )
}
