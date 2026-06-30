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

export default function TermsPage() {
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
          Conditions générales d'utilisation et de vente
        </h1>
        <p style={{ fontSize: 13, color: '#999', marginBottom: 40 }}>Dernière mise à jour : [À COMPLÉTER — date]</p>

        <Section title="Éditeur du site">
          <p>
            Le service ScaleYourShop (accessible à l'adresse scaleyourshop.app) est édité par <strong>[NOM DE L'ENTREPRISE / NOM ET PRÉNOM]</strong>,
            [forme juridique], SIRET : <strong>en cours d'attribution</strong>, [ADRESSE COMPLÈTE].
          </p>
          <p style={{ marginTop: 10 }}>Contact : <strong>contact@scaleyourshop.app</strong></p>
          <p style={{ marginTop: 10 }}>Hébergeur : Contabo GmbH, Aschauer Straße 32, 81549 Munich, Allemagne.</p>
        </Section>

        <Section title="1. Objet">
          <p>
            Les présentes conditions générales régissent l'utilisation du service ScaleYourShop, qui permet de dupliquer et reformuler
            un catalogue de produits e-commerce d'une boutique source vers une ou plusieurs boutiques cibles, dans différentes langues
            et avec un traitement anti-traçabilité des images.
          </p>
        </Section>

        <Section title="2. Création de compte">
          <p>
            L'utilisation du service nécessite la création d'un compte (email/mot de passe ou via Google/GitHub). Vous êtes responsable
            de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.
          </p>
        </Section>

        <Section title="3. Description du service et des plans">
          <p>ScaleYourShop propose les plans suivants :</p>
          <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
            <li><strong>Free</strong> : essai gratuit limité à 5 produits au total, sans carte bancaire requise</li>
            <li><strong>Starter</strong> : paiement unique de 49€, 100 produits au total, 3 boutiques cibles</li>
            <li><strong>Growth</strong> : abonnement mensuel ou annuel (−20%), 500 produits/mois, 10 boutiques cibles, sans engagement</li>
            <li><strong>Business</strong> : abonnement mensuel ou annuel (−20%), 5 000 produits/mois, boutiques illimitées, sans engagement</li>
          </ul>
          <p style={{ marginTop: 10 }}>
            Les quotas et fonctionnalités de chaque plan sont détaillés sur la page tarifs et peuvent évoluer ; toute modification
            substantielle vous sera communiquée.
          </p>
        </Section>

        <Section title="4. Facturation et paiement">
          <p>
            Les paiements sont traités par Stripe. Le plan Starter est facturé en une fois (paiement unique, non récurrent). Les plans
            Growth et Business sont facturés mensuellement ou annuellement selon votre choix.
          </p>
          <p style={{ marginTop: 10 }}>
            <strong>Facturation annuelle</strong> : payée d'avance, non remboursable, renouvellement automatique à l'échéance,
            annulable à tout moment avant le renouvellement depuis votre espace client.
          </p>
          <p style={{ marginTop: 10 }}>
            <strong>Facturation mensuelle</strong> : sans engagement, résiliable à tout moment ; la résiliation prend effet à la fin
            de la période déjà payée.
          </p>
        </Section>

        <Section title="5. Droit de rétractation">
          <p>
            Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas pleinement aux
            services numériques dont l'exécution a commencé avec votre accord exprès avant la fin du délai de rétractation
            (ce qui est le cas dès qu'un transfert est lancé). En souscrivant à un plan payant et en lançant un transfert, vous
            reconnaissez et acceptez cette exécution immédiate.
          </p>
        </Section>

        <Section title="6. Obligations de l'utilisateur">
          <p>Vous vous engagez à :</p>
          <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
            <li>Utiliser le service uniquement pour des boutiques et produits dont vous détenez les droits ou l'autorisation de revente</li>
            <li>Ne pas transférer de contenu illicite, contrefait ou portant atteinte aux droits de tiers</li>
            <li>Respecter les conditions d'utilisation des plateformes tierces connectées (WooCommerce, Shopify, votre fournisseur Resend/Stripe, etc.)</li>
            <li>Ne pas tenter de contourner les quotas ou limitations techniques du service</li>
          </ul>
        </Section>

        <Section title="7. Disponibilité du service">
          <p>
            Nous mettons tout en œuvre pour assurer la disponibilité du service, sans garantie de disponibilité continue (absence de SLA
            contractuel hors offre Enterprise sur mesure). Des interruptions pour maintenance peuvent survenir, avec un préavis lorsque cela
            est possible.
          </p>
        </Section>

        <Section title="8. Responsabilité">
          <p>
            ScaleYourShop fournit un outil de transfert et de reformulation automatisée. Nous ne sommes pas responsables du contenu
            des produits transférés (descriptions, images, prix), de leur conformité légale, ni des conséquences commerciales de leur
            mise en ligne. Vous restez seul responsable du contenu publié sur vos boutiques.
          </p>
          <p style={{ marginTop: 10 }}>
            Notre responsabilité, si elle est engagée, est limitée au montant effectivement payé pour le service au cours des 12 derniers mois.
          </p>
        </Section>

        <Section title="9. Résiliation">
          <p>
            Vous pouvez résilier votre compte à tout moment depuis votre espace client. Nous nous réservons le droit de suspendre ou
            résilier un compte en cas d'usage abusif, de non-paiement, ou de violation des présentes conditions.
          </p>
        </Section>

        <Section title="10. Modification des présentes conditions">
          <p>
            Nous pouvons faire évoluer ces conditions générales. En cas de modification substantielle, vous en serez informé par email
            ou via le service avant leur entrée en vigueur.
          </p>
        </Section>

        <Section title="11. Droit applicable et litiges">
          <p>
            Les présentes conditions sont soumises au droit français. En cas de litige, et après recherche d'une solution amiable,
            les tribunaux français compétents seront saisis.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>Pour toute question relative à ces conditions : <strong>contact@scaleyourshop.app</strong></p>
        </Section>
      </div>
    </div>
  )
}
