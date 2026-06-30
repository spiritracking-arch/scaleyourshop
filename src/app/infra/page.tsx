import type { Metadata } from 'next'
import InfraPageClient from '@/components/InfraPageClient'

export const metadata: Metadata = {
  title: "Scalez à l'international avec le CMS e-commerce le plus rapide d'Europe",
  description: "Infrastructure e-commerce multi-boutiques sur mesure : domaines, bases de données et SSL indépendants par marché, anti-footprints complet, push produit automatisé.",
}

export default function InfraPage() {
  return <InfraPageClient />
}
