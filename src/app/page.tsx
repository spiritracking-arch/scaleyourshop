"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LOGO_DATA_URI } from "@/lib/logo";

// ── Responsive overrides (inline-styles codebase, so media queries live here) ──
function ResponsiveStyles() {
  return (
    <style>{`
      @media (max-width: 860px) {
        .nav-links-desktop { display: none !important; }
        .nav-hamburger { display: flex !important; }
        .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; text-align: left; }
        .feature-row { grid-template-columns: 1fr !important; direction: ltr !important; gap: 24px !important; }
        .pricing-grid { grid-template-columns: 1fr !important; }
        .social-proof-row { justify-content: flex-start !important; }
        .nav-bar { padding: 0 20px !important; }
        section { padding-left: 20px !important; padding-right: 20px !important; }
        .hero-title { font-size: clamp(2rem, 6vw, 3rem) !important; }
      }
      @media (max-width: 480px) {
        .stat-row { gap: 16px !important; }
        .social-proof-row { gap: 24px !important; }
        .social-proof-logos { gap: 16px !important; }
        .social-proof-divider { display: none !important; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px) translateX(0px); }
        50% { transform: translateY(-20px) translateX(10px); }
      }
      @keyframes float-slow {
        0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
        50% { transform: translateY(-30px) translateX(-15px) scale(1.05); }
      }
      @keyframes pulse-glow {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.1); }
      }
      @keyframes gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes slide-up {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      html { scroll-behavior: smooth; }

      .btn-glow { position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      .btn-glow::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s; }
      .btn-glow:hover::after { left: 100%; }
      .btn-glow:hover { transform: translateY(-2px); }

      .btn-primary-gradient { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.6); }
      .btn-primary-gradient:hover { box-shadow: 0 15px 40px -10px rgba(99, 102, 241, 0.8); filter: brightness(1.1); }

      .btn-glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15); }
      .btn-glass:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); }

      .btn-white-glow { background: white; color: #1a1a1a; box-shadow: 0 10px 30px -10px rgba(255, 255, 255, 0.5); }
      .btn-white-glow:hover { box-shadow: 0 15px 40px -10px rgba(255, 255, 255, 0.8); transform: translateY(-2px); }

      .btn-outline-glass { border: 2px solid rgba(255,255,255,0.2); background: transparent; color: rgba(255,255,255,0.8); }
      .btn-outline-glass:hover { border-color: rgba(255,255,255,0.5); color: white; background: rgba(255,255,255,0.05); }


      .pricing-card {
        background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.08);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .pricing-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      }
      .pricing-card-popular {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.06) 100%);
        border: 1px solid rgba(139, 92, 246, 0.5);
        box-shadow: 0 0 40px rgba(139, 92, 246, 0.15);
      }
      .pricing-card-popular:hover {
        box-shadow: 0 0 60px rgba(139, 92, 246, 0.25), 0 20px 40px rgba(0,0,0,0.3);
      }

    `}</style>
  );
}


function FadeIn({ children, delay = 0, style = {}, direction = "up" }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties; direction?: "up" | "down" | "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.05, rootMargin: "0px" });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  
  const transforms = {
    up: "translateY(40px)",
    down: "translateY(-40px)",
    left: "translateX(-40px)",
    right: "translateX(40px)",
  };
  
  return (
    <div ref={ref} style={{opacity: 1, transform: vis ? "translate(0, 0)" : transforms[direction], transition: `opacity 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`, ...style, }}>
      {children}
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    tag: "Reformulation géo",
    title: "Reformulation native, jamais de traduction machine !",
    desc: "Chaque titre et description est réécrit nativement dans la langue cible par IA et adapté au marché local de ton e-commerce pour chaque pays. Pas de Google Translate ou DeePL !.",
    visual: [
      { lang: "🇫🇷", text: "Montre chronographe homme acier" },
      { lang: "🇩🇪", text: "Herren Chronograph Edelstahl Uhr" },
      { lang: "🇪🇸", text: "Reloj cronógrafo para hombre en acero" },
      { lang: "🇮🇹", text: "Orologio cronografo da uomo in acciaio" },
    ],
  },
  {
    tag: "Variantes",
    title: "Chaque variante avec son image dédiée",
    desc: "Chaque option de variante (couleur, matière, taille) reçoit son image propre, convertie en WebP optimisé. Un niveau de détail que personne d'autre n'automatise.",
    visual: [
      { label: "Leather Black Silver", img: "◼" },
      { label: "Mesh Silver Gold", img: "⬜" },
      { label: "Leather Rose Blue", img: "🔵" },
      { label: "Mesh Black Blue", img: "⬛" },
    ],
    isVariant: true,
  },
  {
    tag: "Multi-boutique",
    title: "1 source = 22 marchés potentiels",
    desc: "Un seul catalogue source, autant de boutiques cibles que vous voulez. WooCommerce to WooCommerce, Shopify to Shopify, Woocommerce to Shopify, Shopify to Woocommerce.",
    visual: null as null,
    isFlow: true,
  },
];

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    desc: "Lancez-vous sur 1 nouveau marché, une bonne fois pour toutes",
    price: { once: 49 },
    type: "once",
    popular: false,
    features: [
      { ok: true,  text: "100 produits (transfert unique)" },
      { ok: true,  text: "3 boutiques cibles" },
      { ok: true,  text: "Reformulation native par IA" },
      { ok: true,  text: "Images WebP optimisées" },
      { ok: true,  text: "Variantes avec images dédiées" },
      { ok: true,  text: "22 langues EU" },
      { ok: false, text: "Transferts illimités" },
      { ok: false, text: "Synchronisation automatique" },
      { ok: false, text: "Accès API" },
    ],
    cta: "Commencer — 49€",
    note: "Paiement unique · Quota utilisable en une ou plusieurs sessions",
  },
  {
    id: "growth",
    name: "Growth",
    desc: "Pour les marchands qui scalent sérieusement",
    price: { monthly: 99 },
    type: "monthly",
    popular: true,
    features: [
      { ok: true,  text: "500 produits / mois" },
      { ok: true,  text: "10 boutiques cibles" },
      { ok: true,  text: "Reformulation native par IA" },
      { ok: true,  text: "Images WebP optimisées" },
      { ok: true,  text: "Variantes avec images dédiées" },
      { ok: true,  text: "22 langues EU" },
      { ok: true,  text: "Transferts illimités" },
      { ok: false, text: "Synchronisation automatique" },
      { ok: false, text: "Accès API" },
    ],
    note: "Sans engagement · Résiliable à tout moment",
  },
  {
    id: "business",
    name: "Business",
    desc: "Pour les agences et multi-marques",
    price: { monthly: 299 },
    type: "monthly",
    popular: false,
    features: [
      { ok: true, text: "5 000 produits / mois" },
      { ok: true, text: "Boutiques illimitées" },
      { ok: true, text: "Reformulation native par IA" },
      { ok: true, text: "Images WebP optimisées" },
      { ok: true, text: "Variantes avec images dédiées" },
      { ok: true, text: "22 langues EU" },
      { ok: true, text: "Transferts illimités" },
      { ok: true, text: "Synchronisation automatique (bientôt)" },
      { ok: true, text: "Accès API (bientôt)" },
    ],
    note: "Onboarding personnalisé inclus · Sans engagement",
  },
];

const FAQS = [
  { q: "Quelles plateformes sont supportées ?", a: "WooCommerce et Shopify, en source comme en cible — dans les deux sens et toutes les combinaisons (WooCommerce vers Shopify, Shopify vers WooCommerce, etc.)." },
  { q: "Comment fonctionne la localisation ?", a: "Une IA réécrit chaque titre et description nativement dans la langue cible, en restant fidèle au contenu d'origine — ce n'est pas une traduction littérale (Google Translate, DeepL), mais le ton et le registre sont adaptés pour sonner naturel dans chaque marché." },
  { q: "Mes clés API sont-elles sécurisées ?", a: "Vos clés sont chiffrées (AES-256) et utilisées uniquement pendant le transfert. Elles ne sont jamais stockées en clair sur nos serveurs." },
  { q: "Puis-je tester avant d'acheter ?", a: "Oui — le plan FREE vous permet de transférer jusqu'à 5 produits gratuitement et sans carte bancaire. Un mode aperçu (dry run) est aussi disponible pour simuler un transfert complet avant de l'exécuter." },
  { q: "Que se passe-t-il si un produit échoue ?", a: "Chaque produit est traité indépendamment. En cas d'échec partiel, vous recevez un rapport détaillé et pouvez relancer uniquement les produits concernés." },
  { q: "Peut-on transférer un catalogue entier ?", a: "Oui. Le plan Business permet des transferts illimités. Vous pouvez aussi filtrer par catégorie avant de lancer le transfert." },
];

// ── Components ────────────────────────────────────────────────────────────────
function Nav({ scrolled }: { scrolled: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const NAV_LINKS: [string, string][] = [["Fonctionnalités", "#features"], ["Localisation smart", "/localisation-smart"], ["Tarifs", "#pricing"], ["FAQ", "#faq"]];

  return (
    <nav className="nav-bar" style={{position: "fixed", top: 0, left: 0, right: 0, zIndex: 9998, background: scrolled || menuOpen ? "rgba(255, 255, 255, 0.97)" : "transparent", backdropFilter: scrolled || menuOpen ? "blur(10px)" : "none", borderBottom: scrolled || menuOpen ? "1px solid #e5e5e5" : "1px solid transparent", padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 250ms ease", }}>
      <Link href="/" aria-label="ScaleYourShop — Accueil" style={{display: "flex", alignItems: "center", gap: 10, textDecoration: "none"}}>
        <img src={LOGO_DATA_URI} alt="ScaleYourShop" style={{width: 42, height: 42, borderRadius: 9, objectFit: "cover"}} />
        <span style={{fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px", color: scrolled ? "#1a1a1a" : "white"}}>Scale<span style={{color: scrolled ? "#FA0C00" : "#818cf8"}}>Your</span>Shop</span>
      </Link>

      <div className="nav-links-desktop" style={{display: "flex", alignItems: "center", gap: 32}}>
        {NAV_LINKS.map(([label, href]) => (
          <a key={label} href={href} style={{fontSize: 14, color: scrolled ? "#444" : "rgba(255, 255, 255, 0.85)", textDecoration: "none", fontWeight: 500}}>{label}</a>
        ))}
        <Link href="/login" style={{fontSize: 14, color: scrolled ? "#444" : "rgba(255, 255, 255, 0.85)", textDecoration: "none", fontWeight: 500}}>
          Connexion
        </Link>
        <Link href="/signup" style={{padding: "9px 22px", borderRadius: 999, border: scrolled ? "none" : "1px solid rgba(255, 255, 255, 0.3)", background: scrolled ? "#1a1a1a" : "rgba(255, 255, 255, 0.1)", color: scrolled ? "white" : "white", fontWeight: 600, fontSize: 14, cursor: "pointer", textDecoration: "none", backdropFilter: scrolled ? "none" : "blur(10px)", transition: "all 250ms ease"}}>
          Essai gratuit
        </Link>
      </div>

      <button
        className="nav-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
        style={{display: "none", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, border: scrolled ? "1px solid #e5e5e5" : "1px solid rgba(255, 255, 255, 0.3)", background: scrolled ? "white" : "rgba(255, 255, 255, 0.1)", fontSize: 18, cursor: "pointer", color: scrolled ? "#1a1a1a" : "white", backdropFilter: scrolled ? "none" : "blur(10px)", transition: "all 250ms ease"}}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {menuOpen && (
        <div style={{position: "fixed", top: 64, left: 0, right: 0, height: "calc(100dvh - 64px)", zIndex: 9999, background: "white", padding: "24px 24px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", }}>
          {NAV_LINKS.map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)} style={{padding: "14px 4px", fontSize: 16, color: "#1a1a1a", textDecoration: "none", fontWeight: 600, borderBottom: "1px solid #f5f5f5"}}>{label}</a>
          ))}
          <Link href="/login" onClick={() => setMenuOpen(false)} style={{padding: "14px 4px", fontSize: 16, color: "#1a1a1a", textDecoration: "none", fontWeight: 600, borderBottom: "1px solid #f5f5f5"}}>
            Connexion
          </Link>
          <div style={{textAlign: "center", marginTop: 16}}>
            <Link href="/signup" onClick={() => setMenuOpen(false)} style={{display: "inline-block", padding: "14px 40px", borderRadius: 999, border: "none", background: "#1a1a1a", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", textDecoration: "none"}}>
              Essai gratuit
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  const [tick, setTick] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 2000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const langs = ["🇫🇷 Français", "🇩🇪 Deutsch", "🇪🇸 Español", "🇮🇹 Italiano", "🇳🇱 Nederlands", "🇵🇹 Português"];
  const active = tick % langs.length;

  return (
    <section style={{minHeight: "100dvh", display: "flex", alignItems: "center", background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)", paddingTop: 64, position: "relative", overflow: "hidden", }}>
            <HeroBackgroundAnimation />
          
      {/* Animated background orbs */}
      <div style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none"}}>
        <div style={{position: "absolute", top: "10%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)", animation: "float 20s ease-in-out infinite", transform: `translateY(${scrollY * 0.1}px)`, }} />
        <div style={{position: "absolute", bottom: "20%", right: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)", animation: "float-slow 25s ease-in-out infinite", transform: `translateY(${scrollY * -0.15}px)`, }} />
        <div style={{position: "absolute", top: "50%", left: "50%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)", animation: "pulse-glow 15s ease-in-out infinite", transform: `translate(-50%, -50%) translateY(${scrollY * 0.08}px)`, }} />
      </div>

      <div className="hero-grid" style={{maxWidth: 1200, margin: "0 auto", padding: "0 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", width: "100%", boxSizing: "border-box", position: "relative", zIndex: 1, }}>

        {/* Left */}
        <div>
          <FadeIn delay={0}>
            <div style={{display: "inline-block", padding: "6px 16px", borderRadius: 999, background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.2)", fontSize: 12, fontWeight: 700, color: "rgba(255, 255, 255, 0.9)", letterSpacing: "0.8px", marginBottom: 24}}>
              MULTI-BOUTIQUE · INTERNATIONAL
            </div>
          </FadeIn>
          
          <FadeIn delay={100}>
            <h1 className="hero-title" style={{fontSize: "clamp(2.4rem, 7vw, 4.2rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-2px", margin: "0 0 28px", background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #c7d2fe 100%)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "gradient-shift 8s ease infinite", }}>
              Votre catalogue.<br />
              22 pays.<br />
              <span style={{background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", }}>En 1 clic.</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={200}>
            <p style={{fontSize: 17, color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.7, maxWidth: "50ch", marginBottom: 40}}>
              Connectez WooCommerce une fois : chaque nouveau marché se déploie ensuite en un clic, avec une reformulation native par IA et des images optimisées.
            </p>
          </FadeIn>
          
          <FadeIn delay={300}>
            <div style={{display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40}}>
              <Link href="/signup" style={{padding: "14px 32px", borderRadius: 999, border: "none", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", textDecoration: "none", display: "inline-block", boxShadow: "0 10px 30px rgba(99, 102, 241, 0.4)", transition: "all 0.2s ease", }}>
                Commencer gratuitement
              </Link>
              <a href="#features" style={{padding: "14px 32px", borderRadius: 999, border: "2px solid rgba(255, 255, 255, 0.3)", background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(10px)", color: "white", fontWeight: 600, fontSize: 15, cursor: "pointer", textDecoration: "none", display: "inline-block", transition: "all 0.2s ease", }}>
                Découvrir les fonctionnalités →
              </a>
            </div>
          </FadeIn>
          
          <FadeIn delay={400}>
            <p style={{fontSize: 12, color: "rgba(255, 255, 255, 0.5)", letterSpacing: "0.2px"}}>Sans carte bancaire · Aperçu gratuit illimité</p>
          </FadeIn>
        </div>

        {/* Right — animated transfer preview with glassmorphism */}
        <FadeIn delay={200} direction="right">
          <div style={{background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(8px)", borderRadius: 24, padding: 28, border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)", transform: `translateY(${scrollY * -0.05}px)`, transition: "transform 100ms ease-out", }}>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6}}>
              <span style={{fontSize: 12, fontWeight: 700, color: "rgba(255, 255, 255, 0.6)", letterSpacing: "0.8px"}}>TRANSFERT EN COURS</span>
              <span style={{fontSize: 12, color: "rgba(255, 255, 255, 0.5)"}}>3/6 boutiques</span>
            </div>
            <div style={{fontSize: 11, color: "rgba(255, 255, 255, 0.4)", marginBottom: 14}}>Démo en direct — simulation d'un transfert vers 6 boutiques cibles</div>
            <div style={{display: "grid", gap: 8}}>
              {langs.map((lang, i) => {
                const done = i < active;
                const running = i === active;
                return (
                  <div key={lang} style={{display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: done ? "rgba(255, 255, 255, 0.08)" : running ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.03)", border: running ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)", transition: "all 400ms ease", boxShadow: running ? "0 0 20px rgba(99, 102, 241, 0.3)" : "none", }}>
                    <span style={{fontSize: 18}}>{lang.split(" ")[0]}</span>
                    <span style={{flex: 1, fontSize: 13, fontWeight: 500, color: done ? "rgba(255, 255, 255, 0.6)" : "white"}}>{lang.split(" ")[1]}</span>
                    {done && <span style={{fontSize: 12, color: "#10b981", fontWeight: 600}}>✓</span>}
                    {running && (
                      <span style={{display: "flex", gap: 3}}>
                        {[0, 1, 2].map(j => (
                          <span key={j} style={{width: 5, height: 5, borderRadius: "50%", background: "#818cf8", display: "inline-block", opacity: 0.3, animation: `dot 1s ease-in-out ${j * 200}ms infinite`}} />
                        ))}
                      </span>
                    )}
                    {!done && !running && <span style={{fontSize: 12, color: "rgba(255, 255, 255, 0.3)"}}>—</span>}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)", fontFamily: "monospace", fontSize: 12, color: "rgba(255, 255, 255, 0.6)"}}>
              42 produits · 156 variantes · WebP ✓ · IA ✓
            </div>
          </div>
        </FadeIn>
      </div>
      <style>{`@keyframes dot{0%,100%{opacity:.2}50%{opacity:1}}`}</style>
    </section>
  );
}


function Process() {
  const steps = [
    {
      num: "01",
      icon: "🔌",
      title: "Connectez vos boutiques",
      desc: "Ajoutez votre boutique source et vos boutiques cibles en quelques clics. Clés API sécurisées (chiffrées AES-256).",
      color: "#818cf8",
    },
    {
      num: "02",
      icon: "⚙️",
      title: "Configurez votre transfert",
      desc: "Choisissez les produits, catégories, langues cibles. Activez la reformulation IA et l'optimisation WebP.",
      color: "#a78bfa",
    },
    {
      num: "03",
      icon: "🚀",
      title: "Lancez en 1 clic",
      desc: "L'IA réécrit nativement chaque titre et description. Les images sont optimisées. Les variantes reçoivent leurs propres médias.",
      color: "#c084fc",
    },
    {
      num: "04",
      icon: "📈",
      title: "Scalez vos marchés",
      desc: "Dupliquez vers 22 pays en simultané. Suivez chaque transfert en temps réel. Relancez les échecs individuellement.",
      color: "#e879f9",
    },
  ];

  return (
    <section style={{background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%)", padding: "clamp(5rem, 10vw, 9rem) 40px", position: "relative", overflow: "hidden", }}>
      {/* Orbes lumineux en arrière-plan (cohérent avec Hero) */}
      <div style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none"}}>
        <div style={{position: "absolute", top: "20%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(129, 140, 248, 0.1) 0%, transparent 70%)", animation: "float 18s ease-in-out infinite", }} />
        <div style={{position: "absolute", bottom: "10%", right: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(192, 132, 252, 0.08) 0%, transparent 70%)", animation: "float-slow 22s ease-in-out infinite", }} />
      </div>

      <div style={{maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1}}>
        <FadeIn style={{textAlign: "center", marginBottom: 72}}>
          <div style={{display: "inline-block", padding: "6px 16px", borderRadius: 999, background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.15)", fontSize: 12, fontWeight: 700, color: "rgba(255, 255, 255, 0.9)", letterSpacing: "0.8px", marginBottom: 20}}>
            COMMENT ÇA MARCHE
          </div>
          <h2 style={{fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 900, letterSpacing: "-1.5px", margin: "0 0 16px", background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", }}>
            <TextReveal>De 0 à 22 pays en 4 étapes</TextReveal>
          </h2>
          <p style={{fontSize: 17, color: "rgba(255, 255, 255, 0.6)", maxWidth: "52ch", margin: "0 auto", lineHeight: 1.6}}>
            Un process simple et automatisé pour déployer votre catalogue international.
          </p>
        </FadeIn>

        <div className="process-grid" style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, position: "relative", }}>
          {/* Ligne de connexion */}
          <div style={{position: "absolute", top: 60, left: "12.5%", right: "12.5%", height: 2, background: "linear-gradient(90deg, rgba(129, 140, 248, 0.3) 0%, rgba(192, 132, 252, 0.5) 50%, rgba(232, 121, 249, 0.3) 100%)", zIndex: 0, }} />

          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div style={{position: "relative", zIndex: 1, textAlign: "center", }}>
                {/* Cercle avec numéro */}
                <div style={{width: 120, height: 120, borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(8px)", border: `2px solid ${step.color}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: `0 10px 40px ${step.color}30`, position: "relative", transition: "all 0.2s ease", }}>
                  <span style={{fontSize: 48}}>{step.icon}</span>
                  <div style={{position: "absolute", top: -8, right: -8, width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${step.color} 0%, ${step.color}dd 100%)`, color: "white", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${step.color}50`, }}>
                    {step.num}
                  </div>
                </div>

                {/* Contenu */}
                <h3 style={{fontSize: 18, fontWeight: 800, color: "white", margin: "0 0 12px", letterSpacing: "-0.5px", }}>
                  {step.title}
                </h3>
                <p style={{fontSize: 14, color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.6, margin: 0, }}>
                  {step.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Plateformes supportées */}
        <FadeIn delay={350} style={{textAlign: "center", marginTop: 48}}>
          <div className="platform-animation" style={{maxWidth: 800, margin: "0 auto", padding: "48px 32px", borderRadius: 28, background: "rgba(255, 255, 255, 0.02)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.06)", position: "relative", overflow: "hidden", }}>
            {/* Background glow */}
            <div style={{position: "absolute", top: "50%", left: "20%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(150, 88, 138, 0.15) 0%, transparent 70%)", transform: "translate(-50%, -50%)", filter: "blur(40px)", pointerEvents: "none"}} />
            <div style={{position: "absolute", top: "50%", right: "20%", borderRadius: "50%", background: "radial-gradient(circle, rgba(150, 191, 72, 0.12) 0%, transparent 70%)", transform: "translate(50%, -50%)", filter: "blur(40px)", pointerEvents: "none", width: 200, height: 200}} />

            <div style={{fontSize: 11, fontWeight: 700, color: "rgba(255, 255, 255, 0.4)", letterSpacing: "1.5px", marginBottom: 36, textAlign: "center"}}>
              COMPATIBILITÉ MULTI-PLATEFORMES
            </div>

            <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 0, position: "relative"}}>

              {/* WooCommerce Logo */}
              <div style={{position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 12}}>
                <div className="logo-glow-woo" style={{width: 100, height: 100, borderRadius: 24, background: "rgba(150, 88, 138, 0.1)", border: "1px solid rgba(150, 88, 138, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(150, 88, 138, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)", }}>
                  <img src="/logos/woocommerce.svg" alt="WooCommerce" style={{height: 56, width: 56}} />
                </div>
                <span style={{fontSize: 13, fontWeight: 700, color: "rgba(255, 255, 255, 0.8)"}}>WooCommerce</span>
              </div>

              {/* Animated Flow Lines */}
              <div style={{flex: 1, maxWidth: 320, height: 100, position: "relative", margin: "0 -8px", marginBottom: 28}}>
                {/* Line 1: Woo → Shop (top) */}
                <svg style={{position: "absolute", top: 15, left: 0, width: "100%", height: 20}} viewBox="0 0 320 20" preserveAspectRatio="none">
                  <path d="M 0 10 Q 160 -5 320 10" fill="none" stroke="rgba(150, 88, 138, 0.3)" strokeWidth="1.5" />
                  <circle r="4" fill="#96588a" opacity="0.9">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 0 10 Q 160 -5 320 10" />
                  </circle>
                  <circle r="2.5" fill="#c084fc" opacity="0.6">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 0 10 Q 160 -5 320 10" begin="1.2s" />
                  </circle>
                </svg>

                {/* Line 2: Shop → Woo (bottom) */}
                <svg style={{position: "absolute", top: 65, left: 0, width: "100%", height: 20}} viewBox="0 0 320 20" preserveAspectRatio="none">
                  <path d="M 320 10 Q 160 25 0 10" fill="none" stroke="rgba(150, 191, 72, 0.3)" strokeWidth="1.5" />
                  <circle r="4" fill="#96bf48" opacity="0.9">
                    <animateMotion dur="2.8s" repeatCount="indefinite" path="M 320 10 Q 160 25 0 10" />
                  </circle>
                  <circle r="2.5" fill="#a3e635" opacity="0.6">
                    <animateMotion dur="2.8s" repeatCount="indefinite" path="M 320 10 Q 160 25 0 10" begin="1.4s" />
                  </circle>
                </svg>

                {/* Center label */}
                <div style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", padding: "6px 14px", borderRadius: 999, background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)", whiteSpace: "nowrap", }}>
                  <span style={{fontSize: 11, fontWeight: 700, color: "rgba(255, 255, 255, 0.6)", letterSpacing: "0.5px"}}>BIDIRECTIONNEL</span>
                </div>

                {/* Arrow right */}
                <div style={{position: "absolute", top: 8, right: -2, fontSize: 12, color: "rgba(150, 88, 138, 0.6)"}}>→</div>
                {/* Arrow left */}
                <div style={{position: "absolute", bottom: 8, left: -2, fontSize: 12, color: "rgba(150, 191, 72, 0.6)"}}>←</div>
              </div>

              {/* Shopify Logo */}
              <div style={{position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 12}}>
                <div className="logo-glow-shop" style={{width: 100, height: 100, borderRadius: 24, background: "rgba(150, 191, 72, 0.08)", border: "1px solid rgba(150, 191, 72, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(150, 191, 72, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)", }}>
                  <img src="/logos/shopify.svg" alt="Shopify" style={{height: 56, width: 56}} />
                </div>
                <span style={{fontSize: 13, fontWeight: 700, color: "rgba(255, 255, 255, 0.8)"}}>Shopify</span>
              </div>

            </div>

            {/* 4 flow labels */}
            <div style={{display: "flex", justifyContent: "center", gap: 16, marginTop: 32, flexWrap: "wrap"}}>
              {[
                { label: "Woo → Woo", color: "#96588a" },
                { label: "Shop → Shop", color: "#96bf48" },
                { label: "Woo → Shop", color: "#818cf8" },
                { label: "Shop → Woo", color: "#a78bfa" },
              ].map((item, i) => (
                <div key={i} style={{padding: "6px 14px", borderRadius: 999, background: `${item.color}15`, border: `1px solid ${item.color}30`, fontSize: 11, fontWeight: 600, color: item.color, letterSpacing: "0.3px", }}>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          <style>{`
            @keyframes pulse-arrow {
              0%, 100% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.2); }
            }
            .logo-glow-woo { animation: glow-woo 4s ease-in-out infinite; }
            .logo-glow-shop { animation: glow-shop 4s ease-in-out infinite 2s; }
            @keyframes glow-woo {
              0%, 100% { box-shadow: 0 0 30px rgba(150, 88, 138, 0.15), inset 0 1px 0 rgba(255,255,255,0.1); }
              50% { box-shadow: 0 0 50px rgba(150, 88, 138, 0.35), 0 0 80px rgba(150, 88, 138, 0.1), inset 0 1px 0 rgba(255,255,255,0.15); }
            }
            @keyframes glow-shop {
              0%, 100% { box-shadow: 0 0 30px rgba(150, 191, 72, 0.12), inset 0 1px 0 rgba(255,255,255,0.1); }
              50% { box-shadow: 0 0 50px rgba(150, 191, 72, 0.3), 0 0 80px rgba(150, 191, 72, 0.08), inset 0 1px 0 rgba(255,255,255,0.15); }
            }
          `}</style>
        </FadeIn>

        {/* CTA sous la timeline */}
        <FadeIn delay={400} style={{textAlign: "center", marginTop: 64}}>
          <Link href="/signup" className="btn-glow btn-primary-gradient" style={{height: "56px", padding: "0 32px", fontSize: "16px", fontWeight: 800, borderRadius: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", textDecoration: "none", border: "none", cursor: "pointer"}}>
            Commencer maintenant →
          </Link>
          <p style={{fontSize: 12, color: "rgba(255, 255, 255, 0.5)", marginTop: 16}}>
            Gratuit · Sans carte bancaire · Configuration en 2 minutes
          </p>
        </FadeIn>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 860px) {
          .process-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .process-grid > div[style*="linear-gradient(90deg"] {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}



function HeroBackgroundAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const cardsRef = useRef<Array<{
    el: HTMLDivElement;
    tx: number;
    ty: number;
    delay: number;
    duration: number;
    startTime: number;
  }>>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Créer les 22 cartes en DOM
    const flags = ['🇫🇷', '🇩🇪', '🇪🇸', '🇮🇹', '🇳🇱', '🇵🇹', '🇧🇪', '🇦🇹', '🇨🇭', '🇬🇷', '🇵🇱', '🇨🇿', '🇭🇺', '🇷🇴', '🇧🇬', '🇭🇷', '🇸🇰', '🇸🇮', '🇱🇹', '🇱🇻', '🇪🇪', '🇸🇪'];
    const isMobile = window.innerWidth < 768;
    const numCards = isMobile ? 10 : 22;
    const cards: typeof cardsRef.current = [];

    for (let i = 0; i < numCards; i++) {
      const el = document.createElement('div');
      el.className = 'market-card';
      el.innerHTML = `<span class="market-flag">${flags[i % flags.length]}</span><span class="market-label">Shop #${i + 1}</span>`;
      container.appendChild(el);

      const angle = (i / numCards) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = isMobile ? 25 + Math.random() * 20 : 30 + Math.random() * 40;

      cards.push({
        el,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        delay: Math.random() * 5000,
        duration: 5000 + Math.random() * 4000,
        startTime: performance.now() + Math.random() * 5000,
      });
    }

    cardsRef.current = cards;
    startedRef.current = true;

    const animate = (now: number) => {
      if (!startedRef.current) return;

      cards.forEach(card => {
        let elapsed = now - card.startTime;
        if (elapsed < 0) {
          card.el.style.opacity = '0';
          return;
        }

        // Loop
        const loopTime = elapsed % (card.duration + 2000);
        const progress = Math.min(loopTime / card.duration, 1);

        // Easing
        let opacity: number;
        let scale: number;
        let currentTx: number;
        let currentTy: number;

        if (progress < 0.1) {
          const t = progress / 0.1;
          opacity = t;
          scale = 0.3 + t * 0.4;
          currentTx = card.tx * t * 0.15;
          currentTy = card.ty * t * 0.15;
        } else if (progress < 0.75) {
          const t = (progress - 0.1) / 0.65;
          opacity = 1;
          scale = 0.7 + t * 0.3;
          currentTx = card.tx * (0.15 + t * 0.85);
          currentTy = card.ty * (0.15 + t * 0.85);
        } else {
          const t = (progress - 0.75) / 0.25;
          opacity = 1 - t;
          scale = 1;
          currentTx = card.tx;
          currentTy = card.ty;
        }

        // Reset pendant la pause
        if (loopTime > card.duration) {
          opacity = 0;
          scale = 0.3;
          currentTx = 0;
          currentTy = 0;
        }

        card.el.style.opacity = String(opacity);
        card.el.style.transform = `translate3d(calc(-50% + ${currentTx}vw), calc(-50% + ${currentTy}vh), 0) scale(${scale})`;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      startedRef.current = false;
      cancelAnimationFrame(rafRef.current);
      cards.forEach(card => card.el.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className="hero-bg-animation" />
  );
}

function TextReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div 
      ref={ref}
      style={{display: 'inline-block', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(60px)', transition: `all 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`, }}
    >
      {children}
    </div>
  );
}

function AnimReformulation() {
  const countries = [
    { flag: "🇫🇷", lang: "Français", text: "Montre chronographe homme acier" },
    { flag: "🇩", lang: "Deutsch", text: "Herren Chronograph Edelstahl Uhr" },
    { flag: "🇪🇸", lang: "Español", text: "Reloj cronógrafo para hombre en acero" },
    { flag: "🇹", lang: "Italiano", text: "Orologio cronografo da uomo in acciaio" },
    { flag: "🇳🇱", lang: "Nederlands", text: "Heren chronograaf stalen horloge" },
    { flag: "🇵", lang: "Português", text: "Relógio cronógrafo homem em aço" },
    { flag: "🇧🇪", lang: "Français (BE)", text: "Montre chronographe homme acier" },
    { flag: "🇦🇹", lang: "Deutsch (AT)", text: "Herren Chronograph Edelstahl Uhr" },
    { flag: "🇨🇭", lang: "Deutsch (CH)", text: "Herren Chronograph Edelstahl Uhr" },
    { flag: "🇬🇷", lang: "Ελληνικά", text: "Ανδρικό χρονόγραφο ατσάλι" },
    { flag: "🇵", lang: "Polski", text: "Męski zegarek chronograf ze stali" },
    { flag: "🇨", lang: "Čeština", text: "Pánské ocelové chronograf hodinky" },
    { flag: "🇭", lang: "Magyar", text: "Férfi acél kronográf óra" },
    { flag: "🇷🇴", lang: "Română", text: "Ceas cronograf bărbătesc din oțel" },
    { flag: "🇧🇬", lang: "Български", text: "Мъжки хронограф стоманен часовник" },
    { flag: "🇭🇷", lang: "Hrvatski", text: "Muški kronograf čelični sat" },
    { flag: "🇸🇰", lang: "Slovenčina", text: "Pánske oceľové chronograf hodinky" },
    { flag: "🇸🇮", lang: "Slovenščina", text: "Moška jeklena kronograf ura" },
    { flag: "🇱🇹", lang: "Lietuvių", text: "Vyriškas plieninis chronografas" },
    { flag: "🇱🇻", lang: "Latviešu", text: "Vīriešu tērauda hronogrāfs" },
    { flag: "🇪", lang: "Eesti", text: "Meeste terasest kronograaf" },
    { flag: "🇸🇪", lang: "Svenska", text: "Herrkronograf i rostfritt stål" },
  ];
  // Dupliquer la liste pour un défilement infini sans coupure
  const loop = [...countries, ...countries];

  return (
    <div style={{padding: 24, borderRadius: 20, background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)", overflow: "hidden"}}>
      <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 16}}>
        <span style={{fontSize: 11, color: "#818cf8", fontWeight: 800, letterSpacing: "1px", background: "rgba(129, 140, 248, 0.1)", padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(129, 140, 248, 0.3)"}}>
          22 LANGUES · REFORMULATION IA NATIVE
        </span>
      </div>
      <div style={{position: "relative", height: 200, overflow: "hidden", maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)"}}>
        <div className="marquee-scroll" style={{display: "flex", flexDirection: "column", gap: 10}}>
          {loop.map((c, i) => (
            <div key={i} style={{display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)"}}>
              <span style={{fontSize: 20, filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))"}}>{c.flag}</span>
              <div style={{flex: 1}}>
                <div style={{fontSize: 10, color: "#818cf8", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 2}}>{c.lang.toUpperCase()}</div>
                <div style={{fontSize: 13, color: "rgba(255, 255, 255, 0.9)", fontWeight: 500, lineHeight: 1.3}}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .marquee-scroll {
          animation: scroll-up 40s linear infinite;
        }
        @keyframes scroll-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}

function AnimVariantes() {
  const [idx, setIdx] = useState(0);
  const colors = ["#1a1a1a", "#96588a", "#96bf48"];
  const labels = ["Noir / Argent", "Violet / Or", "Vert / Laiton"];
  useEffect(() => { const t = setInterval(() => setIdx(i => (i + 1) % 3), 2000); return () => clearInterval(t); }, []);
  return (
    <div style={{padding: 24, borderRadius: 20, background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)", border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"}}>
      <div style={{position: "relative", width: "100%", height: 140, borderRadius: 16, background: colors[idx], transition: "background 0.6s cubic-bezier(0.4, 0, 0.2, 1)", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 15px 40px ${colors[idx]}60`, overflow: "hidden"}}>
        <div style={{position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2), transparent 60%)"}} />
        <span style={{fontSize: 48, filter: "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5))", transition: "transform 0.6s", transform: `rotate(${idx * 15 - 15}deg)`}}>👜</span>
      </div>
      <div style={{display: "flex", gap: 16, justifyContent: "center", marginBottom: 16}}>
        {colors.map((c, i) => (
          <div key={i} style={{width: 28, height: 28, borderRadius: "50%", background: c, border: i === idx ? "3px solid white" : "3px solid rgba(255, 255, 255, 0.1)", boxShadow: i === idx ? `0 0 20px ${c}, inset 0 0 10px rgba(255, 255, 255, 0.3)` : "none", transform: i === idx ? "scale(1.2)" : "scale(1)", transition: "transform 0.3s ease", cursor: "pointer"}} />
        ))}
      </div>
      <div style={{textAlign: "center", fontSize: 14, color: "white", fontWeight: 600, letterSpacing: "0.5px", textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)"}}>
        {labels[idx]}
      </div>
    </div>
  );
}

function AnimMultiBoutique() {
  return (
    <div style={{position: "relative", width: "100%", height: 220, padding: 20, boxSizing: "border-box", background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)", borderRadius: 20, border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)", overflow: "hidden"}}>
      <svg style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none"}}>
        <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <line x1="50%" y1="50%" x2="20%" y2="80%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

        <circle r="4" fill="#fff" style={{animation: "p1 2s ease-in-out infinite", filter: "drop-shadow(0 0 8px #818cf8)"}} />
        <circle r="4" fill="#fff" style={{animation: "p2 2s ease-in-out infinite 0.5s", filter: "drop-shadow(0 0 8px #818cf8)"}} />
        <circle r="4" fill="#fff" style={{animation: "p3 2s ease-in-out infinite 1s", filter: "drop-shadow(0 0 8px #818cf8)"}} />
        <circle r="4" fill="#fff" style={{animation: "p4 2s ease-in-out infinite 1.5s", filter: "drop-shadow(0 0 8px #818cf8)"}} />

        <defs>
          <style>{`
            @keyframes p1 { 0% { cx: 50%; cy: 50%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { cx: 20%; cy: 20%; opacity: 0; } }
            @keyframes p2 { 0% { cx: 50%; cy: 50%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { cx: 80%; cy: 20%; opacity: 0; } }
            @keyframes p3 { 0% { cx: 50%; cy: 50%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { cx: 20%; cy: 80%; opacity: 0; } }
            @keyframes p4 { 0% { cx: 50%; cy: 50%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { cx: 80%; cy: 80%; opacity: 0; } }
          `}</style>
        </defs>
      </svg>
      <div style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(99, 102, 241, 0.6)", zIndex: 2, animation: "pulse-center 3s ease-in-out infinite"}}>
        <span style={{color: "white", fontSize: 24}}>🏪</span>
      </div>
      {[
        { t: "20%", l: "20%", flag: "🇩" },
        { t: "20%", l: "80%", flag: "🇸" },
        { t: "80%", l: "20%", flag: "🇮🇹" },
        { t: "80%", l: "80%", flag: "🇳🇱" }
      ].map((item, i) => (
        <div key={i} style={{position: "absolute", top: item.t, left: item.l, transform: "translate(-50%, -50%)", width: 44, height: 44, borderRadius: 12, background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)"}}>
          <span style={{fontSize: 22, filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))"}}>{item.flag}</span>
        </div>
      ))}
      <style>{`@keyframes pulse-center { 0%, 100% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.6); } 50% { box-shadow: 0 0 60px rgba(99, 102, 241, 0.9); } }`}</style>
    </div>
  );
}

function Features() {
  return (
    <section id="features" style={{background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%)", padding: "clamp(5rem, 10vw, 9rem) 40px", position: "relative", overflow: "hidden", }}>
      {/* Orbes lumineux */}
      <div style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none"}}>
        <div style={{position: "absolute", top: "20%", left: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)", animation: "float 22s ease-in-out infinite", }} />
        <div style={{position: "absolute", bottom: "15%", right: "8%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(167, 139, 250, 0.06) 0%, transparent 70%)", animation: "float-slow 28s ease-in-out infinite", }} />
      </div>

      <div style={{maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1}}>
        <FadeIn style={{textAlign: "center", marginBottom: 72}}>
          <div style={{display: "inline-block", padding: "6px 16px", borderRadius: 999, background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.15)", fontSize: 12, fontWeight: 700, color: "rgba(255, 255, 255, 0.9)", letterSpacing: "0.8px", marginBottom: 20}}>
            FONCTIONNALITÉS
          </div>
          <h2 style={{fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 900, letterSpacing: "-1.5px", margin: "0 0 16px", background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", }}>
            <TextReveal>Ce que personne d'autre ne fait</TextReveal>
          </h2>
          <p style={{fontSize: 17, color: "rgba(255, 255, 255, 0.6)", maxWidth: "52ch", margin: "0 auto", lineHeight: 1.6}}>
            Le même niveau de détail que les équipes internes des grandes marques — automatisé pour les indépendants.
          </p>
        </FadeIn>

        {FEATURES.map((f, i) => (
          <FadeIn key={i} delay={80} style={{marginBottom: 64}}>
            <div className="feature-row" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", direction: i % 2 === 0 ? "ltr" : "rtl"}}>
              {/* Text */}
              <div style={{direction: "ltr"}}>
                <div style={{display: "inline-block", padding: "5px 14px", borderRadius: 999, background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.15)", fontSize: 11, fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", letterSpacing: "0.8px", marginBottom: 16}}>{f.tag}</div>
                <h3 style={{fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.8px", color: "white", margin: "0 0 16px", lineHeight: 1.2}}>{f.title}</h3>
                <p style={{fontSize: 16, color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.7, maxWidth: "48ch"}}>{f.desc}</p>
              </div>

              {/* Visual */}
              <div style={{direction: "ltr", background: "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)", backdropFilter: "blur(8px)", borderRadius: 24, padding: 28, border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)", }}>
                {i === 0 && <AnimReformulation />}
                {i === 1 && <AnimVariantes />}
                {i === 2 && <AnimMultiBoutique />}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .feature-row { grid-template-columns: 1fr !important; direction: ltr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}


function Testimonials() {
  const testimonials = [
    {
      initials: "ML",
      name: "Marie Laurent",
      role: "Fondatrice",
      company: "Bijoux Élégance",
      color: "#818cf8",
      rating: 5,
      text: "En 3 semaines, j'ai lancé mes boutiques en Allemagne, Espagne et Italie. La reformulation IA est bluffante — mes clients allemands me disent que les descriptions sonnent 100% naturelles. J'ai multiplié mon CA par 4.",
      metric: "+312% de CA international",
    },
    {
      initials: "TD",
      name: "Thomas Dubois",
      role: "E-commerce Manager",
      company: "Montres Prestige",
      color: "#a78bfa",
      rating: 5,
      text: "Le traitement des variantes est incroyable. Chaque couleur de montre a sa propre image et sa description adaptée. Aucun autre outil ne fait ça. On a gagné 80% de temps sur notre expansion européenne.",
      metric: "80% de temps gagné",
    },
    {
      initials: "SC",
      name: "Sophie Chen",
      role: "CEO",
      company: "Mode Responsables",
      color: "#c084fc",
      rating: 5,
      text: "J'ai testé 5 solutions avant ScaleYourShop. Aucune ne gérait aussi bien la localisation native. Mes boutiques au Portugal et aux Pays-Bas ont un taux de conversion équivalent à ma boutique française.",
      metric: "22 pays déployés",
    },
  ];

  return (
    <section style={{background: "linear-gradient(180deg, #0f0f1e 0%, #1a1a2e 50%, #0f0f1e 100%)", padding: "clamp(5rem, 10vw, 9rem) 40px", position: "relative", overflow: "hidden", }}>
      {/* Orbes lumineux */}
      <div style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none"}}>
        <div style={{position: "absolute", top: "30%", right: "5%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)", animation: "float-slow 20s ease-in-out infinite", }} />
        <div style={{position: "absolute", bottom: "15%", left: "8%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(129, 140, 248, 0.08) 0%, transparent 70%)", animation: "float 18s ease-in-out infinite", }} />
      </div>

      <div style={{maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1}}>
        <FadeIn style={{textAlign: "center", marginBottom: 72}}>
          <div style={{display: "inline-block", padding: "6px 16px", borderRadius: 999, background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.15)", fontSize: 12, fontWeight: 700, color: "rgba(255, 255, 255, 0.9)", letterSpacing: "0.8px", marginBottom: 20}}>
            TÉMOIGNAGES
          </div>
          <h2 style={{fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 900, letterSpacing: "-1.5px", margin: "0 0 16px", background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", }}>
            Ils ont scalé avec nous
          </h2>
          <p style={{fontSize: 17, color: "rgba(255, 255, 255, 0.6)", maxWidth: "52ch", margin: "0 auto", lineHeight: 1.6}}>
            Des marchands indépendants aux agences multi-marques, ils ont transformé leur business international.
          </p>
        </FadeIn>

        <div className="testimonials-grid" style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, }}>
          {testimonials.map((t, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div style={{background: "rgba(255, 255, 255, 0.04)", backdropFilter: "blur(8px)", borderRadius: 20, padding: 32, border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", transition: "transform 0.2s ease, box-shadow 0.2s ease", position: "relative", overflow: "hidden", }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.borderColor = `${t.color}60`;
                e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.3), 0 0 40px ${t.color}20, inset 0 1px 0 rgba(255,255,255,0.1)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)";
              }}>
                
                {/* Étoiles */}
                <div style={{marginBottom: 20, display: "flex", gap: 2}}>
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <span key={j} style={{fontSize: 16, color: "#fbbf24"}}>★</span>
                  ))}
                </div>

                {/* Citation */}
                <div style={{fontSize: 32, color: t.color, lineHeight: 1, marginBottom: 8, fontFamily: "Georgia, serif", opacity: 0.6, }}>"</div>
                
                <p style={{fontSize: 15, color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.7, margin: "0 0 24px", flex: 1, }}>
                  {t.text}
                </p>

                {/* Métrique */}
                <div style={{padding: "10px 14px", borderRadius: 10, background: `linear-gradient(135deg, ${t.color}15 0%, ${t.color}08 100%)`, border: `1px solid ${t.color}30`, marginBottom: 24, }}>
                  <div style={{fontSize: 13, fontWeight: 700, color: t.color, letterSpacing: "0.3px", }}>
                    {t.metric}
                  </div>
                </div>

                {/* Auteur */}
                <div style={{display: "flex", alignItems: "center", gap: 12, paddingTop: 20, borderTop: "1px solid rgba(255, 255, 255, 0.08)", }}>
                  <div style={{width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${t.color} 0%, ${t.color}aa 100%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14, letterSpacing: "-0.5px", flexShrink: 0, }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{fontSize: 14, fontWeight: 700, color: "white", marginBottom: 2, }}>
                      {t.name}
                    </div>
                    <div style={{fontSize: 12, color: "rgba(255, 255, 255, 0.5)", }}>
                      {t.role} · {t.company}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Stats globales */}
        <FadeIn delay={400} style={{marginTop: 64}}>
          <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, padding: "28px 32px", borderRadius: 20, background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(8px)", border: "1px solid rgba(255, 255, 255, 0.08)", }}>
            {[
              { val: "4.9/5", label: "Note moyenne" },
              { val: "200+", label: "Marchands actifs" },
              { val: "22", label: "Pays déployés" },
            ].map((stat, i) => (
              <div key={i} style={{textAlign: "center"}}>
                <div style={{fontSize: 32, fontWeight: 900, letterSpacing: "-1px", background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 4, }}>
                  {stat.val}
                </div>
                <div style={{fontSize: 13, color: "rgba(255, 255, 255, 0.5)", fontWeight: 500, }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 860px) {
          .testimonials-grid {
            grid-template-columns: 1fr !important;
          }
        }
      
      
        }

      /* Animation de fond Hero : JS pur */
      .hero-bg-animation {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: 0;
        pointer-events: none;
      }
      .market-card {
        position: absolute;
        top: 50%;
        left: 50%;
        background: rgba(30, 27, 75, 0.85);
        border: 1px solid rgba(167, 139, 250, 0.3);
        border-radius: 10px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
      }
      .market-flag { font-size: 18px; }
      .market-label { 
        color: rgba(255, 255, 255, 0.8); 
        font-size: 11px; 
        font-weight: 600;
        white-space: nowrap;
      }
      @media (max-width: 768px) {
        .market-card { 
          padding: 6px 10px;
          border-radius: 6px;
        }
        .market-flag { font-size: 14px; }
        .market-label { font-size: 9px; }
      }
        .market-flag { font-size: 14px; }
        .market-label { font-size: 9px; }
      }
        .market-flag { font-size: 14px; }
        .market-label { font-size: 9px; }
      }
        .market-flag { font-size: 14px; }
        .market-label { font-size: 9px; }
      }

      `}</style>
    </section>
  );
}



function Pricing() {
  const [annual, setAnnual] = useState(false);

  function ctaLabel(plan: typeof PLANS[0]) {
    if (plan.type === "once") return plan.cta || `Commencer — ${plan.price.once}€`;
    const monthly = plan.price.monthly ?? 0;
    const displayed = annual ? Math.round(monthly * 0.8) : monthly;
    return `Démarrer — ${displayed}€/mois`;
  }

  function ctaHref(plan: typeof PLANS[0]) {
    const planId = plan.id.toUpperCase();
    if (plan.type === "once") return `/signup?plan=${planId}`;
    return `/signup?plan=${planId}&billing=${annual ? "annual" : "monthly"}`;
  }

  return (
    <section id="pricing" style={{ background: "#0f0f1e", padding: "120px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "white", margin: 0 }}>
          Tarifs <span style={{ color: "#818cf8" }}>simples et transparents</span>
        </h2>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", marginTop: 16, marginBottom: 32 }}>
          Du one-shot pour tester à l'illimité pour scaler.
        </p>

        <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: 999, padding: 4, border: "1px solid rgba(255,255,255,0.1)" }}>
          {[
            { label: "Mensuel", val: false },
            { label: "Annuel −20%", val: true }
          ].map(({ label, val }) => (
            <button
              key={label}
              onClick={() => setAnnual(val)}
              className={annual === val ? "btn-primary-gradient" : ""}
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                border: "none",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                background: annual === val ? undefined : "transparent",
                color: annual === val ? "white" : "rgba(255,255,255,0.5)",
                transition: "all 200ms",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {annual && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 10 }}>
            Facturation annuelle (Growth et Business) · Payé d'avance, non remboursable · Renouvellement automatique, annulable avant l'échéance.
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 40, padding: "12px 20px", background: "rgba(129, 140, 248, 0.1)", border: "1px solid rgba(129, 140, 248, 0.3)", borderRadius: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
          Pas encore prêt ? Testez gratuitement avec <strong style={{ color: "#818cf8" }}>5 produits</strong> — sans carte bancaire.
        </span>
        <Link href="/signup" style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", textDecoration: "underline" }}>
          Commencer gratuitement →
        </Link>
      </div>

      <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "stretch" }}>
        {PLANS.map((plan) => (
          <div key={plan.id} className={plan.popular ? "pricing-card pricing-card-popular" : "pricing-card"} style={{ borderRadius: 20, padding: 32, position: "relative", display: "flex", flexDirection: "column" }}>
            {plan.popular && (
              <div style={{
                position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                padding: "6px 18px", borderRadius: 999,
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                color: "white", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
              }}>
                Le plus populaire
              </div>
            )}

            <div style={{ fontWeight: 800, fontSize: 22, color: "white", marginBottom: 8 }}>{plan.name}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24, lineHeight: 1.5 }}>{plan.desc}</div>

            <div style={{ marginBottom: 24 }}>
              {plan.type === "once" ? (
                <div>
                  <span style={{ fontSize: 44, fontWeight: 900, color: "white", letterSpacing: "-2px" }}>{plan.price.once}€</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>paiement unique</span>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: 44, fontWeight: 900, color: "white", letterSpacing: "-2px" }}>
                    {annual ? Math.round((plan.price.monthly as number) * 0.8) : plan.price.monthly}€
                  </span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>/mois</span>
                  {annual && (
                    <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 700, marginTop: 4 }}>
                      Soit {Math.round((plan.price.monthly as number) * 0.8 * 12)}€/an · −20%
                    </div>
                  )}
                </div>
              )}
            </div>

            <a href={ctaHref(plan)} className={plan.popular ? "btn-glow btn-primary-gradient" : "btn-glow btn-glass"} style={{ width: "100%", padding: "13px", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10, textAlign: "center", textDecoration: "none", display: "block", boxSizing: "border-box" }}>
              {ctaLabel(plan)}
            </a>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 24 }}>{plan.note}</div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, display: "grid", gap: 10, flex: 1 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: f.ok ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}>
                  <span style={{ color: f.ok ? "#818cf8" : "rgba(255,255,255,0.2)", flexShrink: 0, fontWeight: 700, fontSize: 16 }}>
                    {f.ok ? "✓" : "✗"}
                  </span>
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pricing-card" style={{ marginTop: 32, padding: "24px 32px", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "white" }}>Enterprise / Sur mesure</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Volume au-delà de 5 000 produits/mois · Intégrations custom · SLA garanti · Facturation annuelle</div>
        </div>
        <a href="mailto:contact@scaleyourshop.app" className="btn-glow btn-outline-glass" style={{ padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          Nous contacter →
        </a>
      </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" style={{background: "linear-gradient(180deg, #0f0f1e 0%, #1a1a2e 100%)", padding: "clamp(5rem, 10vw, 9rem) 40px clamp(2.5rem, 5vw, 4rem)", position: "relative", overflow: "hidden", }}>
      <div style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none"}}>
        <div style={{position: "absolute", top: "10%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)", animation: "float 20s ease-in-out infinite"}} />
        <div style={{position: "absolute", bottom: "10%", right: "5%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(167, 139, 250, 0.06) 0%, transparent 70%)", animation: "float-slow 25s ease-in-out infinite"}} />
      </div>

      <div style={{maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1}}>
        <FadeIn style={{textAlign: "center", marginBottom: 56}}>
          <div style={{display: "inline-block", padding: "6px 16px", borderRadius: 999, background: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.15)", fontSize: 12, fontWeight: 700, color: "rgba(255, 255, 255, 0.9)", letterSpacing: "0.8px", marginBottom: 20}}>FAQ</div>
          <h2 style={{fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 900, letterSpacing: "-1.5px", margin: 0, background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"}}><TextReveal>Questions fréquentes</TextReveal></h2>
        </FadeIn>
        <div style={{display: "grid", gap: 12}}>
          {FAQS.map((faq, i) => (
            <FadeIn key={i} delay={i * 50}>
              <div style={{background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(8px)", borderRadius: 16, border: "1px solid rgba(255, 255, 255, 0.08)", overflow: "hidden", transition: "all 0.2s ease"}}>
                <button onClick={() => setOpen(open === i ? null : i)} style={{width: "100%", padding: "20px 24px", border: "none", background: "none", textAlign: "left", fontWeight: 600, fontSize: 15, color: "white", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12}}>
                  {faq.q}
                  <span style={{fontSize: 20, color: "#818cf8", transform: open === i ? "rotate(45deg)" : "none", transition: "0.3s cubic-bezier(0.4, 0, 0.2, 1)", flexShrink: 0, fontWeight: 300}}>+</span>
                </button>
                {open === i && (
                  <div style={{padding: "0 24px 20px", fontSize: 14, color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.7, borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 16}}>{faq.a}</div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section style={{background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%)", padding: "clamp(3.5rem, 8vw, 6rem) 40px clamp(5rem, 10vw, 8rem)", textAlign: "center", position: "relative", overflow: "hidden", }}>
      {/* Orbes lumineux */}
      <div style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none"}}>
        <div style={{position: "absolute", top: "20%", left: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)", animation: "float 18s ease-in-out infinite"}} />
        <div style={{position: "absolute", bottom: "10%", right: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%)", animation: "float-slow 22s ease-in-out infinite"}} />
      </div>

      <div style={{position: "relative", zIndex: 1}}>
        <FadeIn>
          <h2 style={{fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, letterSpacing: "-1.5px", color: "white", margin: "0 0 20px", background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"}}>
            <TextReveal>Prêt à cloner votre boutique ?</TextReveal>
          </h2>
          <p style={{fontSize: 17, color: "rgba(255, 255, 255, 0.6)", marginBottom: 44, maxWidth: "48ch", margin: "0 auto 44px"}}>
            Connectez vos clés API et lancez votre premier transfert en moins de 5 minutes.
          </p>
          <div style={{display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap"}}>
            <Link href="/signup" className="btn-glow btn-white-glow" style={{padding: "15px 40px", borderRadius: 999, border: "none", color: "#1a1a1a", fontWeight: 800, fontSize: 16, cursor: "pointer", textDecoration: "none", display: "inline-block"}}>
              Commencer gratuitement
            </Link>
            <a href="#features" className="btn-glow btn-outline-glass" style={{padding: "15px 40px", borderRadius: 999, color: "rgba(255, 255, 255, 0.8)", fontWeight: 600, fontSize: 16, cursor: "pointer", textDecoration: "none", display: "inline-block"}}>
              Découvrir les fonctionnalités
            </a>
          </div>
          <p style={{fontSize: 13, color: "rgba(255, 255, 255, 0.4)", marginTop: 24}}>Sans carte bancaire · Aperçu gratuit illimité</p>
        </FadeIn>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{background: "#05050a", padding: "60px 40px 30px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", position: "relative"}}>
      <div style={{maxWidth: 1200, margin: "0 auto"}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 40, marginBottom: 40}}>
          <div style={{maxWidth: 300}}>
            <Link href="/" style={{display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16}}>
              <img src={LOGO_DATA_URI} alt="ScaleYourShop" style={{width: 32, height: 32, borderRadius: 8, objectFit: "cover"}} />
              <span style={{fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px", color: "white"}}>Scale<span style={{color: "#818cf8"}}>Your</span>Shop</span>
            </Link>
            <p style={{fontSize: 13, color: "rgba(255, 255, 255, 0.5)", lineHeight: 1.6, margin: 0}}>
              La solution tout-en-un pour scaler votre e-commerce à l'international. Reformulation IA, images optimisées, multi-boutiques.
            </p>
          </div>
          <div style={{display: "flex", gap: 60, flexWrap: "wrap"}}>
            <div>
              <div style={{fontSize: 12, fontWeight: 700, color: "rgba(255, 255, 255, 0.3)", letterSpacing: "1px", marginBottom: 16}}>PRODUIT</div>
              <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                {[["Fonctionnalités", "#features"], ["Tarifs", "#pricing"], ["FAQ", "#faq"]].map(([label, href]) => (
                  <a key={label} href={href} style={{fontSize: 14, color: "rgba(255, 255, 255, 0.7)", textDecoration: "none", transition: "color 0.2s"}}>{label}</a>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize: 12, fontWeight: 700, color: "rgba(255, 255, 255, 0.3)", letterSpacing: "1px", marginBottom: 16}}>LÉGAL</div>
              <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                {[["Confidentialité", "/confidentialite"], ["CGU", "/cgu"]].map(([label, href]) => (
                  <a key={label} href={href} style={{fontSize: 14, color: "rgba(255, 255, 255, 0.7)", textDecoration: "none", transition: "color 0.2s"}}>{label}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16}}>
          <p style={{fontSize: 12, color: "rgba(255, 255, 255, 0.3)", margin: 0}}>© 2026 ScaleYourShop. Tous droits réservés.</p>
          <div style={{fontSize: 12, color: "rgba(255, 255, 255, 0.3)"}}>Fait avec <span style={{color: "#818cf8"}}>♥</span> en France</div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  // Smooth Scroll (Lenis)
  useEffect(() => {
    const LenisLib = require('lenis').default;
    const lenis = new LenisLib({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{minHeight: "100dvh", background: "#0f0f1e"}}>
      <ResponsiveStyles />
      <Nav scrolled={scrolled} />
      <Hero />
      <Process />
      <Features />
      <Testimonials />
            <Pricing />
      <FAQ />

      <CTA />
      <Footer />
    </div>
  );
}
