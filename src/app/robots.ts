import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard',
        '/transfers',
        '/shops',
        '/settings',
        '/onboarding',
        '/admin',
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
        '/uploads/',
      ],
    },
    sitemap: 'https://scaleyourshop.app/sitemap.xml',
  }
}
