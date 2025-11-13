# 최종 데이터베이스 스키마 및 변경 사항

## 📋 완료된 변경 사항

### 1. ✅ TypeScript 타입 정의 업데이트 (`types/database.types.ts`)

DB 스키마와 완전히 일치하도록 수정:

```typescript
// BlogSettings - DB 필드와 1:1 매칭
export interface BlogSettings {
  id: string
  blog_key: string
  userId: string | null
  site_title: string
  site_description: string | null
  site_url: string | null
  keywords: string[] | null
  adsense_enabled: boolean | null
  adsense_client_id: string | null
  content_style: string | null
  is_public: boolean | null
  isActive: boolean | null
  businessName: string | null
  businessDescription: string | null
  promotionGoal: string | null
  productInfo: Record<string, unknown> | null
  postsPerDay: number | null
  imagesPerPost: number | null
  postingEnabled: boolean | null
  lastPostedAt: string | null
  industry: string | null
  brandInfo: {...} | null
  promptSettings: {...} | null
  created_at: string | null
  updated_at: string | null
}

// Post - category_id 제거, tags 추가
export interface Post {
  id: string
  blog_key: string
  authorId: string | null
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  richContent: Record<string, unknown> | null
  contentFormat: string | null
  images: string[] | null      // ⭐ text[] 배열
  tags: string[] | null         // ⭐ 카테고리 대신 태그
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[] | null
  og_image: string | null
  published: boolean | null
  published_at: string | null
  view_count: number | null
  created_at: string | null
  updated_at: string | null
}
```

### 2. ✅ Post Actions 수정 (`app/post/[slug]/actions.ts`)

- ❌ 제거: `category:categories(*)` join
- ❌ 제거: `images:post_images(*)` join
- ✅ 단순화: `select('*')` 사용
- ✅ `getAdjacentPosts`: 카테고리 필터링 제거

### 3. ✅ Post 페이지 수정 (`app/post/[slug]/page.tsx`)

- ✅ `post.images`를 `string[]`로 처리
- ✅ `imageUrl` 직접 사용 (post_images 테이블 제거)

### 4. ✅ 카테고리 완전 제거

- ❌ `app/category` 디렉토리 삭제
- ❌ `types/database.types.ts`에서 `Category` 타입 제거
- ❌ `app/actions.ts`에서 `getCategories()` 제거
- ❌ `app/sitemap.ts`에서 카테고리 URL 제거

---

## 🗄️ 최종 데이터베이스 스키마

### `blog_settings` 테이블

```sql
CREATE TABLE public.blog_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  blog_key text NOT NULL,                    -- ⭐ 블로그 고유 키
  "userId" uuid NULL,

  -- 사이트 기본 정보
  site_title text NOT NULL DEFAULT 'My Blog'::text,
  site_description text NULL,
  site_url text NULL,
  keywords text[] NULL DEFAULT '{}'::text[],

  -- AdSense
  adsense_enabled boolean NULL DEFAULT false,
  adsense_client_id text NULL,

  -- 콘텐츠 & 상태
  content_style text NULL DEFAULT 'professional'::text,
  is_public boolean NULL DEFAULT true,
  "isActive" boolean NULL DEFAULT true,

  -- 비즈니스 정보
  "businessName" text NULL,
  "businessDescription" text NULL,
  "promotionGoal" text NULL,
  "productInfo" jsonb NULL,

  -- 자동 포스팅 설정
  "postsPerDay" integer NULL DEFAULT 2,
  "imagesPerPost" integer NULL DEFAULT 3,
  "postingEnabled" boolean NULL DEFAULT true,
  "lastPostedAt" timestamp with time zone NULL,

  -- 마케팅 & AI
  industry text NULL,                        -- ⭐ 산업 분야
  "brandInfo" jsonb NULL,                    -- ⭐ 브랜딩 정보
  "promptSettings" jsonb NULL,               -- ⭐ AI 프롬프트 설정

  -- 타임스탬프
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),

  -- 제약조건
  CONSTRAINT blog_settings_pkey PRIMARY KEY (id),
  CONSTRAINT blog_settings_blog_key_key UNIQUE (blog_key),
  CONSTRAINT blog_settings_userId_fkey FOREIGN KEY ("userId")
    REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT blog_settings_imagesPerPost_check
    CHECK ("imagesPerPost" >= 2 AND "imagesPerPost" <= 4),
  CONSTRAINT blog_settings_postsPerDay_check
    CHECK ("postsPerDay" >= 0 AND "postsPerDay" <= 10)
);

-- 인덱스
CREATE INDEX idx_blog_settings_userid ON blog_settings("userId");
CREATE INDEX idx_blog_settings_blog_key ON blog_settings(blog_key);
CREATE INDEX idx_blog_settings_userId_active ON blog_settings("userId", "isActive");
CREATE INDEX idx_blog_settings_posting_enabled ON blog_settings("postingEnabled")
  WHERE "postingEnabled" = true;
```

### `posts` 테이블 (최종)

```sql
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  blog_key text NOT NULL,                    -- ⭐ 블로그 고유 키
  "authorId" uuid NULL,

  -- 기본 정보
  title text NOT NULL,
  slug text NOT NULL,                        -- ⭐ URL용 (예: my-first-post)
  content text NULL DEFAULT ''::text,
  excerpt text NULL,

  -- 콘텐츠 형식
  "richContent" jsonb NULL,
  "contentFormat" text NULL DEFAULT 'richJson'::text,

  -- 이미지 & 태그
  images text[] NULL DEFAULT '{}'::text[],   -- ⭐ 이미지 URL 배열
  tags text[] NULL DEFAULT '{}'::text[],     -- ⭐ 태그 배열 (카테고리 대신)

  -- SEO
  seo_title text NULL,
  seo_description text NULL,
  seo_keywords text[] NULL DEFAULT '{}'::text[],
  og_image text NULL,

  -- 상태
  published boolean NULL DEFAULT false,
  published_at timestamp with time zone NULL,
  view_count integer NULL DEFAULT 0,

  -- 타임스탬프
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),

  -- 제약조건
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_blog_key_slug_key UNIQUE (blog_key, slug),
  CONSTRAINT posts_authorId_fkey FOREIGN KEY ("authorId")
    REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT posts_blog_key_fkey FOREIGN KEY (blog_key)
    REFERENCES blog_settings (blog_key) ON DELETE CASCADE,
  CONSTRAINT posts_contentFormat_check CHECK (
    "contentFormat" = ANY (ARRAY['markdown'::text, 'richJson'::text, 'html'::text])
  )
);

-- 인덱스
CREATE INDEX idx_posts_blog_key ON posts(blog_key);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX idx_posts_slug ON posts(slug);
```

---

## 🚫 제거된 테이블/컬럼

### 1. ❌ `categories` 테이블 (완전 제거)
- 각 블로그는 단일 사업자용이므로 카테고리 불필요
- `tags` 배열로 대체

### 2. ❌ `post_images` 테이블 (제거)
- `posts.images` text[] 배열로 통합

### 3. ❌ `seo_keywords` 테이블 (제거)
- `blog_settings.keywords` 배열로 통합
- `posts.seo_keywords` 배열로 통합

### 4. ❌ `posts.category_id` 컬럼 (제거)
- `posts.tags` 배열로 대체

---

## 📝 중요 사항

### 1. Slug 형식
- ✅ 올바름: `my-first-post`, `introduction`, `getting-started`
- ❌ 잘못됨: `https://youtube.com`, `https://example.com/post`

**Slug 수정 SQL:**
```sql
-- 잘못된 slug 수정 예시
UPDATE posts
SET slug = 'youtube-video-guide'
WHERE slug LIKE 'https://%';
```

### 2. 필드명 주의
- **snake_case**: `blog_key`, `site_title`, `created_at`, `og_image` 등
- **camelCase**: `userId`, `authorId`, `businessName`, `richContent` 등
- TypeScript 타입 정의가 DB와 **정확히 일치**해야 함

### 3. 멀티 테넌트 필수 필터링
모든 쿼리에 `blog_key` 필터링 필수:

```typescript
.eq('blog_key', BLOG_KEY)  // ⭐ 필수!
```

---

## ✅ 체크리스트

- [x] TypeScript 타입 정의 업데이트
- [x] `posts` 테이블에서 `category_id` 제거
- [x] `posts.images`를 text[] 배열로 처리
- [x] `posts.tags` 추가
- [x] 카테고리 관련 코드 완전 제거
- [x] `app/post/[slug]` URL 구조로 변경
- [x] 모던한 UI 레이아웃 적용
- [x] 모든 쿼리에 `blog_key` 필터링 확인

---

## 🎉 완료!

이제 프로젝트는 다음과 같이 작동합니다:
- ✅ 카테고리 없음 (tags 기반)
- ✅ 단순한 URL 구조 (`/`, `/post/[slug]`)
- ✅ 멀티 테넌트 지원 (BLOG_KEY 환경 변수)
- ✅ 모던한 카드 레이아웃
- ✅ DB 스키마와 코드 완전 일치

**다음 단계:**
1. Supabase에서 slug 값 확인 및 수정
2. 테스트 포스트 작성
3. 개발 서버 확인: http://localhost:3001
