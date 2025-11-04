import Link from "next/link"
import Image from "next/image"
import { getBlogSettings, getPosts, getCategories } from "./actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Eye, Sparkles } from "lucide-react"
import { AdSidebar } from "@/components/shared/AdSidebar"

interface HomeProps {
  searchParams: Promise<{ category?: string; page?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const categorySlug = params.category
  const page = Number(params.page) || 1

  const [settings, { posts, total }, categories] = await Promise.all([
    getBlogSettings(),
    getPosts(categorySlug, page, 12),
    getCategories(),
  ])

  const totalPages = Math.ceil(total / 12)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {settings?.site_title || "Blog"}
                </h1>
                {settings?.site_description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{settings.site_description}</p>
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Categories Navigation */}
      {categories.length > 0 && (
        <div className="border-b bg-background/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-2">
              <Link href="/">
                <Badge
                  variant={!categorySlug ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-transform"
                >
                  All Posts
                </Badge>
              </Link>
              {categories.map((category) => (
                <Link key={category.id} href={`?category=${category.slug}`}>
                  <Badge
                    variant={categorySlug === category.slug ? "default" : "outline"}
                    className="cursor-pointer hover:scale-105 transition-transform"
                  >
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {posts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No posts yet</h2>
                <p className="text-muted-foreground text-lg">Check back soon for amazing content!</p>
              </div>
            ) : (
              <>
                {/* Featured Post (첫 번째 포스트) */}
                {page === 1 && !categorySlug && posts.length > 0 && (
                  <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Featured Post</h2>
                </div>
                <Link href={`/posts/${posts[0].slug}`}>
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50">
                    <div className="grid md:grid-cols-2 gap-0">
                      {posts[0].og_image && (
                        <div className="relative h-64 md:h-full">
                          <Image
                            src={posts[0].og_image}
                            alt={posts[0].title}
                            fill
                            className="object-cover"
                            priority
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      )}
                      <div className="p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4">
                          {posts[0].category && (
                            <Badge variant="secondary" className="text-sm">
                              {posts[0].category.name}
                            </Badge>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(posts[0].published_at || posts[0].created_at).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                        <h3 className="text-3xl font-bold mb-4 line-clamp-2 hover:text-primary transition-colors">
                          {posts[0].title}
                        </h3>
                        {posts[0].excerpt && (
                          <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                            {posts[0].excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {posts[0].view_count} views
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            )}

            {/* Post Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.slice(page === 1 && !categorySlug ? 1 : 0).map((post) => (
                <Link key={post.id} href={`/posts/${post.slug}`}>
                  <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group border hover:border-primary/50">
                    {post.og_image && (
                      <div className="relative w-full h-52 overflow-hidden">
                        <Image
                          src={post.og_image}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {post.category && (
                          <Badge variant="secondary" className="text-xs">
                            {post.category.name}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.published_at || post.created_at).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    {post.excerpt && (
                      <CardContent>
                        <CardDescription className="line-clamp-2">
                          {post.excerpt}
                        </CardDescription>
                        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          {post.view_count} views
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                {page > 1 && (
                  <Button variant="outline" asChild>
                    <Link
                      href={`?${new URLSearchParams({ ...(categorySlug && { category: categorySlug }), page: String(page - 1) })}`}
                    >
                      Previous
                    </Link>
                  </Button>
                )}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = page > 3 ? page - 2 + i : i + 1
                    if (pageNum > totalPages) return null
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "ghost"}
                        size="sm"
                        asChild
                      >
                        <Link
                          href={`?${new URLSearchParams({ ...(categorySlug && { category: categorySlug }), page: String(pageNum) })}`}
                        >
                          {pageNum}
                        </Link>
                      </Button>
                    )
                  })}
                </div>
                {page < totalPages && (
                  <Button variant="outline" asChild>
                    <Link
                      href={`?${new URLSearchParams({ ...(categorySlug && { category: categorySlug }), page: String(page + 1) })}`}
                    >
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            )}
              </>
            )}
          </div>

          {/* Sidebar with Ads */}
          {settings?.adsense_enabled && settings.adsense_sidebar_slot && (
            <AdSidebar
              adSlot={settings.adsense_sidebar_slot}
              className="hidden lg:block lg:w-80 flex-shrink-0"
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg">{settings?.site_title || "Blog"}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {settings?.site_description || "AI-powered blog platform"}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2">
                {categories.slice(0, 5).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`?category=${category.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <p className="text-sm text-muted-foreground mb-4">
                This blog is powered by AI and automatically generates high-quality content daily.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span>Powered by Gemini AI & Unsplash</span>
              </div>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {settings?.site_title || "Blog"}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
