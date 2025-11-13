# 독립 블로그 프론트엔드 프로젝트 가이드

## 📋 프로젝트 개요

AdHub의 Supabase DB를 바라보는 **독립 블로그 사이트**를 구축합니다.

### ⭐ 핵심 개념

- **각 블로그 = 1개 사업자 = 단일 홍보 블로그**
- **하나의 프로젝트 코드**를 여러 번 배포
- 각 배포마다 **다른 도메인 + 다른 BLOG_KEY 환경 변수**
- URL에 `[blogKey]` 없음! 환경 변수로 처리

### 배포 구조

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel/Netlify: 같은 코드, 다른 환경 변수                      │
├─────────────────────────────────────────────────────────────┤
│  배포 1: cafe-blog.com                                       │
│  환경 변수: BLOG_KEY=user123-cafe                            │
│  → cafe-blog.com/                   (블로그 홈)              │
│  → cafe-blog.com/post/new-menu      (포스트)                 │
│  → 모든 포스트: 카페 홍보 (#신메뉴, #이벤트, #후기)            │
├─────────────────────────────────────────────────────────────┤
│  배포 2: gym-fitness.com                                     │
│  환경 변수: BLOG_KEY=company-gym                             │
│  → gym-fitness.com/                 (블로그 홈)              │
│  → gym-fitness.com/post/workout-tips (포스트)                │
│  → 모든 포스트: 헬스장 홍보 (#운동팁, #회원후기, #시설소개)     │
├─────────────────────────────────────────────────────────────┤
│  배포 3: tech-startup.com                                    │
│  환경 변수: BLOG_KEY=startup-tech                            │
│  → tech-startup.com/                (블로그 홈)              │
│  → tech-startup.com/post/ai-trends  (포스트)                 │
│  → 모든 포스트: IT 회사 홍보 (#기술블로그, #제품소개, #채용)    │
└─────────────────────────────────────────────────────────────┘
```

### 장점

1. **완전히 독립된 도메인**: 각 블로그가 자기만의 도메인 소유
2. **간단한 URL 구조**: `/`, `/post/hello-world`
3. **쉬운 배포**: 같은 코드를 복사해서 환경 변수만 바꿔서 배포
4. **커스터마이징 용이**: 필요시 특정 블로그만 코드 수정 가능
5. **단순한 구조**: 각 블로그는 하나의 사업자를 위한 홍보 블로그

---

## 🗄️ Supabase DB 구조

### 1. `blog_settings` 테이블
블로그의 모든 정보와 설정을 저장합니다.

```sql
CREATE TABLE public.blog_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "blogKey" TEXT UNIQUE NOT NULL,  -- ⭐ 블로그 고유 식별자
  "userId" UUID,

  -- 기본 정보
  site_title TEXT NOT NULL,
  site_description TEXT,
  site_url TEXT,

  -- SEO 키워드 (자동 포스팅에 사용)
  keywords TEXT[] DEFAULT '{}',

  -- 산업 분야
  industry TEXT,  -- technology, food, health, finance 등

  -- 브랜딩 정보 (JSONB)
  "brandInfo" JSONB,
  -- {
  --   brandName: string           // 브랜드명
  --   coreValues: string[]        // 핵심 가치
  --   targetAudience: string      // 타겟 고객
  --   uniqueSellingPoints: string[] // 차별화 포인트
  --   brandVoice: string          // 브랜드 톤앤매너
  -- }

  -- AI 프롬프트 설정 (JSONB)
  "promptSettings" JSONB,
  -- {
  --   contentPrompt: string       // 콘텐츠 생성 프롬프트
  --   seoPrompt: string           // SEO 최적화 프롬프트
  --   model: string               // AI 모델
  --   temperature: number         // Temperature
  --   maxTokens: number           // Max Tokens
  -- }

  -- 상태
  "isActive" BOOLEAN DEFAULT true,

  -- 자동 포스팅 설정
  "postsPerDay" INTEGER DEFAULT 2,
  "imagesPerPost" INTEGER DEFAULT 3,
  "postingEnabled" BOOLEAN DEFAULT false,
  "lastPostedAt" TIMESTAMPTZ,

  -- 홍보 정보
  "businessName" TEXT,
  "businessDescription" TEXT,
  "promotionGoal" TEXT,
  "productInfo" JSONB,

  -- 광고
  "adsenseEnabled" BOOLEAN DEFAULT false,
  "adsenseClientId" TEXT,

  -- 스타일
  "contentStyle" TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2. `posts` 테이블
블로그 포스트를 저장합니다.

```sql
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_key TEXT NOT NULL,  -- ⭐ blogKey로 블로그 구분
  "authorId" UUID,

  -- 기본 정보
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  "richContent" JSONB,
  "contentFormat" TEXT DEFAULT 'markdown',

  -- 이미지
  images TEXT[] DEFAULT '{}',

  -- 태그 (간단한 분류용)
  tags TEXT[] DEFAULT '{}',  -- ⭐ 예: ["신메뉴", "이벤트", "후기"]

  -- SEO
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "seoKeywords" TEXT[] DEFAULT '{}',
  "ogImage" TEXT,

  -- 상태
  published BOOLEAN DEFAULT false,
  "publishedAt" TIMESTAMPTZ,
  "viewCount" INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(blog_key, slug)
);

CREATE INDEX idx_posts_blog_key ON posts(blog_key);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_published_at ON posts("publishedAt" DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
```

---

## 🏗️ 프로젝트 구조

```
my-blog/
├── app/
│   ├── page.tsx                      # 블로그 홈 (포스트 목록)
│   ├── layout.tsx                    # 레이아웃 (헤더, 푸터)
│   ├── post/
│   │   └── [slug]/
│   │       └── page.tsx              # 포스트 상세 페이지
│   ├── tag/
│   │   └── [tag]/
│   │       └── page.tsx              # 태그별 포스트 목록 (선택사항)
│   ├── sitemap.ts                    # sitemap.xml 생성
│   └── robots.ts                     # robots.txt 생성
├── components/
│   ├── BlogHeader.tsx                # 블로그 헤더
│   ├── PostCard.tsx                  # 포스트 카드
│   ├── TagCloud.tsx                  # 태그 클라우드 (선택사항)
│   └── Pagination.tsx                # 페이지네이션
├── lib/
│   ├── supabase.ts                   # Supabase 클라이언트
│   └── blog.ts                       # 블로그 데이터 조회 함수
├── types/
│   └── blog.types.ts                 # TypeScript 타입 정의
├── utils/
│   ├── seo.ts                        # SEO 헬퍼 함수
│   └── constants.ts                  # 상수 정의
└── .env.local
    ├── BLOG_KEY=user123-cafe         # ⭐ 이 블로그의 blogKey
    ├── NEXT_PUBLIC_SUPABASE_URL=...
    └── NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 📝 작업 순서

### Phase 1: 프로젝트 초기 설정
1. Next.js 프로젝트 생성
2. Supabase 클라이언트 설정
3. TypeScript 타입 정의
4. 환경 변수 설정 (BLOG_KEY 추가!)

### Phase 2: 블로그 홈 페이지
1. `app/page.tsx` 구현
2. 환경 변수에서 BLOG_KEY 가져오기
3. 블로그 설정 조회
4. 최신 포스트 목록 표시
5. 태그 클라우드 (선택사항)

### Phase 3: 포스트 상세 페이지
1. `app/post/[slug]/page.tsx` 구현
2. Markdown → HTML 렌더링
3. 이미지 최적화
4. SEO 메타 태그
5. 조회수 증가

### Phase 4: SEO 최적화
1. generateMetadata() 함수
2. sitemap.xml 생성
3. robots.txt 설정
4. Open Graph 이미지
5. JSON-LD 구조화 데이터

### Phase 5: 성능 최적화
1. ISR (Incremental Static Regeneration)
2. 이미지 최적화
3. 캐싱 전략
4. 폰트 최적화

---

## 🔧 상세 구현 가이드

### 1. 환경 변수 설정

```env
# .env.local
BLOG_KEY=user123-cafe                                      # ⭐ 이 블로그의 고유 식별자
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://cafe-blog.com
```

---

### 2. Supabase 클라이언트 설정

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})
```

---

### 3. 블로그 데이터 조회 헬퍼

```typescript
// lib/blog.ts
import { supabase } from './supabase'

// 환경 변수에서 BLOG_KEY 가져오기
const BLOG_KEY = process.env.BLOG_KEY!

if (!BLOG_KEY) {
  throw new Error('BLOG_KEY environment variable is not set!')
}

// 블로그 설정 조회
export async function getBlogSettings() {
  const { data, error } = await supabase
    .from('blog_settings')
    .select('*')
    .eq('blogKey', BLOG_KEY)
    .single()

  if (error) throw error
  return data
}

// 포스트 목록 조회 (페이지네이션)
export async function getPosts(page = 1, perPage = 10) {
  const { data, error, count } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('blog_key', BLOG_KEY)
    .eq('published', true)
    .order('publishedAt', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (error) throw error
  return { posts: data || [], total: count || 0 }
}

// 포스트 상세 조회
export async function getPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('blog_key', BLOG_KEY)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) throw error
  return data
}

// 태그별 포스트 조회 (선택사항)
export async function getPostsByTag(tag: string, page = 1, perPage = 10) {
  const { data, error, count } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('blog_key', BLOG_KEY)
    .contains('tags', [tag])  // tags 배열에 해당 태그 포함
    .eq('published', true)
    .order('publishedAt', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (error) throw error
  return { posts: data || [], total: count || 0 }
}

// 모든 태그 조회 (선택사항)
export async function getAllTags() {
  const { data, error } = await supabase
    .from('posts')
    .select('tags')
    .eq('blog_key', BLOG_KEY)
    .eq('published', true)

  if (error) throw error

  // 모든 태그를 추출하여 중복 제거
  const allTags = data?.flatMap(post => post.tags || []) || []
  return Array.from(new Set(allTags))
}

// 조회수 증가
export async function incrementViewCount(postId: string) {
  const { error } = await supabase.rpc('increment_view_count', {
    post_id: postId,
  })

  if (error) console.error('Failed to increment view count:', error)
}
```

---

### 4. TypeScript 타입 정의

```typescript
// types/blog.types.ts
export interface BlogSettings {
  id: string
  blogKey: string
  siteTitle: string
  siteDescription?: string
  siteUrl?: string
  keywords: string[]
  industry?: string
  brandInfo?: BrandInfo
  promptSettings?: PromptSettings
  isActive: boolean
  businessName?: string
  businessDescription?: string
  adsenseEnabled: boolean
  adsenseClientId?: string
  createdAt: string
  updatedAt: string
}

export interface BrandInfo {
  brandName?: string
  coreValues?: string[]
  targetAudience?: string
  uniqueSellingPoints?: string[]
  brandVoice?: string
}

export interface PromptSettings {
  contentPrompt?: string
  seoPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface Post {
  id: string
  blogKey: string
  title: string
  slug: string
  excerpt?: string
  content: string
  images: string[]
  tags: string[]  // ⭐ 태그 배열
  seoTitle?: string
  seoDescription?: string
  seoKeywords: string[]
  ogImage?: string
  published: boolean
  publishedAt?: string
  viewCount: number
  createdAt: string
  updatedAt: string
}
```

---

### 5. 블로그 홈 페이지

```typescript
// app/page.tsx
import { Metadata } from 'next'
import { getBlogSettings, getPosts } from '@/lib/blog'
import PostCard from '@/components/PostCard'
import Pagination from '@/components/Pagination'

interface Props {
  searchParams: Promise<{ page?: string }>
}

// SEO 메타데이터 생성
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBlogSettings()

  return {
    title: settings.siteTitle,
    description: settings.siteDescription || '',
    keywords: settings.keywords.join(', '),
    openGraph: {
      title: settings.siteTitle,
      description: settings.siteDescription || '',
      type: 'website',
    },
  }
}

export default async function HomePage({ searchParams }: Props) {
  const { page = '1' } = await searchParams
  const currentPage = parseInt(page)
  const postsPerPage = 10

  // 데이터 병렬 조회
  const [settings, { posts, total }] = await Promise.all([
    getBlogSettings(),
    getPosts(currentPage, postsPerPage),
  ])

  const totalPages = Math.ceil(total / postsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900">{settings.siteTitle}</h1>
          {settings.siteDescription && (
            <p className="text-gray-600 mt-2 text-lg">{settings.siteDescription}</p>
          )}
          {settings.brandInfo?.brandName && (
            <p className="text-gray-500 mt-1 text-sm">
              by {settings.brandInfo.brandName}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 메인: 포스트 목록 */}
        <main>
          <h2 className="text-2xl font-bold mb-6">최신 포스트</h2>

          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          )}
        </main>
      </div>
    </div>
  )
}

// ISR: 10분마다 재생성
export const revalidate = 600
```

---

### 6. 포스트 상세 페이지

```typescript
// app/post/[slug]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, incrementViewCount } from '@/lib/blog'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return { title: 'Post Not Found' }
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || '',
    keywords: post.seoKeywords.join(', '),
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || '',
      images: post.ogImage ? [{ url: post.ogImage }] : [],
      type: 'article',
      publishedTime: post.publishedAt || undefined,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  // 조회수 증가
  await incrementViewCount(post.id)

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* 포스트 헤더 */}
      <header className="mb-8">
        {post.ogImage && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <Image
              src={post.ogImage}
              alt={post.title}
              width={1200}
              height={630}
              className="w-full"
            />
          </div>
        )}

        <h1 className="text-4xl font-bold mb-4 text-gray-900">{post.title}</h1>

        <div className="flex items-center gap-4 text-gray-600 text-sm">
          <time dateTime={post.publishedAt || ''}>
            {new Date(post.publishedAt!).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <span>조회 {post.viewCount + 1}</span>
        </div>

        {/* 태그 */}
        {post.tags.length > 0 && (
          <div className="flex gap-2 mt-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* 포스트 내용 */}
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {/* 포스트 이미지 */}
      {post.images.length > 0 && (
        <div className="mt-12 grid grid-cols-2 gap-4">
          {post.images.map((img, idx) => (
            <div key={idx} className="rounded-lg overflow-hidden">
              <Image
                src={img}
                alt={`${post.title} - 이미지 ${idx + 1}`}
                width={600}
                height={400}
                className="w-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* 하단 네비게이션 */}
      <div className="mt-12 pt-8 border-t">
        <a href="/" className="text-blue-600 hover:underline">
          ← 블로그 홈으로 돌아가기
        </a>
      </div>
    </article>
  )
}

export const revalidate = 600
```

---

### 7. sitemap.xml 생성

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

const BLOG_KEY = process.env.BLOG_KEY!
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourblog.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 발행된 포스트 조회
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('blog_key', BLOG_KEY)
    .eq('published', true)

  const sitemap: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  // 포스트 페이지
  posts?.forEach((post) => {
    sitemap.push({
      url: `${BASE_URL}/post/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'weekly',
      priority: 0.9,
    })
  })

  return sitemap
}
```

---

### 8. robots.txt

```typescript
// app/robots.ts
import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourblog.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
```

---

## 🚀 배포 가이드

### Vercel 배포 (예시)

#### 1단계: 프로젝트 준비
```bash
# GitHub에 코드 푸시
git init
git add .
git commit -m "Initial blog setup"
git push origin main
```

#### 2단계: Vercel에서 배포 (cafe-blog.com)
1. Vercel 대시보드 → New Project
2. GitHub 저장소 선택
3. 환경 변수 설정:
   ```
   BLOG_KEY=user123-cafe
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=https://cafe-blog.com
   ```
4. 커스텀 도메인 연결: `cafe-blog.com`

#### 3단계: 같은 프로젝트를 다시 배포 (gym-fitness.com)
1. Vercel 대시보드 → New Project
2. 같은 GitHub 저장소 선택
3. 환경 변수 설정:
   ```
   BLOG_KEY=company-gym  ← 다른 blogKey!
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=https://gym-fitness.com
   ```
4. 커스텀 도메인 연결: `gym-fitness.com`

---

## ✅ 배포 체크리스트

- [ ] **Supabase RLS 정책 설정** (`SUPABASE_RLS_SETUP.md` 참고)
    - [ ] blog_settings, posts에 RLS 활성화
    - [ ] 읽기 정책 생성 (`published = true`만 허용)
    - [ ] 조회수 업데이트 정책 생성
- [ ] **환경 변수 설정**
    - [ ] `BLOG_KEY` (필수!)
    - [ ] `NEXT_PUBLIC_SUPABASE_URL`
    - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] ISR 설정 확인 (`revalidate = 600`)
- [ ] 이미지 최적화 (Next.js Image)
- [ ] SEO 메타 태그 확인
- [ ] sitemap.xml 생성 확인
- [ ] robots.txt 확인
- [ ] Open Graph 이미지 설정
- [ ] 커스텀 도메인 연결
- [ ] Google Analytics 연동 (선택)
- [ ] Google Search Console 등록

---

## 📌 주요 포인트

### 1. BLOG_KEY 환경 변수

**모든 데이터 조회는 BLOG_KEY로 필터링됩니다:**

```typescript
// ✅ 올바른 예시
const BLOG_KEY = process.env.BLOG_KEY!  // 환경 변수에서 가져오기

const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('blog_key', BLOG_KEY)  // ← 필수!
  .eq('published', true)

// ❌ 잘못된 예시
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)  // ← BLOG_KEY 필터링 누락! 모든 블로그 데이터가 섞임!
```

### 2. 같은 코드, 다른 배포

- 하나의 GitHub 저장소
- 여러 번 배포 (각각 다른 도메인 + BLOG_KEY)
- 각 배포는 완전히 독립적

### 3. URL 구조 (간단함!)

```
cafe-blog.com/                      ← 블로그 홈
cafe-blog.com/post/new-menu         ← 포스트
cafe-blog.com/post/special-event    ← 포스트
```

**카테고리 페이지 없음! 각 블로그는 단일 사업자용이므로 카테고리 불필요**

### 4. 태그 활용 (선택사항)

포스트를 간단하게 분류하고 싶다면 태그 사용:

```typescript
// 포스트에 태그 추가
const post = {
  title: "신메뉴 출시!",
  tags: ["신메뉴", "이벤트", "프로모션"]
}

// 태그별 조회 (선택사항)
const { posts } = await getPostsByTag("신메뉴")
```

### 5. DB는 Read-Only (Anon Key 사용)

- Supabase Anon Key로 접근 (로그인 불필요!)
- RLS 정책으로 보안: `published = true`인 포스트만 읽기
- 조회수 증가만 UPDATE 허용
- 나머지 쓰기/삭제는 AdHub에서만 가능

### 6. 자동 포스팅과의 연동

- 자동 포스팅 프로젝트 → DB에 포스트 INSERT (blogKey 지정)
- 블로그 사이트 → ISR로 10분마다 재생성하여 자동 반영
- AI가 blog_settings의 brandInfo와 promptSettings를 활용하여 콘텐츠 생성

---

## 💡 Claude에게 전달할 때

이 가이드와 `SUPABASE_RLS_SETUP.md`를 Claude에게 보여주며:

> "이 가이드를 보고 Supabase DB를 바라보는 독립 블로그 사이트를 만들어줘.
>
> 핵심 개념:
> - **환경 변수 BLOG_KEY로 블로그 구분** (URL에 [blogKey] 없음!)
> - 각 블로그는 **1개 사업자 = 단일 홍보 블로그**
> - 같은 코드를 여러 번 배포하되, 각 배포마다 다른 BLOG_KEY
> - 각 배포는 독립된 도메인 (cafe-blog.com, gym-fitness.com 등)
>
> 요구사항:
> - Next.js 15 App Router 사용
> - URL 구조: `/`, `/post/[slug]` (카테고리 페이지 없음!)
> - 완전한 SEO 최적화 (generateMetadata, sitemap, robots.txt)
> - ISR 설정으로 10분마다 재생성
> - 반응형 디자인 (Tailwind CSS)
> - Markdown 렌더링 (react-markdown)
> - 이미지 최적화 (Next.js Image)
>
> DB 구조:
> - blog_settings: 블로그 정보 + 브랜딩 + AI 프롬프트 + 홍보 정보 (모두 통합)
> - posts: 포스트 + SEO 메타데이터 + tags 배열
>
> 보안:
> - Supabase Anon Key 사용 (로그인 불필요)
> - RLS 정책으로 published = true인 포스트만 공개
> - 모든 쿼리는 반드시 BLOG_KEY로 필터링
>
> 환경 변수:
> - BLOG_KEY (필수!)
> - NEXT_PUBLIC_SUPABASE_URL
> - NEXT_PUBLIC_SUPABASE_ANON_KEY
> - NEXT_PUBLIC_SITE_URL"

---

## 🔗 참고 자료

- Next.js App Router: https://nextjs.org/docs/app
- Supabase JS Client: https://supabase.com/docs/reference/javascript
- Next.js SEO: https://nextjs.org/learn/seo/introduction-to-seo
- ISR: https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating
- Vercel 환경 변수: https://vercel.com/docs/projects/environment-variables
