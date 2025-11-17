import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPostBySlug, getRecentPosts } from "./actions"
import { getBlogSettings } from "@/app/actions"
import { Calendar, ArrowLeft } from "lucide-react"
import Footer from "@/components/layout/Footer"
import SideContents from "@/components/post/SideContents"

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
    getRecentPosts(20, slug) // 현재 포스트 제외하고 가져오기
  ])

  if (!post) {
    notFound()
  }

  // Recent Posts를 두 그룹으로 분리
  const topRecentPosts = recentPosts.slice(0, 6) // sticky 영역: 상위 6개
  const moreRecentPosts = recentPosts.slice(6) // 스크롤 영역: 나머지

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="flex-1" />
            <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300 transition-colors">
              {settings?.site_title || 'Blog'}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <article className="flex-1">
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              {/* Featured Image */}
              {post.og_image && (
                <div className="relative w-full aspect-[21/9] bg-gray-700">
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

              <div className="p-8 md:p-12">
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
                  {post.title}
                </h1>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 pb-8 mb-8 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={post.created_at!}>
                      {new Date(post.created_at!).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                </div>

                {/* Excerpt */}
                {post.excerpt && (
                  <div className="mb-8 p-4 bg-blue-600/10 border-l-4 border-blue-600 rounded-r">
                    <p className="text-base text-gray-300 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                )}

                {/* Content */}
                <div
                  className="prose prose-invert prose-lg max-w-none
                    prose-headings:text-white prose-headings:font-bold
                    prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                    prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                    prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
                    prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-white prose-strong:font-semibold
                    prose-ul:my-6 prose-ol:my-6
                    prose-li:text-gray-300 prose-li:my-2
                    prose-img:rounded-lg prose-img:shadow-md
                    prose-code:text-blue-400 prose-code:bg-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-pre:bg-gray-950 prose-pre:text-gray-100 prose-pre:border prose-pre:border-gray-700
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-600/10 prose-blockquote:py-1 prose-blockquote:px-4"
                  dangerouslySetInnerHTML={{ __html: post.content || '' }}
                />

                {/* Images Gallery (기존 포스트 호환용 - content에 이미지가 없을 때만 표시) */}
                {post.images && post.images.length > 0 && !post.content?.includes('<img') && (
                  <div className="mt-12 pt-8 border-t border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-6">Images</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {post.images.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="relative aspect-video bg-gray-700 rounded-lg overflow-hidden"
                        >
                          <Image
                            src={imageUrl}
                            alt={`${post.title} - Image ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <SideContents
            topRecentPosts={topRecentPosts}
            moreRecentPosts={moreRecentPosts}
            settings={settings}
          />

        </div>
      </main>

      {/* Footer */}
      <Footer settings={settings} />
    </div>
  )
}

// ISR: Revalidate every 10 minutes (600 seconds)
export const revalidate = 600
