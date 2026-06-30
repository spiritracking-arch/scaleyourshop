import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'ScaleYourShop <onboarding@resend.dev>'

function shell(innerHtml: string) {
  return `
<div style="background:#f5f5f5;padding:24px 12px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border-collapse:collapse;">
    <tr>
      <td style="background:#1a1a1a;padding:24px 32px;">
        <span style="font-weight:800;font-size:16px;color:#ffffff;letter-spacing:-0.3px;">🌍 ScaleYourShop</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 32px 24px;">
        ${innerHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px;border-top:1px solid #f0f0f0;background:#fafafa;text-align:center;">
        <p style="font-size:11px;color:#bbb;margin:0;line-height:1.6;">
          ScaleYourShop<br/>
          <a href="#" style="color:#bbb;">Gérer les préférences</a>
        </p>
      </td>
    </tr>
  </table>
</div>`.trim()
}

function statBox(value: string, label: string) {
  return `<td width="33%" style="padding:14px;border-radius:10px;background:#f9f9f9;border:1px solid #e5e5e5;text-align:center;">
    <div style="font-size:22px;font-weight:900;color:#1a1a1a;letter-spacing:-1px;">${value}</div>
    <div style="font-size:11px;color:#999;margin-top:4px;">${label}</div>
  </td>`
}

function ctaButton(href: string, label: string, danger = false) {
  return `<a href="${href}" style="display:block;text-align:center;padding:13px;border-radius:10px;background:${danger ? '#dc2626' : '#1a1a1a'};color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;">${label}</a>`
}

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY manquante, envoi ignoré:', subject)
    return
  }
  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html })
    if (result.error) {
      console.error('[email] Resend a rejeté l\'envoi:', subject, '→', JSON.stringify(result.error))
    } else {
      console.log('[email] Envoyé:', subject, '→', to, '(id:', result.data?.id, ')')
    }
  } catch (err) {
    console.error('[email] Échec envoi (exception):', subject, err)
  }
}

export async function sendWelcomeEmail(to: string, opts: {
  name: string; plan: string; monthlyProducts: number; maxShops: number
}) {
  const limitsLabel = opts.monthlyProducts === Infinity
    ? 'Produits illimités'
    : `${opts.monthlyProducts} produits/mois · ${opts.maxShops} boutiques cibles`

  const html = shell(`
    <h1 style="font-size:22px;font-weight:900;color:#1a1a1a;margin:0 0 12px;letter-spacing:-0.5px;">Bienvenue, ${opts.name} 👋</h1>
    <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 24px;">
      Votre compte ScaleYourShop est prêt. Connectez votre première boutique source et lancez votre premier transfert en quelques minutes.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #e5e5e5;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <div style="font-size:12px;font-weight:700;color:#aaa;letter-spacing:0.8px;margin-bottom:6px;">VOTRE PLAN</div>
        <div style="font-weight:800;font-size:17px;color:#1a1a1a;">${opts.plan}</div>
        <div style="font-size:13px;color:#aaa;margin-top:2px;">${limitsLabel}</div>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#555;line-height:1.8;margin:0 0 28px;">
      1. Connectez votre boutique source (WooCommerce)<br/>
      2. Ajoutez vos boutiques cibles avec leurs clés API<br/>
      3. Sélectionnez une catégorie et lancez votre premier transfert
    </p>
    ${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, 'Accéder au dashboard →')}
  `)

  await send(to, 'Bienvenue sur ScaleYourShop 🌍', html)
}

export async function sendTransferDoneEmail(to: string, opts: {
  transferId: string; done: number; targetName: string
}) {
  const html = shell(`
    <div style="margin-bottom:20px;">
      <h1 style="font-size:18px;font-weight:900;color:#1a1a1a;margin:0;letter-spacing:-0.3px;">✓ Transfert terminé avec succès</h1>
      <div style="font-size:12px;color:#aaa;margin-top:4px;">Vers ${opts.targetName}</div>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      ${statBox(String(opts.done), 'Produits créés')}
      <td width="8"></td>
      ${statBox('100%', 'Réussite')}
    </tr></table>
    ${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL}/transfers`, 'Voir le détail →')}
  `)

  await send(to, `✓ Transfert terminé — ${opts.done} produits créés`, html)
}

export async function sendTransferErrorEmail(to: string, opts: {
  transferId: string; done: number; failed: number; targetName: string
}) {
  const html = shell(`
    <div style="background:#fef2f2;border-radius:10px;padding:16px;border:1px solid #fecaca;margin-bottom:24px;">
      <div style="font-weight:700;font-size:14px;color:#991b1b;margin-bottom:4px;">⚠ Transfert incomplet</div>
      <div style="font-size:13px;color:#7f1d1d;line-height:1.5;">
        ${opts.failed} produit(s) sur ${opts.done + opts.failed} n'ont pas pu être transférés vers ${opts.targetName}.
      </div>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      ${statBox(String(opts.done), 'Réussis')}
      <td width="8"></td>
      ${statBox(String(opts.failed), 'Échecs')}
    </tr></table>
    <p style="font-size:13px;color:#666;line-height:1.7;margin:0 0 20px;">
      Consultez le détail du transfert pour voir les erreurs précises et relancer les produits concernés.
    </p>
    ${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL}/transfers`, 'Voir les erreurs →', true)}
  `)

  await send(to, `⚠ Transfert incomplet — ${opts.failed} produit(s) en échec`, html)
}

export async function sendQuotaWarningEmail(to: string, opts: {
  used: number; limit: number; plan: string
}) {
  const pct = Math.round((opts.used / opts.limit) * 100)
  const html = shell(`
    <div style="background:#fffbeb;border-radius:10px;padding:16px;border:1px solid #fde68a;margin-bottom:24px;">
      <div style="font-weight:700;font-size:14px;color:#92400e;margin-bottom:4px;">Vous approchez de votre limite mensuelle</div>
      <div style="font-size:13px;color:#92400e;line-height:1.5;">
        ${opts.used}/${opts.limit} produits utilisés ce mois (${pct}%) sur le plan ${opts.plan}.
      </div>
    </div>
    <p style="font-size:13px;color:#666;line-height:1.7;margin:0 0 20px;">
      Passez à un plan supérieur pour continuer à transférer sans interruption une fois la limite atteinte.
    </p>
    ${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL}/settings`, 'Changer de plan →')}
  `)

  await send(to, 'Vous approchez de votre limite mensuelle', html)
}

export async function sendPaymentOkEmail(to: string, opts: {
  plan: string; amount: string; last4: string
}) {
  const html = shell(`
    <h1 style="font-size:18px;font-weight:900;color:#1a1a1a;margin:0 0 16px;letter-spacing:-0.3px;">Reçu de paiement</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #e5e5e5;margin-bottom:20px;">
      <tr><td style="padding:16px;">
        <div style="font-size:13px;color:#888;margin-bottom:8px;">Plan ${opts.plan}</div>
        <div style="font-size:20px;font-weight:900;color:#1a1a1a;">${opts.amount}</div>
        <div style="font-size:12px;color:#aaa;margin-top:6px;">Carte ···· ${opts.last4}</div>
      </td></tr>
    </table>
    ${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, 'Accéder au dashboard →')}
  `)

  await send(to, `Reçu de paiement — Plan ${opts.plan} · ${opts.amount}`, html)
}

export async function sendPaymentFailedEmail(to: string, opts: {
  amount: string; last4: string
}) {
  const html = shell(`
    <div style="background:#fef2f2;border-radius:10px;padding:16px;border:1px solid #fecaca;margin-bottom:24px;">
      <div style="font-weight:700;font-size:14px;color:#991b1b;margin-bottom:4px;">⚠ Votre paiement a été refusé</div>
      <div style="font-size:13px;color:#7f1d1d;line-height:1.5;">
        Le prélèvement de ${opts.amount} sur votre carte ···· ${opts.last4} a échoué.
      </div>
    </div>
    <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 20px;">
      Mettez à jour votre moyen de paiement dans les <strong>7 jours</strong> pour éviter une suspension de votre accès.
    </p>
    ${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL}/settings`, 'Mettre à jour ma carte →', true)}
  `)

  await send(to, 'Action requise : paiement refusé', html)
}

export async function sendPasswordResetEmail(to: string, opts: {
  resetUrl: string
}) {
  const html = shell(`
    <h1 style="font-size:18px;font-weight:900;color:#1a1a1a;margin:0 0 12px;letter-spacing:-0.3px;">Réinitialisation du mot de passe</h1>
    <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 24px;">
      Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien expire dans <strong>1 heure</strong>.
    </p>
    ${ctaButton(opts.resetUrl, 'Réinitialiser mon mot de passe →')}
    <p style="font-size:12px;color:#bbb;line-height:1.6;margin:20px 0 0;">
      Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email sans risque — votre mot de passe restera inchangé.
    </p>
  `)

  await send(to, 'Réinitialisation de votre mot de passe', html)
}
