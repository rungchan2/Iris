import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://kindt.kr'
  const supabase = await createClient()

  // Get all approved photographers
  const { data: photographers } = await supabase
    .from('photographers')
    .select('id, updated_at')
    .eq('approval_status', 'approved')
    .order('updated_at', { ascending: false })

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/matching`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/photographers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // Dynamic photographer routes
  if (photographers && photographers.length > 0) {
    const photographerRoutes = photographers.map((photographer) => ({
      url: `${baseUrl}/photographers/${photographer.id}`,
      lastModified: new Date(photographer.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
    routes.push(...photographerRoutes)
  }

  return routes
}
