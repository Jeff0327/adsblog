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

  let query = supabase
    .from('posts')
    .select(
      `
      *,
      category:categories(*)
    `,
      { count: 'exact' }
    )
    .eq('published', true)
    .order('published_at', { ascending: false })

  if (categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('blog_key', BLOG_KEY)
      .single()

    if (category) {
      query = query.eq('category_id', category.id)
    }
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching posts:', error)
    return { posts: [], total: 0 }
  }

  return {
    posts: (data || []) as PostWithCategory[],
    total: count || 0,
  }
}

export async function getCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('blog_key', BLOG_KEY)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data
}
