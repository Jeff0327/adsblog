// Supabase Database Types

export interface BlogSettings {
  id: string
  site_title: string
  site_description: string | null
  site_url: string | null
  default_og_image: string | null
  favicon_url: string | null
  adsense_enabled: boolean
  adsense_client_id: string | null
  adsense_sidebar_slot: string | null
  adsense_in_article_slot: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface SeoKeyword {
  id: string
  keyword: string
  category_id: string | null
  is_global: boolean
  created_at: string
}

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  category_id: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[] | null
  og_image: string | null
  published: boolean
  published_at: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export interface PostImage {
  id: string
  post_id: string
  image_url: string
  alt_text: string | null
  order_index: number
  created_at: string
}

// Join Types
export interface PostWithCategory extends Post {
  category: Category | null
}

export interface PostWithImages extends Post {
  images: PostImage[]
}

export interface PostWithAll extends Post {
  category: Category | null
  images: PostImage[]
}
