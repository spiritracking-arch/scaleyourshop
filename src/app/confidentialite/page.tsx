import Link from 'next/link'
import { LOGO_DATA_URI } from '@/lib/logo'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.3px' }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#555', lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#fafafa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#1a1a1a', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src={LOGO_DATA_URI} alt="ScaleYourShop" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
          <span style={{ fontWeight: 800, fontSize: 15, color: 'white', letterSpacing: '-0.3px' }}>Scale<span style={{ color: '#FA0C00' }}>Your</span>Shop</span>
        </Link>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: '#1a1a1a', marginBottom: 8 }}>
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: 13, color: '#999', marginBottom: 40 }}>Dernière mise à jour : [À COMPLÉTER — date]</p>

        <Section title="1. Qui sommes-nous ?">
          <p>
            ScaleYourShop est édité par <strong>[NOM DE L'ENTREPRISE / NOM ET PRÉNOM]</strong>, [forme juridique — ex : entreprise individuelle / SASU / etc.],
            SIRET : <strong>en cours d'attribution</strong>, dont le siège est situé [ADRESSE COMPLÈTE].
          </p>
          <p style={{ marginTop: 10 }}>
            Contact pour toute question relative à vos données personnelles : <strong>contact@scaleyourshop.app</strong>.
          </p>
        </Section>

        <Section title="2. Quelles données collectons-nous ?">
          <p>Dans le cadre de l'utilisation du service, nous collectons :</p>
          <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
            <li>Données de compte : nom, adresse email, mot de passe (haché, jamais stocké en clair)</li>
            <li>Données de connexion sociale : si vous utilisez Google ou GitHub pour vous connecter, nous recevons votre nom et email associés à ce compte</li>
            <li>Données de boutique : URL de vos boutiques connectées, clés API WooCommerce/Shopify (chiffrées en base avec AES-256-GCM, jamais stockées en clair)</li>
            <li>Données de facturation : gérées et stockées par notre prestataire de paiement Stripe — nous ne stockons jamais votre numéro de carte bancaire</li>
            <li>Données d'usage : historique de vos transferts, statistiques de consommation (nombre de produits transférés)</li>
          </ul>
        </Section>

        <Section title="3. Pourquoi collectons-nous ces données ?">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Fournir le service : exécuter vos transferts de produits entre boutiques</li>
            <li>Gérer votre compte et votre abonnement</li>
            <li>Vous contacter en cas de problème sur un transfert ou un paiement</li>
            <li>Améliorer le service (statistiques d'usage agrégées et anonymisées)</li>
            <li>Respecter nos obligations légales et comptables</li>
          </ul>
        </Section>

        <Section title="4. Base légale du traitement">
          <p>
            Le traitement de vos données repose sur l'exécution du contrat qui nous lie (fourniture du service que vous avez souscrit)
            et, pour certains traitements optionnels (ex : emails d'information produit), sur votre consentement.
          </p>
        </Section>

        <Section title="5. Qui a accès à vos données ? (sous-traitants)">
          <p>Vos données peuvent être transmises aux prestataires suivants, dans la stricte mesure nécessaire au fonctionnement du service :</p>
          <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
            <li><strong>Stripe</strong> (paiement) — société américaine, certifiée PCI-DSS</li>
            <li><strong>Resend</strong> (envoi d'emails transactionnels)</li>
            <li><strong>Anthropic</strong> (API Claude, utilisée pour reformuler les titres et descriptions de vos produits — vos descriptions source sont transmises à ce service dans ce seul but)</li>
            <li><strong>Contabo</strong> (hébergement du serveur)</li>
            <li><strong>Google / GitHub</strong> (uniquement si vous choisissez de vous connecter via ces services)</li>
          </ul>
          <p style={{ marginTop: 10 }}>
            Certains de ces prestataires sont situés hors de l'Union européenne (notamment aux États-Unis). Ces transferts sont encadrés
            par les garanties prévues par leurs propres certifications (ex : clauses contractuelles types).
          </p>
        </Section>

        <Section title="6. Combien de temps conservons-nous vos données ?">
          <p>
            Vos données de compte sont conservées pendant toute la durée de votre utilisation du service, puis supprimées dans un délai
            de [À COMPLÉTER — ex : 12 mois] après la clôture de votre compte, sauf obligation légale de conservation plus longue
            (notamment comptable).
          </p>
        </Section>

        <Section title="7. Vos droits">
          <p>Conformément au RGPD, vous disposez des droits suivants sur vos données :</p>
          <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
            <li>Droit d'accès : obtenir une copie des données que nous détenons sur vous</li>
            <li>Droit de rectification : corriger des données inexactes</li>
            <li>Droit à l'effacement : demander la suppression de vos données</li>
            <li>Droit à la portabilité : récupérer vos données dans un format exploitable</li>
            <li>Droit d'opposition : vous opposer à certains traitements</li>
          </ul>
          <p style={{ marginTop: 10 }}>
            Pour exercer ces droits, contactez-nous à <strong>contact@scaleyourshop.app</strong>. Vous pouvez également introduire une réclamation
            auprès de la CNIL (<a href="https://www.cnil.fr" style={{ color: '#1a1a1a' }}>www.cnil.fr</a>).
          </p>
        </Section>

        <Section title="8. Sécurité">
          <p>
            Les mots de passe sont hachés (bcrypt) et ne sont jamais stockés en clair. Les clés API de vos boutiques sont chiffrées
            en base de données (AES-256-GCM). Les connexions au service sont sécurisées (HTTPS/TLS).
          </p>
        </Section>

        <Section title="9. Cookies">
          <p>
            ScaleYourShop utilise uniquement un cookie technique strictement nécessaire (cookie de session, httpOnly, sécurisé) permettant
            de vous maintenir connecté. Nous n'utilisons pas de cookies publicitaires ou de traceurs tiers à des fins marketing.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Pour toute question relative à cette politique ou à vos données personnelles : <strong>contact@scaleyourshop.app</strong>.
          </p>
        </Section>
      </div>
    </div>
  )
}
