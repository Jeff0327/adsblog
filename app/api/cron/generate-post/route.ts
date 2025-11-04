import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { generateBlogPost } from '@/utils/gemini'
import { searchImages } from '@/utils/unsplash'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron Secret 검증 (선택사항)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // 1. 랜덤 카테고리 선택
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true })

    if (!categories || categories.length === 0) {
      return NextResponse.json({ error: 'No categories found' }, { status: 400 })
    }

    const randomCategory = categories[Math.floor(Math.random() * categories.length)]

    // 2. 해당 카테고리의 SEO 키워드 가져오기
    const { data: seoKeywords } = await supabase
      .from('seo_keywords')
      .select('keyword')
      .or(`category_id.eq.${randomCategory.id},is_global.eq.true`)

    const keywords = seoKeywords?.map((k) => k.keyword) || []

    // 키워드가 없으면 기본 키워드 사용
    const finalKeywords = keywords.length > 0 ? keywords : ['blog', 'article', 'content']

    // 3. 주제 생성 (카테고리 + 키워드 조합)
    const randomKeyword = finalKeywords[Math.floor(Math.random() * finalKeywords.length)]
    const topic = `${randomCategory.name} - ${randomKeyword}`

    // 4. Gemini로 블로그 글 생성
    console.log(`Generating blog post for topic: ${topic}`)
    const generatedContent = await generateBlogPost(topic, randomCategory.name, finalKeywords)

    // 5. Unsplash에서 이미지 검색
    console.log(`Searching images with keywords: ${generatedContent.image_keywords.join(', ')}`)
    const images = await searchImages(generatedContent.image_keywords, 3)

    // 6. Slug 생성 (중복 확인)
    let slug = generateSlug(generatedContent.title)
    let slugCounter = 1

    while (true) {
      const { data: existingPost } = await supabase
        .from('posts')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!existingPost) break

      slug = `${generateSlug(generatedContent.title)}-${slugCounter}`
      slugCounter++
    }

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
