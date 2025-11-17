import { Calendar, Clock } from "lucide-react"
import Link from "next/link"
import type { BlogSettings } from "@/types/database.types"
import type { Post } from "@/types"

interface SideContentsProps {
  topRecentPosts: Post[]
  moreRecentPosts: Post[]
  settings: BlogSettings | null
}

export default function SideContents({ topRecentPosts, moreRecentPosts, settings }: SideContentsProps) {
  return (
    <aside className="lg:w-80 flex-shrink-0 space-y-3">
      <div className="sticky top-8 space-y-6">
        {/* Recent Posts */}
        {topRecentPosts.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
              <Clock className="w-5 h-5 text-blue-400" />
              Recent Posts
            </h3>
            <div className="space-y-3">
              {topRecentPosts.map((recentPost) => (
                <Link
                  key={recentPost.id}
                  href={`/post/${recentPost.slug}`}
                  className="block group"
                >
                  <div className="border-l-2 border-gray-700 pl-3 hover:border-blue-400 transition-colors">
                    <h4 className="font-medium text-gray-300 group-hover:text-blue-400 transition-colors line-clamp-2 text-sm leading-snug">
                      {recentPost.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      <time dateTime={recentPost.created_at!}>
                        {new Date(recentPost.created_at!).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Blog Info */}
        {settings && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-3">
              {settings.site_title}
            </h3>
            {settings.site_description && (
              <p className="text-sm text-gray-400 leading-relaxed">
                {settings.site_description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* More Recent Posts (스크롤 가능 영역) */}
      {moreRecentPosts.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            More Articles
          </h3>
          <div className="space-y-3">
            {moreRecentPosts.map((recentPost) => (
              <Link
                key={recentPost.id}
                href={`/post/${recentPost.slug}`}
                className="block group"
              >
                <div className="border-l-2 border-gray-700 pl-3 hover:border-blue-400 transition-colors">
                  <h4 className="font-medium text-gray-300 group-hover:text-blue-400 transition-colors line-clamp-2 text-sm leading-snug">
                    {recentPost.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    <time dateTime={recentPost.created_at!}>
                      {new Date(recentPost.created_at!).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}