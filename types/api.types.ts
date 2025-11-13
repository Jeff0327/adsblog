// API Response Types

export interface UnsplashImage {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string | null
  user: {
    name: string
    username: string
  }
}

export interface GeminiGeneratedContent {
  title: string
  content: string
  excerpt: string
  tags: string[]
  seo_title: string
  seo_description: string
  seo_keywords: string[]
  image_keywords: string[]
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}
