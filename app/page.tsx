import Link from "next/link"
import Image from "next/image"
import { getBlogSettings, getPosts } from "./actions"
import { Calendar, Eye, ArrowRight } from "lucide-react"

interface HomeProps {
  searchParams: Promise<{ page?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const page = Number(params.page) || 1

  const [settings, { posts, total }] = await Promise.all([
    getBlogSettings(),
    getPosts(undefined, page, 9),
  ])

  const totalPages = Math.ceil(total / 9)

  return (
    <div className="bg-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Link href="/" className="inline-block group">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 group-hover:from-blue-500 group-hover:to-purple-500 transition-all">
                {settings?.site_title || "Blog"}
              </h1>
            </Link>
            {settings?.site_description && (
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {settings.site_description}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl min-h-screen mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">포스트가 없습니다</h2>
            <p className="text-gray-600 dark:text-gray-400">첫 포스트를 작성해보세요!</p>
          </div>
        ) : (
          <>
            {/* Post Grid - Modern Card Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {posts.map((post) => (
                <article key={post.id} className="group">
                  <Link href={`/post/${post.slug}`} className="block">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transform hover:-translate-y-1">
                      {/* Thumbnail */}
                      {post.og_image && (
                        <div className="relative w-full h-56 overflow-hidden bg-gray-200 dark:bg-gray-800">
                          <Image
                            src={post.og_image}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                          {post.title}
                        </h2>

                        {post.excerpt && (
                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 text-sm leading-relaxed">
                            {post.excerpt}
                          </p>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <time dateTime={post.created_at!}>
                                {new Date(post.created_at!).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </time>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{post.view_count}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* Pagination - Modern Style */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-16">
                {page > 1 && (
                  <Link
                    href={`?page=${page - 1}`}
                    className="px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all font-medium text-sm shadow-sm"
                  >
                    ← 이전
                  </Link>
                )}

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = page > 3 ? page - 2 + i : i + 1
                    if (pageNum > totalPages) return null
                    return (
                      <Link
                        key={pageNum}
                        href={`?page=${pageNum}`}
                        className={`w-11 h-11 flex items-center justify-center rounded-lg font-semibold text-sm transition-all shadow-sm ${
                          pageNum === page
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}
                </div>

                {page < totalPages && (
                  <Link
                    href={`?page=${page + 1}`}
                    className="px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all font-medium text-sm shadow-sm"
                  >
                    다음 →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer - Modern */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} {settings?.site_title || "Blog"}. All rights reserved.
            </p>
            {settings?.site_description && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{settings.site_description}</p>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

// ISR: Revalidate every 10 minutes (600 seconds)
export const revalidate = 600
