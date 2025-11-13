'use server'

import { createClient } from '@/utils/supabase/server'
import { PostWithCategory, BlogSettings } from '@/types'

const BLOG_KEY = process.env.BLOG_KEY || 'default'

export async function getBlogSettings(): Promise<BlogSettings | null> {
  try {
    const supabase = await createClient()

    // blog_key로 해당 블로그의 설정만 조회
    const { data, error } = await supabase
      .from('blog_settings')
      .select('*')
      .eq('blog_key', BLOG_KEY)
      .maybeSingle()

    if (error) {
      console.error('Error fetching blog settings:', JSON.stringify(error, null, 2))
      return null
    }

    // 데이터가 없으면 null 반환 (에러 없음)
    return data
  } catch (error) {
    console.error('Exception in getBlogSettings:', error)
    return null
  }
}

export async function getPosts(
  categorySlug?: string,
  page: number = 1,
  limit: number = 10
): Promise<{ posts: PostWithCategory[]; total: number }> {
  const supabase = await createClient()

  // 카테고리 제거: 카테고리 없이 posts만 조회
  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('blog_key', BLOG_KEY)
    .order('created_at', { ascending: false })

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching posts:', error)
    return { posts: [], total: 0 }
  }

  // category를 null로 설정하여 타입 호환
  const postsWithCategory = (data || []).map(post => ({
    ...post,
    category: null
  }))

  return {
    posts: postsWithCategory as PostWithCategory[],
    total: count || 0,
  }
}
