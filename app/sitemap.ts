import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

const BLOG_KEY = process.env.BLOG_KEY || 'default'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Get all posts for this blog
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at, created_at')
    .eq('blog_key', BLOG_KEY)  // ⭐ BLOG_KEY 필터링
    .order('created_at', { ascending: false })

  const postUrls: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${baseUrl}/post/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...postUrls,
  ]
}
