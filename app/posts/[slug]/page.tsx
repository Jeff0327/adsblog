import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPostBySlug, getAdjacentPosts } from "./actions"
import { getBlogSettings } from "@/app/actions"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Eye, Tag } from "lucide-react"
import { AdSidebar } from "@/components/shared/AdSidebar"
import { InArticleAd } from "@/components/shared/InArticleAd"

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
      publishedTime: post.published_at || undefined,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const [{ prev, next }, settings] = await Promise.all([
    getAdjacentPosts(post.id, post.category_id),
    getBlogSettings(),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
          {/* Article */}
          <article className="flex-1 min-w-0">
        {/* Featured Image with Overlay */}
        {post.og_image && (
          <div className="relative w-full h-[500px] mb-12 rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={post.og_image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                {post.category && (
                  <Badge className="bg-white/90 text-foreground hover:bg-white">
                    {post.category.name}
                  </Badge>
                )}
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.published_at || post.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex items-center gap-1 text-sm text-white/90">
                  <Eye className="w-4 h-4" />
                  {post.view_count} views
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {post.title}
              </h1>
            </div>
          </div>
        )}

        {/* No Image Layout */}
        {!post.og_image && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              {post.category && <Badge className="text-sm">{post.category.name}</Badge>}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(post.published_at || post.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                {post.view_count} views
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {post.title}
            </h1>
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <div className="bg-muted/50 border-l-4 border-primary p-6 rounded-lg mb-12">
            <p className="text-lg text-muted-foreground leading-relaxed italic">
              {post.excerpt}
            </p>
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg prose-slate dark:prose-invert max-w-none mb-12
                     prose-headings:font-bold prose-headings:tracking-tight
                     prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                     prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                     prose-p:leading-relaxed prose-p:mb-6
                     prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                     prose-img:rounded-xl prose-img:shadow-lg
                     prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                     prose-pre:bg-muted prose-pre:border"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* In-Article Ad */}
        {settings?.adsense_enabled && settings.adsense_in_article_slot && (
          <InArticleAd adSlot={settings.adsense_in_article_slot} />
        )}

        {/* Post Images Gallery */}
        {post.images && post.images.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Tag className="w-6 h-6 text-primary" />
              Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {post.images.map((image) => (
                <div key={image.id} className="relative w-full h-80 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow group">
                  <Image
                    src={image.image_url}
                    alt={image.alt_text || post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {post.seo_keywords && post.seo_keywords.length > 0 && (
          <div className="mb-12 pb-12 border-b">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.seo_keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="text-sm">
                  #{keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Adjacent Posts Navigation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Continue Reading</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prev ? (
              <Link href={`/posts/${prev.slug}`}>
                <Card className="h-full hover:shadow-xl hover:border-primary/50 transition-all duration-300 group">
                  <CardHeader className="space-y-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <ArrowLeft className="w-3 h-3" />
                      Previous
                    </div>
                    <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {prev.title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ) : (
              <div className="hidden md:block" />
            )}

            {next ? (
              <Link href={`/posts/${next.slug}`}>
                <Card className="h-full hover:shadow-xl hover:border-primary/50 transition-all duration-300 group">
                  <CardHeader className="space-y-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-end gap-2">
                      Next
                      <ArrowLeft className="w-3 h-3 rotate-180" />
                    </div>
                    <CardTitle className="text-base line-clamp-2 text-right group-hover:text-primary transition-colors">
                      {next.title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>
        </div>
          </article>

          {/* Sidebar with Ads */}
          {settings?.adsense_enabled && settings.adsense_sidebar_slot && (
            <AdSidebar
              adSlot={settings.adsense_sidebar_slot}
              className="hidden lg:block lg:w-80 flex-shrink-0 sticky top-24 self-start"
            />
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/50 border-y mt-16">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Enjoyed this post?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Explore more articles and discover new insights on our blog
          </p>
          <Button asChild size="lg">
            <Link href="/">Browse All Posts</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
