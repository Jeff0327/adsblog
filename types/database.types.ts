// Supabase Database Types - DB 스키마와 완전히 일치

export interface BlogSettings {
  id: string
  blog_key: string
  userId: string | null

  // 사이트 기본 정보
  site_title: string
  site_description: string | null
  site_url: string | null
  keywords: string[] | null

  // AdSense
  adsense_enabled: boolean | null
  adsense_client_id: string | null

  // 콘텐츠 스타일
  content_style: string | null

  // 상태
  is_public: boolean | null
  isActive: boolean | null

  // 비즈니스 정보
  businessName: string | null
  businessDescription: string | null
  promotionGoal: string | null
  productInfo: Record<string, unknown> | null

  // 자동 포스팅 설정
  postsPerDay: number | null
  imagesPerPost: number | null
  postingEnabled: boolean | null
  lastPostedAt: string | null

  // 마케팅 & 브랜딩
  industry: string | null
  brandInfo: {
    brandName?: string
    coreValues?: string[]
    targetAudience?: string
    uniqueSellingPoints?: string[]
    brandVoice?: string
  } | null

  // AI 프롬프트 설정
  promptSettings: {
    provider?: 'openai' | 'gemini' | 'claude' // AI 제공자
    apiKey?: string                            // API 키 (DB 저장)
    model?: string                             // 모델명
    contentPrompt?: string                     // 커스텀 프롬프트
    seoPrompt?: string                         // SEO 프롬프트
    temperature?: number                       // 0.0 ~ 1.0
    maxTokens?: number                         // 최대 토큰
  } | null

  // 타임스탬프
  created_at: string | null
  updated_at: string | null
}

export interface Post {
  id: string
  blog_key: string
  authorId: string | null

  // 기본 정보
  title: string
  slug: string
  content: string | null
  excerpt: string | null

  // 콘텐츠 형식
  richContent: Record<string, unknown> | null
  contentFormat: string | null

  // 이미지 & 태그
  images: string[] | null
  tags: string[] | null

  // SEO
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[] | null
  og_image: string | null

  // 상태
  view_count: number | null

  // 타임스탬프
  created_at: string | null
  updated_at: string | null
}

export interface PostImage {
  id: string
  post_id: string
  image_url: string
  alt_text: string | null
  order_index: number
  created_at: string
}

// Join Types (호환성을 위해 유지)
export interface PostWithCategory extends Post {
  category: null
}

export interface PostWithImages extends Post {
  images_data?: PostImage[]
}

export interface PostWithAll extends Post {
  category: null
  images_data?: PostImage[]
}
