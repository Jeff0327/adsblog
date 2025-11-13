'use server'

import { createClient } from '@/utils/supabase/server'
import { Post } from '@/types'

const BLOG_KEY = process.env.BLOG_KEY || 'default'

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('blog_key', BLOG_KEY)  // ⭐ BLOG_KEY 필터링
    .eq('slug', slug)
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

  return data as Post
}

export async function getAdjacentPosts(currentPostId: string) {
  const supabase = await createClient()

  // 현재 글의 created_at 가져오기
  const { data: currentPost } = await supabase
    .from('posts')
    .select('created_at')
    .eq('id', currentPostId)
    .single()

  if (!currentPost) return { prev: null, next: null }

  const createdAt = currentPost.created_at

  // 이전 글 (더 오래된 글)
  const { data: prevPost } = await supabase
    .from('posts')
    .select('id, title, slug')
    .eq('blog_key', BLOG_KEY)  // ⭐ BLOG_KEY 필터링
    .lt('created_at', createdAt)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // 다음 글 (더 최근 글)
  const { data: nextPost } = await supabase
    .from('posts')
    .select('id, title, slug')
    .eq('blog_key', BLOG_KEY)  // ⭐ BLOG_KEY 필터링
    .gt('created_at', createdAt)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  return {
    prev: prevPost || null,
    next: nextPost || null,
  }
}

export async function getRecentPosts(limit: number = 10): Promise<Post[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, created_at, view_count, og_image')
    .eq('blog_key', BLOG_KEY)  // ⭐ BLOG_KEY 필터링
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent posts:', error)
    return []
  }

  return (data || []) as Post[]
}
