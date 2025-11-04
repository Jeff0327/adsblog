'use server'

import { createClient } from '@/utils/supabase/server'
import { PostWithAll, PostImage } from '@/types'

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

  // 현재 글의 published_at 가져오기
  const { data: currentPost } = await supabase
    .from('posts')
    .select('published_at')
    .eq('id', currentPostId)
    .single()

  if (!currentPost) return { prev: null, next: null }

  const publishedAt = currentPost.published_at

  // 이전 글 (더 오래된 글)
  let prevQuery = supabase
    .from('posts')
    .select('id, title, slug')
    .eq('published', true)
    .lt('published_at', publishedAt)
    .order('published_at', { ascending: false })
    .limit(1)

  if (categoryId) {
    prevQuery = prevQuery.eq('category_id', categoryId)
  }

  const { data: prevPost } = await prevQuery.single()

  // 다음 글 (더 최근 글)
  let nextQuery = supabase
    .from('posts')
    .select('id, title, slug')
    .eq('published', true)
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
