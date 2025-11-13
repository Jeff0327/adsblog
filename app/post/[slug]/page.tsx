import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPostBySlug, getRecentPosts } from "./actions"
import { getBlogSettings } from "@/app/actions"
import { Calendar, Eye, Home, ArrowLeft, Clock } from "lucide-react"

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: "Post Not Found",
    }
  }

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    keywords: post.seo_keywords || undefined,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || undefined,
      images: post.og_image ? [post.og_image] : undefined,
      type: "article",
      publishedTime: post.created_at || undefined,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const [post, settings, recentPosts] = await Promise.all([
    getPostBySlug(slug),
    getBlogSettings(),
    getRecentPosts(10)
  ])

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen dark:bg-gray-900">
      {/* Header with Back Button */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">뒤로</span>
            </Link>
            <div className="flex-1" />
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">{settings?.site_title || "홈"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout - 2 Column */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Main Content */}
          <article className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Featured Image */}
            {post.og_image && (
              <div className="relative w-full h-[400px] overflow-hidden bg-gray-200 dark:bg-gray-800">
                <Image
                  src={post.og_image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            )}

            {/* Post Header */}
            <header className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-800">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={post.created_at!}>
                    {new Date(post.created_at!).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>{post.view_count}</span>
                </div>
              </div>
            </header>

            {/* Post Content */}
            <div className="p-6 sm:p-8">
              {/* Excerpt */}
              {post.excerpt && (
                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 rounded-r">
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              )}

              {/* Main Content */}
              <div
                className="prose prose-base prose-gray dark:prose-invert max-w-none
                           prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                           prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                           prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                           prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
                           prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                           prose-strong:text-gray-900 dark:prose-strong:text-white
                           prose-img:rounded-lg prose-img:shadow-md prose-img:my-6
                           prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:text-sm
                           prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-lg
                           prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:py-1 prose-blockquote:px-4"
                dangerouslySetInnerHTML={{ __html: post.content! }}
              />
            </div>

            {/* Post Images Gallery */}
            {post.images && post.images.length > 0 && (
              <div className="px-6 sm:px-8 pb-8">
                <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    이미지 갤러리
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {post.images.map((imageUrl, idx) => (
                      <div key={idx} className="relative w-full h-64 overflow-hidden rounded-lg shadow group">
                        <Image
                          src={imageUrl}
                          alt={`${post.title} - 이미지 ${idx + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Back to List */}
            <div className="px-6 sm:px-8 pb-6 border-t border-gray-200 dark:border-gray-800 pt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                목록으로 돌아가기
              </Link>
            </div>
          </article>

          {/* Right Column - Sidebar (Sticky) */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Recent Posts */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  최근 글
                </h3>
                <div className="space-y-4">
                  {recentPosts.map((recentPost) => (
                    <Link
                      key={recentPost.id}
                      href={`/post/${recentPost.slug}`}
                      className="group block"
                    >
                      <div className="flex gap-3">
                        {recentPost.og_image && (
                          <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded bg-gray-200 dark:bg-gray-800">
                            <Image
                              src={recentPost.og_image}
                              alt={recentPost.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-1">
                            {recentPost.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                            <time dateTime={recentPost.created_at!}>
                              {new Date(recentPost.created_at!).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </time>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Eye className="w-3 h-3" />
                              {recentPost.view_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Blog Info */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  {settings?.site_title}
                </h3>
                {settings?.site_description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {settings.site_description}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} {settings?.site_title || "Blog"}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ISR: Revalidate every 10 minutes (600 seconds)
export const revalidate = 600
