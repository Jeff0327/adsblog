import Link from "next/link"
import Image from "next/image"
import { getBlogSettings, getPosts } from "./actions"
import { Calendar, Eye, Clock } from "lucide-react"

interface HomeProps {
  searchParams: Promise<{ page?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const page = Number(params.page) || 1

  const [settings, { posts, total }] = await Promise.all([
    getBlogSettings(),
    getPosts(undefined, page, 12),
  ])

  const totalPages = Math.ceil(total / 12)
  const featuredPost = posts[0]
  const latestPosts = posts.slice(1)

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Simple Header - No Menu, No Search */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-white hover:text-gray-300 transition-colors">
              {settings?.site_title || "The Creative Blog"}
            </h1>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">포스트가 없습니다</h2>
            <p className="text-gray-400">첫 포스트를 작성해보세요!</p>
          </div>
        ) : (
          <>
            {/* Hero Featured Post */}
            {featuredPost && (
              <section className="mb-12">
                <Link href={`/post/${featuredPost.slug}`} className="group block">
                  <div className="relative h-[500px] rounded-xl overflow-hidden">
                    {/* Background Image */}
                    {featuredPost.og_image && (
                      <Image
                        src={featuredPost.og_image}
                        alt={featuredPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        priority
                        unoptimized
                      />
                    )}

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">

                      {/* Title */}
                      <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-blue-400 transition-colors">
                        {featuredPost.title}
                      </h2>

                      {/* Excerpt */}
                      {featuredPost.excerpt && (
                        <p className="text-gray-300 text-lg mb-6 line-clamp-2 max-w-3xl">
                          {featuredPost.excerpt}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <time dateTime={featuredPost.created_at!}>
                            {new Date(featuredPost.created_at!).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </time>
                        </div>
                        {featuredPost.view_count !== null && featuredPost.view_count > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>8 min read</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* Latest Articles Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">Latest Articles</h2>
              </div>

              {/* Post Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {latestPosts.map((post) => (
                  <article key={post.id} className="group">
                    <Link href={`/post/${post.slug}`}>
                      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-300">
                        {/* Thumbnail */}
                        {post.og_image && (
                          <div className="relative w-full aspect-[16/10] bg-gray-700 overflow-hidden">
                            <Image
                              src={post.og_image}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              unoptimized
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-6">
                          {/* Category Badge */}
                          {post.tags && post.tags.length > 0 && (
                            <span className="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-semibold rounded mb-3">
                              {post.tags[0]}
                            </span>
                          )}

                          {/* Title */}
                          <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors leading-snug">
                            {post.title}
                          </h3>

                          {/* Excerpt */}
                          {post.excerpt && (
                            <p className="text-gray-400 mb-4 line-clamp-2 text-sm leading-relaxed">
                              {post.excerpt}
                            </p>
                          )}

                          {/* Meta Info */}
                          <div className="flex items-center gap-3 text-xs text-gray-500 pt-4 border-t border-gray-700">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <time dateTime={post.created_at!}>
                                {new Date(post.created_at!).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </time>
                            </div>
                            {post.view_count !== null && post.view_count > 0 && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{post.view_count.toLocaleString()}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  {page > 1 && (
                    <Link
                      href={`/?page=${page - 1}`}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:border-blue-500 transition-colors"
                    >
                      Previous
                    </Link>
                  )}

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(pageNum => {
                        const distance = Math.abs(pageNum - page)
                        return pageNum === 1 || pageNum === totalPages || distance <= 2
                      })
                      .map((pageNum, index, array) => {
                        const prevPageNum = array[index - 1]
                        const showEllipsis = prevPageNum && pageNum - prevPageNum > 1

                        return (
                          <div key={pageNum} className="flex items-center gap-2">
                            {showEllipsis && (
                              <span className="px-2 text-gray-600">...</span>
                            )}
                            <Link
                              href={`/?page=${pageNum}`}
                              className={`min-w-[40px] h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                                pageNum === page
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-blue-500'
                              }`}
                            >
                              {pageNum}
                            </Link>
                          </div>
                        )
                      })}
                  </div>

                  {page < totalPages && (
                    <Link
                      href={`/?page=${page + 1}`}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:border-blue-500 transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {settings?.site_title || "The Creative Blog"}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

// ISR: Revalidate every 10 minutes (600 seconds)
export const revalidate = 600
