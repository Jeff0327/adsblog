import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/utils/supabase/service'
import { generateBlogPost } from '@/utils/ai'
import { searchImages } from '@/utils/unsplash'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BLOG_KEY = process.env.BLOG_KEY || 'default'

/**
 * 영문 slug 생성 (한글 제거, 타임스탬프 추가)
 */
function generateSlug(baseText: string, timestamp?: number): string {
  const cleanText = baseText
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 한글, 특수문자 제거
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() || 'post'

  const time = timestamp || Date.now()
  return `${cleanText}-${time}`
}

/**
 * 주제 생성 함수
 */
function generateTopic(
  industry: string | null,
  keywords: string[],
  brandInfo: {
    targetAudience?: string
    [key: string]: unknown
  } | null
): string {
  if (keywords.length === 0) {
    keywords = ['블로그', '콘텐츠', '정보']
  }

  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)]

  // 타겟 고객이 있으면 활용
  if (brandInfo?.targetAudience) {
    return `${brandInfo.targetAudience}를 위한 ${randomKeyword}`
  }

  // 산업 분야가 있으면 활용
  if (industry) {
    return `${industry} 분야의 ${randomKeyword}`
  }

  // 기본
  return randomKeyword
}

export async function GET(request: NextRequest) {
  try {
    // 1. Cron Secret 검증
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // 2. 블로그 설정 가져오기
    const { data: blogSettings, error: settingsError } = await supabase
      .from('blog_settings')
      .select('*')
      .eq('blog_key', BLOG_KEY)
      .single()

    if (settingsError || !blogSettings) {
      console.error('Blog settings not found for BLOG_KEY:', BLOG_KEY)
      return NextResponse.json(
        { error: `Blog settings not found for key: ${BLOG_KEY}` },
        { status: 400 }
      )
    }

    // 3. 자동 포스팅이 활성화되어 있는지 확인
    if (!blogSettings.postingEnabled) {
      return NextResponse.json({
        success: false,
        message: 'Auto-posting is disabled for this blog',
      })
    }

    // 4. 키워드 준비
    const keywords = blogSettings.keywords || ['블로그', '정보', '가이드']

    // 5. 주제 생성
    const topic = generateTopic(
      blogSettings.industry,
      keywords as string[],
      blogSettings.brandInfo as { targetAudience?: string; [key: string]: unknown } | null
    )

    console.log(`[${BLOG_KEY}] Generating post for topic: "${topic}"`)

    // 6. Unsplash에서 이미지 먼저 검색 (keywords 기반)
    const imagesPerPost = blogSettings.imagesPerPost || 3
    console.log(
      `[${BLOG_KEY}] Searching images with keywords: ${keywords.join(', ')}`
    )

    const images = await searchImages(keywords as string[], imagesPerPost)
    const imageUrls = images.map((img) => img.urls.regular)

    console.log(`[${BLOG_KEY}] Found ${imageUrls.length} images`)

    // 7. AI로 블로그 글 생성 (이미지 URL 포함)
    const generatedContent = await generateBlogPost(
      topic,
      keywords as string[],
      {
        businessName: blogSettings.businessName,
        businessDescription: blogSettings.businessDescription,
        promotionGoal: blogSettings.promotionGoal,
        contentStyle: blogSettings.content_style,
        industry: blogSettings.industry,
        brandInfo: blogSettings.brandInfo as {
          brandName?: string
          coreValues?: string[]
          targetAudience?: string
          uniqueSellingPoints?: string[]
          brandVoice?: string
        } | null,
        promptSettings: blogSettings.promptSettings as {
          provider?: 'openai' | 'gemini' | 'claude'
          apiKey?: string
          model?: string
          contentPrompt?: string
          seoPrompt?: string
          temperature?: number
          maxTokens?: number
        } | null,
      },
      imageUrls
    )

    console.log(`[${BLOG_KEY}] Content generated: "${generatedContent.title}"`)
    console.log(`[${BLOG_KEY}] Tags: ${generatedContent.tags.join(', ')}`)

    // 8. Slug 생성 (타임스탬프 기반 고유성 보장)
    const slug = generateSlug(generatedContent.title)

    // 9. 포스트 저장 (새 스키마)
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        blog_key: BLOG_KEY,
        title: generatedContent.title,
        slug,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt,
        tags: generatedContent.tags,
        images: imageUrls, // 이미지 URL 배열
        seo_title: generatedContent.seo_title,
        seo_description: generatedContent.seo_description,
        seo_keywords: generatedContent.seo_keywords,
        og_image: imageUrls.length > 0 ? imageUrls[0] : null,
      })
      .select()
      .single()

    if (postError) {
      console.error(`[${BLOG_KEY}] Error creating post:`, postError)
      return NextResponse.json(
        { error: 'Failed to create post', details: postError },
        { status: 500 }
      )
    }

    // 10. lastPostedAt 업데이트
    await supabase
      .from('blog_settings')
      .update({ lastPostedAt: new Date().toISOString() })
      .eq('blog_key', BLOG_KEY)

    console.log(`[${BLOG_KEY}] Post created successfully: ${post.id}`)

    // 11. 캐시 무효화 (즉시 반영)
    try {
      revalidatePath('/', 'page') // 홈페이지 캐시 무효화
      revalidatePath(`/post/${slug}`, 'page') // 새 포스트 페이지 캐시 무효화
      console.log(`[${BLOG_KEY}] Cache invalidated for / and /post/${slug}`)
    } catch (revalidateError) {
      console.error(`[${BLOG_KEY}] Cache revalidation failed:`, revalidateError)
      // 캐시 무효화 실패해도 포스트는 생성되었으므로 계속 진행
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        tags: post.tags,
        images_count: imageUrls.length,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/post/${post.slug}`,
      },
    })
  } catch (error) {
    console.error('[generate-post] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
