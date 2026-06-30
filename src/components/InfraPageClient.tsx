'use client'

import { useEffect, useRef } from 'react'

const CSS = `
.infra-page{ --blue:#4285F4;--red:#EA4335;--yellow:#FBBC05;--green:#34A853;--cyan:#00BCD4;--white:#FFFFFF;--light:#F8F9FA;--dark:#3C4043;--charcoal:#202124;--muted:#80868B;--border:#E8EAED;--shadow:0 2px 12px rgba(0,0,0,0.08);--shadow-hover:0 8px 24px rgba(0,0,0,0.12);--radius:8px;--font:'Roboto',Arial,sans-serif;--mono:'JetBrains Mono',monospace; }
.infra-page{font-family:var(--font);color:var(--dark);background:var(--white);font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;}
.infra-page *{margin:0;padding:0;box-sizing:border-box;}
.infra-page nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:0 1.5rem;height:64px;display:flex;align-items:center;justify-content:space-between;}
.infra-page .nav-inner{max-width:1280px;width:100%;margin:0 auto;display:flex;align-items:center;justify-content:space-between;}
.infra-page .logo{font-size:20px;font-weight:700;color:var(--charcoal);letter-spacing:-0.3px;text-decoration:none;}
.infra-page .logo span{color:var(--blue);}
.infra-page .nav-links{display:flex;align-items:center;gap:2rem;list-style:none;}
.infra-page .nav-links a{text-decoration:none;color:var(--dark);font-size:14px;font-weight:500;transition:color .2s;}
.infra-page .nav-links a:hover{color:var(--blue);}
.infra-page .btn-primary{background:var(--blue);color:var(--white);border:none;padding:10px 24px;border-radius:var(--radius);font-size:14px;font-weight:600;font-family:var(--font);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .2s ease-out;box-shadow:0 2px 4px rgba(66,133,244,0.3);}
.infra-page .btn-primary:hover{background:#3574E2;box-shadow:0 4px 12px rgba(66,133,244,0.4);transform:translateY(-1px);}
.infra-page .btn-outline{background:transparent;color:var(--blue);border:1.5px solid var(--blue);padding:10px 24px;border-radius:var(--radius);font-size:14px;font-weight:600;font-family:var(--font);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .2s ease-out;}
.infra-page .btn-outline:hover{background:rgba(66,133,244,0.06);transform:translateY(-1px);}
.infra-page .container{max-width:1280px;margin:0 auto;padding:0 1.5rem;}
.infra-page section{padding:clamp(4rem,8vw,8rem) 1.5rem;}
.infra-page .hero{padding:clamp(5rem,10vw,9rem) 1.5rem clamp(4rem,8vw,8rem);background:linear-gradient(135deg,#F8F9FF 0%,#FFFFFF 50%,#F0F7FF 100%);overflow:hidden;position:relative;}
.infra-page .hero-inner{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;position:relative;z-index:1;}
.infra-page .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(66,133,244,0.08);border:1px solid rgba(66,133,244,0.2);color:var(--blue);padding:6px 14px;border-radius:20px;font-size:13px;font-weight:500;margin-bottom:1.5rem;}
.infra-page .hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:infraPulse 2s infinite;}
@keyframes infraPulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(1.3);}}
.infra-page .hero h1{font-size:clamp(2.5rem,5vw,3.75rem);font-weight:700;line-height:1.1;letter-spacing:-1px;color:var(--charcoal);margin-bottom:1.5rem;}
.infra-page .hero h1 span{background:linear-gradient(90deg,var(--blue),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.infra-page .hero-sub{font-size:18px;color:var(--muted);line-height:1.7;margin-bottom:2rem;}
.infra-page .hero-actions{display:flex;gap:1rem;flex-wrap:wrap;}
.infra-page .scores-card{background:var(--white);border-radius:16px;box-shadow:var(--shadow-hover);border:1px solid var(--border);padding:2rem;position:relative;}
.infra-page .scores-title{font-size:13px;font-weight:500;color:var(--muted);margin-bottom:1.5rem;font-family:var(--mono);}
.infra-page .score-row{display:flex;align-items:center;gap:1rem;margin-bottom:1rem;}
.infra-page .score-label{font-size:13px;color:var(--dark);width:80px;flex-shrink:0;}
.infra-page .score-bar-wrap{flex:1;height:8px;background:var(--light);border-radius:4px;overflow:hidden;}
.infra-page .score-bar{height:100%;border-radius:4px;}
.infra-page .score-bar.blue{background:var(--blue);width:100%;}
.infra-page .score-bar.green{background:var(--green);width:95%;}
.infra-page .score-num{font-size:14px;font-weight:700;color:var(--charcoal);width:40px;text-align:right;font-family:var(--mono);}
.infra-page .shops-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border);}
.infra-page .shop-flag{background:var(--light);border-radius:6px;padding:8px 4px;text-align:center;font-size:11px;color:var(--muted);font-weight:500;}
.infra-page .section-eyebrow{font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--blue);margin-bottom:.75rem;}
.infra-page .section-title{font-size:clamp(1.75rem,3vw,2.25rem);font-weight:700;color:var(--charcoal);letter-spacing:-0.5px;line-height:1.2;margin-bottom:1rem;}
.infra-page .section-sub{font-size:17px;color:var(--muted);max-width:56ch;line-height:1.7;}
.infra-page .pioneer{background:var(--charcoal);color:var(--white);}
.infra-page .pioneer .section-eyebrow{color:var(--yellow);}
.infra-page .pioneer .section-title{color:var(--white);}
.infra-page .pioneer .section-sub{color:rgba(255,255,255,0.7);}
.infra-page .compare-table{width:100%;border-collapse:collapse;margin-top:3rem;font-size:14px;}
.infra-page .compare-table th{text-align:left;padding:12px 16px;font-weight:600;font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,0.5);border-bottom:1px solid rgba(255,255,255,0.1);}
.infra-page .compare-table td{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);}
.infra-page .compare-table tr:last-child td{color:var(--white);font-weight:600;background:rgba(66,133,244,0.12);}
.infra-page .compare-table tr:last-child td:first-child{border-radius:8px 0 0 8px;}
.infra-page .compare-table tr:last-child td:last-child{border-radius:0 8px 8px 0;}
.infra-page .tick{color:var(--green);font-size:18px;}
.infra-page .cross{color:rgba(255,255,255,0.25);font-size:18px;}
.infra-page .pioneer-quote{margin-top:3rem;padding:2rem;border-left:3px solid var(--yellow);background:rgba(251,188,5,0.06);border-radius:0 8px 8px 0;font-size:18px;font-style:italic;color:rgba(255,255,255,0.9);line-height:1.6;}
.infra-page .features-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:2rem;margin-top:3rem;}
.infra-page .feature-card{background:var(--white);border:1px solid var(--border);border-radius:12px;padding:2rem;box-shadow:var(--shadow);}
.infra-page .feature-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;font-size:22px;}
.infra-page .feature-icon.blue{background:rgba(66,133,244,0.1);}
.infra-page .feature-icon.green{background:rgba(52,168,83,0.1);}
.infra-page .feature-icon.yellow{background:rgba(251,188,5,0.1);}
.infra-page .feature-icon.cyan{background:rgba(0,188,212,0.1);}
.infra-page .feature-title{font-size:17px;font-weight:700;color:var(--charcoal);margin-bottom:.75rem;}
.infra-page .feature-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.infra-page .feature-list li{font-size:14px;color:var(--dark);display:flex;align-items:flex-start;gap:8px;line-height:1.5;}
.infra-page .feature-list li::before{content:'→';color:var(--blue);font-weight:700;flex-shrink:0;margin-top:1px;}
.infra-page .antifp{background:linear-gradient(135deg,#F0F7FF 0%,#F8FFF8 100%);}
.infra-page .antifp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:3rem;}
.infra-page .antifp-item{background:var(--white);border-radius:12px;padding:1.75rem;border:1px solid var(--border);box-shadow:var(--shadow);}
.infra-page .antifp-label{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:.5rem;font-family:var(--mono);}
.infra-page .antifp-title{font-size:16px;font-weight:700;color:var(--charcoal);margin-bottom:.5rem;}
.infra-page .antifp-desc{font-size:13px;color:var(--muted);line-height:1.6;}
.infra-page .vs-grid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:3rem;align-items:start;}
.infra-page .vs-card{border-radius:12px;padding:2rem;border:1px solid var(--border);}
.infra-page .vs-card.shopify{background:var(--light);}
.infra-page .vs-card.sys{background:var(--charcoal);border-color:var(--blue);}
.infra-page .vs-card-title{font-size:15px;font-weight:700;margin-bottom:1.5rem;display:flex;align-items:center;gap:10px;}
.infra-page .vs-card.shopify .vs-card-title{color:var(--muted);}
.infra-page .vs-card.sys .vs-card-title{color:var(--white);}
.infra-page .vs-list{list-style:none;display:flex;flex-direction:column;gap:10px;}
.infra-page .vs-list li{font-size:13px;display:flex;align-items:flex-start;gap:10px;line-height:1.5;}
.infra-page .vs-card.shopify .vs-list li{color:var(--muted);}
.infra-page .vs-card.sys .vs-list li{color:rgba(255,255,255,0.85);}
.infra-page .vs-icon{flex-shrink:0;font-size:14px;margin-top:1px;}
.infra-page .cost-box{margin-top:2rem;background:rgba(234,67,53,0.06);border:1px solid rgba(234,67,53,0.15);border-radius:8px;padding:1.25rem;font-family:var(--mono);font-size:12px;color:var(--dark);line-height:1.8;}
.infra-page .cost-box.sys-cost{background:rgba(52,168,83,0.08);border-color:rgba(52,168,83,0.2);color:rgba(255,255,255,0.85);}
.infra-page .cost-total{font-weight:700;font-size:14px;color:var(--red);margin-top:8px;padding-top:8px;border-top:1px solid rgba(234,67,53,0.2);}
.infra-page .cost-total.good{color:var(--green);border-color:rgba(52,168,83,0.2);}
.infra-page .pricing{background:var(--light);}
.infra-page .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:3rem;}
.infra-page .pricing-card{background:var(--white);border-radius:16px;padding:2rem;border:1px solid var(--border);box-shadow:var(--shadow);display:flex;flex-direction:column;}
.infra-page .pricing-card.featured{border-color:var(--blue);box-shadow:0 0 0 3px rgba(66,133,244,0.1),var(--shadow-hover);transform:translateY(-4px);}
.infra-page .pricing-badge{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--white);background:var(--blue);padding:3px 10px;border-radius:20px;display:inline-block;margin-bottom:1rem;}
.infra-page .pricing-name{font-size:20px;font-weight:700;color:var(--charcoal);margin-bottom:.25rem;}
.infra-page .pricing-langs{font-size:13px;color:var(--muted);margin-bottom:1.5rem;}
.infra-page .pricing-setup{font-size:32px;font-weight:700;color:var(--charcoal);line-height:1;margin-bottom:4px;}
.infra-page .pricing-setup span{font-size:16px;font-weight:400;color:var(--muted);}
.infra-page .pricing-divider{height:1px;background:var(--border);margin:1.5rem 0;}
.infra-page .pricing-features{list-style:none;display:flex;flex-direction:column;gap:10px;flex:1;margin-bottom:1.5rem;}
.infra-page .pricing-features li{font-size:13px;color:var(--dark);display:flex;align-items:center;gap:8px;}
.infra-page .pricing-features li::before{content:'✓';color:var(--green);font-weight:700;flex-shrink:0;}
.infra-page .cta{background:linear-gradient(135deg,var(--blue) 0%,#1A73E8 100%);color:var(--white);text-align:center;}
.infra-page .cta .section-title{color:var(--white);}
.infra-page .cta-sub{font-size:17px;color:rgba(255,255,255,0.85);max-width:48ch;margin:0 auto 2.5rem;line-height:1.7;}
.infra-page .btn-white{background:var(--white);color:var(--blue);border:none;padding:14px 32px;border-radius:var(--radius);font-size:15px;font-weight:700;font-family:var(--font);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,0.2);}
.infra-page footer{background:var(--light);border-top:1px solid var(--border);padding:3rem 1.5rem;}
.infra-page .footer-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;}
.infra-page .footer-copy{font-size:13px;color:var(--muted);}
.infra-page .footer-tech{font-family:var(--mono);font-size:11px;color:var(--muted);display:flex;gap:1rem;flex-wrap:wrap;}
.infra-page .tech-tag{background:var(--white);border:1px solid var(--border);padding:3px 8px;border-radius:4px;display:inline-flex;align-items:center;gap:5px;}
.infra-page .push-box{position:relative;}
.infra-page .push-product{display:flex;align-items:center;gap:10px;background:rgba(66,133,244,0.15);border:1px solid rgba(66,133,244,0.4);border-radius:8px;padding:12px 16px;margin-bottom:1.5rem;}
.infra-page .push-product-dot{width:10px;height:10px;border-radius:50%;background:#4285F4;animation:infraPushPulse 1.5s ease-in-out infinite;}
@keyframes infraPushPulse{0%,100%{box-shadow:0 0 0 0 rgba(66,133,244,0.5);}50%{box-shadow:0 0 0 8px rgba(66,133,244,0);}}
.infra-page .push-line{width:2px;background:linear-gradient(to bottom,#4285F4,#34A853);margin:0 auto 1rem;height:0;transition:height .8s ease;}
.infra-page .push-line.active{height:40px;}
.infra-page .push-flag-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.infra-page .push-flag-item{background:rgba(255,255,255,0.06);border-radius:8px;padding:10px 6px;text-align:center;border:1px solid rgba(255,255,255,0.08);opacity:0;transform:scale(.6) translateY(10px);transition:opacity .3s ease,transform .3s ease;}
.infra-page .push-flag-item.pop{opacity:1;transform:scale(1) translateY(0);}
.infra-page .push-flag-item .flag-emoji{font-size:18px;}
.infra-page .push-flag-item .flag-name{font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;}
.infra-page .push-success{margin-top:1rem;background:rgba(52,168,83,0.1);border:1px solid rgba(52,168,83,0.25);border-radius:8px;padding:12px 16px;color:#34A853;font-weight:700;font-size:13px;opacity:0;transition:opacity .5s ease;text-align:center;}
.infra-page .push-success.visible{opacity:1;}
.infra-page .push-trigger-btn{width:100%;background:#4285F4;color:#fff;border:none;border-radius:8px;padding:12px;font-family:var(--mono);font-size:13px;font-weight:700;cursor:pointer;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:center;gap:8px;}
.infra-page .push-trigger-btn:disabled{background:#34A853;cursor:default;}
.infra-page .launch-offer{background:var(--white);border-radius:16px;padding:2.5rem;margin-bottom:4rem;border:2px solid var(--red);position:relative;overflow:hidden;box-shadow:0 0 0 4px rgba(234,67,53,0.1);}
.infra-page .launch-offer::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--red),var(--yellow));}
.infra-page .launch-badge{display:inline-block;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:20px;margin-bottom:1.5rem;}
.infra-page .launch-inner{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:start;}
.infra-page .launch-title{font-size:24px;font-weight:700;margin-bottom:.5rem;}
.infra-page .launch-sub{font-size:13px;line-height:1.6;margin-bottom:1.5rem;}
.infra-page .launch-price{display:flex;align-items:baseline;gap:12px;margin-bottom:1.5rem;}
.infra-page .launch-old{font-size:18px;text-decoration:line-through;font-family:var(--mono);}
.infra-page .launch-new{font-size:42px;font-weight:700;font-family:var(--mono);line-height:1;}
.infra-page .launch-label{font-size:13px;}
.infra-page .launch-degressive{display:flex;flex-direction:column;gap:8px;}
.infra-page .launch-row{display:flex;align-items:center;gap:12px;font-size:12px;font-family:var(--mono);color:var(--muted);padding:6px 0;border-bottom:1px solid var(--border);}
.infra-page .ld-price{font-weight:700;color:var(--dark);width:50px;}
.infra-page .ld-price.green{color:var(--green);}
.infra-page .ld-note{font-size:10px;color:var(--muted);margin-left:auto;}
.infra-page .tech-logos{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:2.5rem;}
.infra-page .tech-logo-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:var(--white);border:1px solid var(--border);border-radius:12px;padding:1.5rem 1rem;box-shadow:var(--shadow);font-size:13px;font-weight:600;color:var(--dark);text-align:center;}
@media (min-width:960px){ .infra-page .tech-logos{grid-template-columns:repeat(6,1fr);} }
@media (max-width:768px){
  .infra-page section{padding:3rem 1rem;}
  .infra-page .container{padding:0 1rem;}
  .infra-page .hero{padding:3rem 1rem;}
  .infra-page .hero-inner{grid-template-columns:1fr;}
  .infra-page .hero h1{font-size:2rem;}
  .infra-page .features-grid{grid-template-columns:1fr;}
  .infra-page .antifp-grid{grid-template-columns:1fr;}
  .infra-page .pricing-grid{grid-template-columns:1fr;}
  .infra-page .pricing-card.featured{transform:none;}
  .infra-page .vs-grid{grid-template-columns:1fr;}
  .infra-page .nav-links{display:none;}
  .infra-page .footer-inner{flex-direction:column;gap:1rem;text-align:center;}
  .infra-page .compare-table{font-size:12px;}
  .infra-page .compare-table th,.infra-page .compare-table td{padding:8px;}
  .infra-page .why-grid{grid-template-columns:1fr !important;}
  .infra-page .launch-inner{grid-template-columns:1fr !important;}
  .infra-page .push-grid{grid-template-columns:1fr !important;}
}
`

const FLAGS = [
  ['🇫🇷','shop-fr'],['🇩🇪','shop-de'],['🇪🇸','shop-es'],['🇮🇹','shop-it'],
  ['🇳🇱','shop-nl'],['🇵🇹','shop-pt'],['🇵🇱','shop-pl'],['🇧🇬','shop-bg'],
  ['🇷🇴','shop-ro'],['🇨🇿','shop-cs'],['🇸🇪','shop-sv'],['🇩🇰','shop-da'],
  ['🇫🇮','shop-fi'],['🇬🇷','shop-el'],['🇭🇺','shop-hu'],['🇸🇰','shop-sk'],
  ['🇭🇷','shop-hr'],['🇱🇹','shop-lt'],['🇱🇻','shop-lv'],['🇸🇮','shop-sl'],
  ['🇪🇪','shop-et'],['🇲🇹','shop-mt'],
]

export default function InfraPageClient() {
  const lineRef = useRef<HTMLDivElement>(null)
  const flagRefs = useRef<HTMLDivElement[]>([])
  const successRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.infra-page .fade-up'))
    els.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; el.style.transition = 'opacity .6s ease-out, transform .6s ease-out' })
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)' }, i * 80)
          observer.unobserve(el)
        }
      })
    }, { threshold: 0.1 })
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const runPushAnimation = () => {
    const btn = btnRef.current
    const line = lineRef.current
    const flags = flagRefs.current
    const success = successRef.current
    if (!btn) return

    btn.disabled = true
    btn.textContent = 'Push en cours...'

    setTimeout(() => { line?.classList.add('active') }, 100)
    flags.forEach((flag, i) => {
      setTimeout(() => flag?.classList.add('pop'), 500 + i * 120)
    })
    setTimeout(() => {
      success?.classList.add('visible')
      if (btn) btn.textContent = `✓ ${FLAGS.length} produits importés`
    }, 500 + flags.length * 120 + 300)

    setTimeout(() => {
      btn.disabled = false
      btn.innerHTML = 'push-clone.mjs --all'
      line?.classList.remove('active')
      flags.forEach(f => f?.classList.remove('pop'))
      success?.classList.remove('visible')
    }, 5500)
  }

  return (
    <div className="infra-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <nav>
        <div className="nav-inner">
          <a href="#" className="logo">Scale<span>Your</span>Shop <span style={{ fontSize: 12, color: '#80868B', fontWeight: 400 }}>Infra</span></a>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#antifp">Anti-footprints</a></li>
            <li><a href="#shopify">vs Shopify</a></li>
            <li><a href="#pricing">Tarifs</a></li>
          </ul>
          <a href="#pricing" className="btn-primary">Démarrer →</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <div className="hero-badge-dot" />
              Architecture pionnière - En production sur 23 boutiques
            </div>
            <h1>Scalez avec le CMS e-commerce<br /><span>le plus rapide d'Europe.</span></h1>
            <p className="hero-sub">
              La première infrastructure e-commerce qui déploie 23 boutiques indépendantes en Europe - chacune avec sa propre DB, son domaine, son SSL. Pas du multilingue. Un réseau.
            </p>
            <div className="hero-actions">
              <a href="#pricing" className="btn-primary">Voir les forfaits →</a>
              <a href="#features" className="btn-outline">Découvrir les features</a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="scores-card">
              <div className="scores-title">$ google-pagespeed --url votreboutique.com</div>
              <div className="score-row"><span className="score-label">Performance</span><div className="score-bar-wrap"><div className="score-bar blue" /></div><span className="score-num">100</span></div>
              <div className="score-row"><span className="score-label">Mobile</span><div className="score-bar-wrap"><div className="score-bar green" /></div><span className="score-num">95</span></div>
              <div className="score-row"><span className="score-label">SEO</span><div className="score-bar-wrap"><div className="score-bar blue" /></div><span className="score-num">100</span></div>
              <div className="score-row"><span className="score-label">Accessib.</span><div className="score-bar-wrap"><div className="score-bar green" style={{ width: '98%' }} /></div><span className="score-num">98</span></div>
              <div className="shops-grid">
                <div className="shop-flag">🇫🇷 FR</div><div className="shop-flag">🇩🇪 DE</div><div className="shop-flag">🇪🇸 ES</div><div className="shop-flag">🇮🇹 IT</div>
                <div className="shop-flag">🇳🇱 NL</div><div className="shop-flag">🇵🇹 PT</div><div className="shop-flag">🇵🇱 PL</div><div className="shop-flag">+15</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--white)', padding: 'clamp(3rem,6vw,6rem) 1.5rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }} className="push-grid">
            <div className="fade-up">
              <div className="section-eyebrow">La vraie différence</div>
              <h2 className="section-title">1 produit créé<br /><span style={{ color: 'var(--blue)' }}>= 22 marchés couverts</span></h2>
              <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.7, margin: '1.5rem 0' }}>
                Créez votre produit une seule fois sur votre back-office maître. En un clic, il est poussé vers les 22 boutiques européennes - traduit, reformulé, images retraitées, catégories mappées. Tout automatiquement.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  ['#4285F4', 'Titre traduit et reformulé en langue locale'],
                  ['#34A853', 'Images retraitées - signature digitale unique'],
                  ['#FBBC05', 'Catégories mappées automatiquement'],
                  ['#EA4335', 'Galerie variantes reconstituée'],
                  ['#00BCD4', 'Push vers tous les clones ou pays au choix'],
                ].map(([color, text]) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--dark)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fade-up">
              <div style={{ background: 'var(--charcoal)', borderRadius: 16, padding: '2rem', fontFamily: 'var(--mono)', fontSize: 13 }} className="push-box">
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: '1.5rem', letterSpacing: 1 }}>PUSH TO CLONES — LIVE DEMO</div>
                <div className="push-product">
                  <div className="push-product-dot" />
                  <div>
                    <div style={{ color: 'var(--white)', fontWeight: 700 }}>Produit créé sur my-shop</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>1 seul back-office</div>
                  </div>
                </div>
                <button ref={btnRef} className="push-trigger-btn" onClick={runPushAnimation}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="5 12 19 12" /><polyline points="12 5 19 12 12 19" /></svg>
                  push-clone.mjs --all
                </button>
                <div ref={lineRef} className="push-line" />
                <div className="push-flag-grid">
                  {FLAGS.map(([emoji, name], i) => (
                    <div key={name} ref={el => { if (el) flagRefs.current[i] = el }} className="push-flag-item">
                      <div className="flag-emoji">{emoji}</div>
                      <div className="flag-name">{name}</div>
                    </div>
                  ))}
                </div>
                <div ref={successRef} className="push-success">22 produits importés en quelques secondes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pioneer">
        <div className="container">
          <div className="section-eyebrow fade-up">Stack pionnière</div>
          <h2 className="section-title fade-up">3 ans d'avance sur le marché</h2>
          <p className="section-sub fade-up" style={{ color: 'rgba(255,255,255,0.6)' }}>
            ScaleYourShop n'existe nulle part ailleurs. Ce n'est pas une combinaison d'apps. C'est une architecture inventée et éprouvée en production.
          </p>
          <table className="compare-table fade-up">
            <thead>
              <tr><th>Solution</th><th>Technologie</th><th>Multiclone</th><th>Anti-footprints</th><th>Push auto</th></tr>
            </thead>
            <tbody>
              {[
                ['Shopify', 'Fermé, propriétaire'],
                ['WooCommerce', 'WordPress vieillissant'],
                ['Medusa.js', 'Headless moderne'],
                ['Vendure', 'Headless moderne'],
              ].map(([name, tech]) => (
                <tr key={name}>
                  <td>{name}</td><td>{tech}</td>
                  <td><span className="cross">✕</span></td><td><span className="cross">✕</span></td><td><span className="cross">✕</span></td>
                </tr>
              ))}
              <tr>
                <td>ScaleYourShop</td><td>Next.js + PayloadCMS</td>
                <td><span className="tick">✓</span></td><td><span className="tick">✓</span></td><td><span className="tick">✓</span></td>
              </tr>
            </tbody>
          </table>
          <div className="pioneer-quote fade-up">Ce que les agences proposeront en 2029, vos concurrents peuvent l'avoir aujourd'hui.</div>
        </div>
      </section>

      <section id="features">
        <div className="container">
          <div className="section-eyebrow fade-up">Technologie américaine</div>
          <h2 className="section-title fade-up">La stack des licornes. Pour vous.</h2>
          <p className="section-sub fade-up">
            Next.js de Vercel, PayloadCMS nouvelle génération, PostgreSQL d'Instagram et Uber. Pendant que vos concurrents tournent sur WordPress avec 40 plugins, vous êtes sur la même technologie que les startups qui lèvent des millions.
          </p>
          <div className="tech-logos fade-up">
            {['Next.js 15', 'PayloadCMS 3', 'PostgreSQL 16', 'Stripe', 'Cloudflare'].map(t => (
              <div key={t} className="tech-logo-item"><span>{t}</span></div>
            ))}
            <a href="https://www.npmjs.com/package/payload-plugin-reviews" target="_blank" rel="noopener" className="tech-logo-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span>plugin-reviews <span style={{ fontSize: 11, color: '#4285F4', fontWeight: 400 }}>open source</span></span>
            </a>
          </div>

          <div className="features-grid">
            <div className="feature-card fade-up">
              <div className="feature-icon blue">⚡</div>
              <div className="feature-title">Performance</div>
              <ul className="feature-list">
                <li>Next.js - rendu statique ultra rapide</li>
                <li>VPS dédié - pas d'hébergement mutualisé (72€/an inclus)</li>
                <li>Core Web Vitals 100/100 PC · 95/100 mobile</li>
                <li>PostgreSQL - base de données optimisée e-commerce</li>
                <li>Stripe natif - 0% surcharge, 0 configuration</li>
              </ul>
            </div>
            <div className="feature-card fade-up">
              <div className="feature-icon green">🌍</div>
              <div className="feature-title">23 boutiques indépendantes</div>
              <ul className="feature-list">
                <li>Chacune avec sa propre base de données</li>
                <li>23 domaines distincts - fr., de., es., it....</li>
                <li>23 back-offices séparés par pays</li>
                <li>Traduction et reformulation native par locale</li>
                <li>SEO localisé - structure URL et balises distinctes</li>
                <li>JSON-LD unique par boutique - Rich snippets natifs</li>
                <li>Métas et og:image localisés en langue régionale</li>
                <li>Un seul back-office maître pour créer les produits</li>
              </ul>
            </div>
            <div className="feature-card fade-up">
              <div className="feature-icon yellow">🔁</div>
              <div className="feature-title">Automatisation</div>
              <ul className="feature-list">
                <li>Push produit flexible - tous les shops ou pays au choix</li>
                <li>Stratégie par phases - testez un marché avant de l'ouvrir</li>
                <li>Produits exclusifs par pays</li>
                <li>Mapping catégories automatique - 19 × 22 langues</li>
                <li>Galerie variantes reconstituée automatiquement</li>
              </ul>
            </div>
            <div className="feature-card fade-up">
              <div className="feature-icon cyan">🖥️</div>
              <div className="feature-title">Infrastructure dédiée</div>
              <ul className="feature-list">
                <li>VPS dédié - vos 23 shops rien que pour vous</li>
                <li>SSL indépendant par domaine</li>
                <li>PostgreSQL - une base de données par boutique</li>
                <li>Stripe natif intégré</li>
                <li>Dashboard de monitoring inclus</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="antifp" className="antifp">
        <div className="container">
          <div className="section-eyebrow fade-up">Invisibilité totale</div>
          <h2 className="section-title fade-up">Anti-footprints total</h2>
          <p className="section-sub fade-up">
            Google ne peut pas détecter que vos 23 boutiques partagent la même origine. Chaque signal d'identité est unique - du code au réseau.
          </p>

          <div className="antifp-grid">
            {[
              ['Images', 'Traitement total Sharp - 5 couches', "Traitement total via Sharp : conversion WebP, compression unique, injection de bruit imperceptible, ajustement colorimétrique et suppression/réécriture des métadonnées EXIF. Visuellement identique pour l'humain - signature digitale totalement différente pour les moteurs."],
              ['Contenu', 'Titres et descriptions reformulés', 'Titres reformulés dans la langue locale. Descriptions uniques par clone. Jamais de duplicate content.'],
              ['Code', 'CSS unique par boutique', 'Classes et structure CSS différentes par clone. Google ne peut pas croiser les signatures de code.'],
              ['Réseau', 'Cloudflare par boutique', 'IP distincte et certificat SSL indépendant par domaine. Chaque boutique est une entité réseau séparée.'],
              ['Sémantique', 'Structure URL distincte', 'Architecture URL, balises hreflang et structure de données structurées propres à chaque boutique.'],
              ['Base de données', '23 DB indépendantes', 'Une base PostgreSQL dédiée par boutique. Aucun schéma partagé. Isolation totale des données.'],
              ['JSON-LD', 'Données structurées uniques', 'Chaque boutique génère son propre JSON-LD en langue régionale - Product, BreadcrumbList, Organization. Rich snippets natifs par pays.'],
              ['Métas', 'Open Graph et métas images localisés', "Title, description, og:image, og:locale distincts par boutique. Partages sociaux adaptés à chaque marché en langue régionale."],
              ['Rich Snippets', 'Éligibilité maximale Google', "Prix, disponibilité, avis, fil d'Ariane - tous en langue locale. Google affiche vos produits avec rich snippets dans chaque pays."],
            ].map(([label, title, desc]) => (
              <div key={title} className="antifp-item fade-up">
                <div className="antifp-label">{label}</div>
                <div className="antifp-title">{title}</div>
                <div className="antifp-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="shopify">
        <div className="container">
          <div className="section-eyebrow fade-up">Comparaison</div>
          <h2 className="section-title fade-up">Pourquoi pas Shopify ?</h2>
          <p className="section-sub fade-up">
            Shopify est excellent pour démarrer. Mais quand vous voulez scaler en Europe, ses limites deviennent vos pertes.
          </p>
          <div className="vs-grid">
            <div className="vs-card shopify fade-up">
              <div className="vs-card-title">Shopify Advanced + apps</div>
              <ul className="vs-list">
                {[
                  '2€/mois par langue avec app tierce', 'Une boutique traduite = duplicate content',
                  '2-3s de chargement avec les apps', '2% de frais sur chaque vente',
                  'Hébergement mutualisé avec 4M de boutiques', 'Images identiques - même signature digitale détectable par Google',
                  'Une seule DB pour toutes les langues', 'App Stripe payante en supplément',
                  'JSON-LD générique, pas de rich snippets locaux', 'Métas identiques sur tous les marchés',
                  'Aucun système de push produit vers plusieurs boutiques', "Pas d'isolation entre marchés - une panne affecte tout",
                  'Architecture fermée - impossible de personnaliser le code', 'Toutes vos données chez Shopify - vous ne possédez rien',
                  "Pas de DB dédiée - vos données mélangées avec des millions d'autres", 'Mise à jour Shopify imposée - aucun contrôle sur les changements',
                ].map(t => <li key={t}><span className="vs-icon">✕</span>{t}</li>)}
              </ul>
            </div>
            <div className="vs-card sys fade-up">
              <div className="vs-card-title">ScaleYourShop STARTER</div>
              <ul className="vs-list">
                {[
                  '22 langues natives incluses', '23 boutiques indépendantes = 23 entités SEO',
                  '100/100 PageSpeed - rendu instantané', '0% de commission',
                  'VPS dédié rien que pour vous', 'Images retraitées, fingerprint unique',
                  '23 bases de données indépendantes', 'Stripe natif, 0 configuration',
                  'JSON-LD unique + Rich snippets en langue locale', 'Métas og:image localisées par pays',
                ].map(t => <li key={t}><span className="vs-icon" style={{ color: 'var(--green)' }}>✓</span>{t}</li>)}
              </ul>
              <div className="cost-box sys-cost">
                400€/mois tout compris<br />0% commission<br />100/100 PageSpeed<br />Contenu unique garanti
                <div className="cost-total good">= Même prix. Infrastructure sans équivalent.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-eyebrow fade-up">Transparence</div>
          <h2 className="section-title fade-up">Pourquoi ce prix ?</h2>
          <p className="section-sub fade-up">
            Ce n'est pas un template. C'est une infrastructure sur mesure, unique au monde, que je déploie et maintiens pour vous.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem' }} className="why-grid">
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                ['var(--blue)', '1 semaine de travail', 'Setup sur mesure', 'Configuration VPS, déploiement des 23 boutiques, domaines, SSL, Cloudflare, Stripe, PostgreSQL. Chaque installation est unique et adaptée à votre marque.'],
                ['var(--green)', 'Architecture unique', 'Propriété intellectuelle exclusive', "Ce système de multiclone anti-footprints n'existe nulle part ailleurs. Vous ne payez pas un produit générique - vous accédez à une technologie pionnière développée sur plusieurs années."],
                ['var(--yellow)', 'ROI immédiat', 'Rentabilisé dès le 1er mois', 'Une agence SEO multilingue vous facture 3 000€/mois minimum. Avec ScaleYourShop vous économisez 2 400€ chaque mois - votre setup est remboursé en 2 mois.'],
              ].map(([color, eyebrow, title, desc]) => (
                <div key={title} style={{ borderLeft: `3px solid ${color}`, padding: '1.25rem 1.5rem', background: 'var(--light)', borderRadius: '0 8px 8px 0' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color, marginBottom: 8 }}>{eyebrow}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
            <div className="fade-up">
              <div style={{ background: 'var(--charcoal)', borderRadius: 16, padding: '2rem', color: 'var(--white)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>Calcul de valeur</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {[
                    ['Agence SEO multilingue / an', '36 000€', '#EA4335'],
                    ['Développeur freelance dédié / an', '60 000€', '#EA4335'],
                    ['23 × Shopify + apps / an', '114 264€ (impossible)', '#EA4335'],
                    ['ScaleYourShop Starter / an', '8 050€', '#34A853'],
                    ['Mensuel moyen année 1', '254€/mois', '#34A853'],
                  ].map(([label, val, color], i) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: i < 4 ? '0.75rem' : 0, borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color }}>{val}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(52,168,83,0.12)', border: '1px solid rgba(52,168,83,0.2)', borderRadius: 8, padding: '1.25rem' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Économie annuelle vs agence SEO</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#34A853', fontFamily: 'var(--mono)' }}>27 950€</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>sur la formule Starter - sans compter les commissions Shopify évitées</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing">
        <div className="container">
          <div className="launch-offer fade-up">
            <div className="launch-badge" style={{ background: 'rgba(234,67,53,0.08)', border: '1px solid rgba(234,67,53,0.25)', color: 'var(--red)' }}>Offre lancement — 3 premiers clients uniquement</div>
            <div className="launch-inner">
              <div className="launch-left">
                <div className="launch-title" style={{ color: 'var(--charcoal)' }}>Early Adopter</div>
                <div className="launch-sub" style={{ color: 'var(--muted)' }}>Starter 5 boutiques — Prix réservé aux 3 premiers clients en échange d'un témoignage</div>
                <div className="launch-price">
                  <span className="launch-old" style={{ color: 'var(--muted)' }}>5 000€</span>
                  <span className="launch-new" style={{ color: 'var(--red)' }}>1 990€</span>
                  <span className="launch-label" style={{ color: 'var(--muted)' }}>setup</span>
                </div>
                <div className="launch-degressive">
                  <div className="launch-row"><span>Mois 1</span><span className="ld-price">600€</span><span className="ld-note">installation + formation + support intensif</span></div>
                  <div className="launch-row"><span>Mois 2-3</span><span className="ld-price">400€</span><span className="ld-note">stabilisation</span></div>
                  <div className="launch-row"><span>Mois 4-6</span><span className="ld-price">250€</span><span className="ld-note">maintenance légère</span></div>
                  <div className="launch-row"><span>Mois 7+</span><span className="ld-price green">150€</span><span className="ld-note">monitoring + urgences</span></div>
                </div>
              </div>
              <div className="launch-right">
                <ul className="pricing-features" style={{ marginBottom: '1.5rem' }}>
                  <li>5 boutiques indépendantes</li><li>5 domaines + SSL dédiés</li><li>Anti-footprints complet</li>
                  <li>Push produit flexible</li><li>Stripe natif</li><li>VPS dédié inclus</li>
                  <li>Dashboard monitoring</li><li>Témoignage demandé</li>
                </ul>
                <a href="#contact" className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--red)', boxShadow: '0 2px 4px rgba(234,67,53,0.3)' }}>Réserver ma place →</a>
                <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 8, fontFamily: 'var(--mono)' }}>2 places restantes</p>
              </div>
            </div>
          </div>

          <div className="section-eyebrow fade-up" style={{ textAlign: 'center', marginTop: '3rem' }}>Tarifs standards</div>
          <h2 className="section-title fade-up" style={{ textAlign: 'center' }}>Choisissez votre échelle</h2>
          <p className="section-sub fade-up" style={{ textAlign: 'center', margin: '0 auto' }}>
            Setup unique + suivi mensuel. Vous gardez le contrôle, nous gérons la technique.
          </p>

          <div className="pricing-grid">
            {[
              { name: 'Starter', langs: '5 langues européennes au choix', setup: '5 000€', rows: [['Mois 1', '600€'], ['Mois 2-3', '400€'], ['Mois 4-6', '250€'], ['Mois 7+', '150€', true]], features: ['5 boutiques indépendantes', '5 domaines + SSL dédiés', 'Anti-footprints complet', 'Push produit flexible', 'Stripe natif', 'VPS dédié inclus', 'Support 48h'], featured: false },
              { name: 'Business', langs: '12 langues européennes au choix', setup: '8 000€', rows: [['Mois 1', '900€'], ['Mois 2-3', '600€'], ['Mois 4-6', '350€'], ['Mois 7+', '200€', true]], features: ['12 boutiques indépendantes', '12 domaines + SSL dédiés', 'Anti-footprints complet', 'Push produit flexible', 'Stripe natif', 'VPS dédié inclus', 'Dashboard monitoring', 'Support 24h'], featured: true },
              { name: 'Enterprise', langs: '22 langues UE complètes', setup: '15 000€', rows: [['Mois 1', '1 800€'], ['Mois 2-3', '1 200€'], ['Mois 4-6', '700€'], ['Mois 7+', '350€', true]], features: ['22 boutiques indépendantes', '22 domaines + SSL dédiés', 'Anti-footprints complet', 'Push produit flexible', 'Stripe natif', 'VPS dédié inclus', 'Dashboard monitoring', 'Backlinks en option', 'Support prioritaire'], featured: false },
            ].map(plan => (
              <div key={plan.name} className={`pricing-card fade-up${plan.featured ? ' featured' : ''}`}>
                {plan.featured && <div className="pricing-badge">Populaire</div>}
                <div className="pricing-name">{plan.name}</div>
                <div className="pricing-langs">{plan.langs}</div>
                <div className="pricing-setup">{plan.setup} <span>setup</span></div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>Suivi dégressif</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {plan.rows.map(([label, price, good], idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--muted)' }}>{label}</span>
                        <span style={{ fontWeight: 700, color: good ? 'var(--green)' : 'var(--dark)' }}>{price}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pricing-divider" />
                <ul className="pricing-features">{plan.features.map(f => <li key={f}>{f}</li>)}</ul>
                <a href="#contact" className={plan.featured ? 'btn-primary' : 'btn-outline'} style={{ width: '100%', justifyContent: 'center' }}>Démarrer →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="cta" style={{ textAlign: 'center' }}>
        <div className="container">
          <h2 className="section-title fade-up">Travaillons ensemble</h2>
          <p className="cta-sub fade-up">
            Je suis Camille, freelance spécialisée en infrastructure e-commerce européenne. Contactez-moi sur Instagram pour discuter de votre projet - réponse rapide garantie.
          </p>
          <div className="fade-up" style={{ margin: '2rem auto', maxWidth: 680 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.5)', marginBottom: '1rem', textAlign: 'center' }}>Camille · Contributrice open source · 2 plugins publiés sur npm</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { name: 'payload-plugin-reviews', desc: "Premier plugin d'avis clients pour Payload CMS v3 — modération, étoiles, rich snippets", npm: 'https://www.npmjs.com/package/payload-plugin-reviews', gh: 'https://github.com/spiritracking-arch/payload-plugin-reviews' },
                { name: 'payload-plugin-seo-jsonld', desc: 'Schema.org JSON-LD complet pour Payload CMS v3 — Product, Breadcrumb, ItemList, Organization', npm: 'https://www.npmjs.com/package/payload-plugin-seo-jsonld', gh: 'https://github.com/spiritracking-arch/payload-plugin-seo-jsonld' },
              ].map(p => (
                <div key={p.name} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '1.25rem', textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{p.name} <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: 20, fontWeight: 400 }}>v1.0.0</span></div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12, lineHeight: 1.5 }}>{p.desc}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a href={p.npm} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#CB3837', color: '#fff', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>npm</a>
                    <a href={p.gh} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>GitHub</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <a href="https://www.instagram.com/loch.ness.paris/" target="_blank" rel="noopener" className="btn-white fade-up">
            Me contacter sur Instagram
          </a>
          <p style={{ marginTop: '1.5rem', fontSize: 13, color: 'rgba(255,255,255,0.6)' }} className="fade-up">Réponse sous 24h · Sans engagement · @loch.ness.paris</p>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-copy">© 2026 ScaleYourShop - L'infrastructure e-commerce la plus avancée d'Europe.</div>
          <div className="footer-tech">
            <span className="tech-tag">Next.js</span>
            <span className="tech-tag">PayloadCMS</span>
            <span className="tech-tag">PostgreSQL</span>
            <span className="tech-tag">Stripe</span>
            <a href="https://www.npmjs.com/package/payload-plugin-reviews" target="_blank" rel="noopener" className="tech-tag" style={{ textDecoration: 'none', color: 'inherit' }}>plugin-reviews <span style={{ color: '#4285F4', fontSize: 10, marginLeft: 2 }}>↗ npm</span></a>
            <a href="https://www.npmjs.com/package/payload-plugin-seo-jsonld" target="_blank" rel="noopener" className="tech-tag" style={{ textDecoration: 'none', color: 'inherit' }}>plugin-seo-jsonld <span style={{ color: '#4285F4', fontSize: 10, marginLeft: 2 }}>↗ npm</span></a>
          </div>
        </div>
      </footer>
    </div>
  )
}
