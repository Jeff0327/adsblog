import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { generateBlogPost } from '@/utils/gemini'
import { searchImages } from '@/utils/unsplash'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BLOG_KEY = process.env.BLOG_KEY || 'default'

function generateSlug(categoryName: string, timestamp?: number): string {
  // 카테고리명을 영문으로 변환 (한글 제거)
  const categorySlug = categoryName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 한글 제거, 영문/숫자만 허용
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() || 'post'

  // 타임스탬프 또는 현재 시간 사용
  const time = timestamp || Date.now()

  // 고유한 영문 slug 생성: category-timestamp
  return `${categorySlug}-${time}`
}

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron Secret 검증 (선택사항)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // 0. 블로그 설정 가져오기 (마케팅 정보 포함)
    const { data: blogSettings, error: settingsError } = await supabase
      .from('blog_settings')
      .select('*')
      .eq('blog_key', BLOG_KEY)
      .single()

    if (settingsError || !blogSettings) {
      console.error('Blog settings not found for BLOG_KEY:', BLOG_KEY)
      return NextResponse.json({ error: `Blog settings not found for key: ${BLOG_KEY}` }, { status: 400 })
    }

    // 1. 현재 블로그의 랜덤 카테고리 선택
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('blog_key', BLOG_KEY)
      .order('order_index', { ascending: true })

    if (!categories || categories.length === 0) {
      return NextResponse.json({ error: `No categories found for blog: ${BLOG_KEY}` }, { status: 400 })
    }

    const randomCategory = categories[Math.floor(Math.random() * categories.length)]

    // 2. 해당 블로그 + 카테고리의 SEO 키워드 가져오기
    const { data: seoKeywords } = await supabase
      .from('seo_keywords')
      .select('keyword')
      .eq('blog_key', BLOG_KEY)
      .or(`category_id.eq.${randomCategory.id},is_global.eq.true`)

    const keywords = seoKeywords?.map((k) => k.keyword) || []

    // target_keywords가 있으면 추가
    const allKeywords = [
      ...keywords,
      ...(blogSettings.target_keywords || []),
    ]
    const finalKeywords = allKeywords.length > 0 ? allKeywords : ['blog', 'article', 'content']

    // 3. 주제 생성 (카테고리 + 키워드 조합)
    const randomKeyword = finalKeywords[Math.floor(Math.random() * finalKeywords.length)]
    const topic = `${randomCategory.name} - ${randomKeyword}`

    // 4. Gemini로 블로그 글 생성 (마케팅 정보 포함)
    console.log(`Generating blog post for blog: ${BLOG_KEY}, topic: ${topic}`)
    const generatedContent = await generateBlogPost(
      topic,
      randomCategory.name,
      finalKeywords,
      {
        businessName: blogSettings.business_name,
        businessType: blogSettings.business_type,
        marketingGoal: blogSettings.marketing_goal,
        contentStyle: blogSettings.content_style,
      }
    )

    // 5. Unsplash에서 이미지 검색
    console.log(`Searching images with keywords: ${generatedContent.image_keywords.join(', ')}`)
    const images = await searchImages(generatedContent.image_keywords, 3)

    // 6. Slug 생성 (타임스탬프 기반으로 고유성 보장)
    const slug = generateSlug(randomCategory.slug || randomCategory.name)

    // 7. 포스트 저장
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title: generatedContent.title,
        slug,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt,
        category_id: randomCategory.id,
        seo_title: generatedContent.seo_title,
        seo_description: generatedContent.seo_description,
        seo_keywords: generatedContent.seo_keywords,
        og_image: images.length > 0 ? images[0].urls.regular : null,
        published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (postError) {
      console.error('Error creating post:', postError)
      return NextResponse.json({ error: 'Failed to create post', details: postError }, { status: 500 })
    }

    // 8. 이미지 저장
    if (images.length > 0 && post) {
      const imageInserts = images.map((image, index) => ({
        post_id: post.id,
        image_url: image.urls.regular,
        alt_text: image.alt_description || generatedContent.title,
        order_index: index,
      }))

      const { error: imagesError } = await supabase.from('post_images').insert(imageInserts)

      if (imagesError) {
        console.error('Error saving images:', imagesError)
      }
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        category: randomCategory.name,
        images_count: images.length,
      },
    })
  } catch (error) {
    console.error('Error in generate-post cron:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
