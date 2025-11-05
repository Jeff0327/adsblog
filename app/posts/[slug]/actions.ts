'use server'

import { createClient } from '@/utils/supabase/server'
import { PostWithAll, PostImage } from '@/types'

const BLOG_KEY = process.env.BLOG_KEY || 'default'

export async function getPostBySlug(slug: string): Promise<PostWithAll | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      category:categories(*),
      images:post_images(*)
    `
    )
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  // 해당 블로그의 포스트인지 확인 (category를 통해)
  if (data.category && data.category.blog_key !== BLOG_KEY) {
    console.log(`Post belongs to different blog: ${data.category.blog_key}`)
    return null
  }

  // 조회수 증가
  await supabase
    .from('posts')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id)

  // 이미지 정렬
  if (data.images) {
    data.images.sort((a: PostImage, b: PostImage) => a.order_index - b.order_index)
  }

  return data as PostWithAll
}

export async function getAdjacentPosts(currentPostId: string, categoryId: string | null) {
  const supabase = await createClient()

  // 현재 블로그의 카테고리 ID들 가져오기
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('blog_key', BLOG_KEY)

  if (!categories || categories.length === 0) {
    return { prev: null, next: null }
  }

  const categoryIds = categories.map((c) => c.id)

  // 현재 글의 published_at 가져오기
  const { data: currentPost } = await supabase
    .from('posts')
    .select('published_at')
    .eq('id', currentPostId)
    .single()

  if (!currentPost) return { prev: null, next: null }

  const publishedAt = currentPost.published_at

  // 이전 글 (더 오래된 글) - 현재 블로그의 카테고리에 속한 것만
  let prevQuery = supabase
    .from('posts')
    .select('id, title, slug')
    .eq('published', true)
    .in('category_id', categoryIds)
    .lt('published_at', publishedAt)
    .order('published_at', { ascending: false })
    .limit(1)

  if (categoryId) {
    prevQuery = prevQuery.eq('category_id', categoryId)
  }

  const { data: prevPost } = await prevQuery.single()

  // 다음 글 (더 최근 글) - 현재 블로그의 카테고리에 속한 것만
  let nextQuery = supabase
    .from('posts')
    .select('id, title, slug')
    .eq('published', true)
    .in('category_id', categoryIds)
    .gt('published_at', publishedAt)
    .order('published_at', { ascending: true })
    .limit(1)

  if (categoryId) {
    nextQuery = nextQuery.eq('category_id', categoryId)
  }

  const { data: nextPost } = await nextQuery.single()

  return {
    prev: prevPost || null,
    next: nextPost || null,
  }
}
