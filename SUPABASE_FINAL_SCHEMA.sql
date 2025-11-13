-- ============================================
-- 최종 Supabase 스키마 (2025-01-13 업데이트)
-- ============================================
-- 이 파일은 실제 DB 구조와 100% 일치합니다.
-- published, published_at 필드 제거됨
-- ============================================

-- ============================================
-- 1. blog_settings 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS public.blog_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  blog_key text NOT NULL,
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
  industry text NULL,
  "brandInfo" jsonb NULL,
  "promptSettings" jsonb NULL,

  -- 타임스탬프
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),

  -- 제약조건
  CONSTRAINT blog_settings_pkey PRIMARY KEY (id),
  CONSTRAINT blog_settings_blog_key_key UNIQUE (blog_key),
  CONSTRAINT blog_settings_userId_fkey FOREIGN KEY ("userId")
    REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT blog_settings_imagesPerPost_check CHECK (
    ("imagesPerPost" >= 2) AND ("imagesPerPost" <= 4)
  ),
  CONSTRAINT blog_settings_postsPerDay_check CHECK (
    ("postsPerDay" >= 0) AND ("postsPerDay" <= 10)
  )
) TABLESPACE pg_default;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_blog_settings_userid
  ON public.blog_settings USING btree ("userId");

CREATE INDEX IF NOT EXISTS idx_blog_settings_blog_key
  ON public.blog_settings USING btree (blog_key);

CREATE INDEX IF NOT EXISTS "idx_blog_settings_userId_active"
  ON public.blog_settings USING btree ("userId", "isActive");

CREATE INDEX IF NOT EXISTS idx_blog_settings_posting_enabled
  ON public.blog_settings USING btree ("postingEnabled")
  WHERE ("postingEnabled" = true);

-- ============================================
-- 2. posts 테이블 (⭐ published, published_at 제거됨)
-- ============================================

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  blog_key text NOT NULL,
  "authorId" uuid NULL,

  -- 기본 정보
  title text NOT NULL,
  slug text NOT NULL,
  content text NULL DEFAULT ''::text,
  excerpt text NULL,

  -- 콘텐츠 형식
  "richContent" jsonb NULL,
  "contentFormat" text NULL DEFAULT 'richJson'::text,

  -- 이미지 & 태그
  images text[] NULL DEFAULT '{}'::text[],
  tags text[] NULL DEFAULT '{}'::text[],

  -- SEO
  seo_title text NULL,
  seo_description text NULL,
  seo_keywords text[] NULL DEFAULT '{}'::text[],
  og_image text NULL,

  -- 상태 (⭐ published, published_at 제거됨)
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
) TABLESPACE pg_default;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_blog_key
  ON public.posts USING btree (blog_key);

CREATE INDEX IF NOT EXISTS idx_posts_created_at
  ON public.posts USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_tags
  ON public.posts USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_posts_slug
  ON public.posts USING btree (slug);

-- ============================================
-- 필드명 참고
-- ============================================

/*
blog_settings:
  - snake_case: id, blog_key, site_title, site_description, site_url, keywords,
                adsense_enabled, adsense_client_id, content_style, is_public,
                industry, created_at, updated_at
  - camelCase: userId, businessName, businessDescription, promotionGoal, productInfo,
               postsPerDay, imagesPerPost, postingEnabled, lastPostedAt, isActive,
               brandInfo, promptSettings

posts:
  - snake_case: id, blog_key, title, slug, content, excerpt, images, tags,
                seo_title, seo_description, seo_keywords, og_image,
                view_count, created_at, updated_at
  - camelCase: authorId, richContent, contentFormat
*/

-- ============================================
-- 중요 사항
-- ============================================

/*
1. slug 형식:
   - ✅ 올바름: 'my-first-post', 'introduction'
   - ❌ 잘못됨: 'https://youtube.com'

2. contentFormat 옵션:
   - 'markdown' | 'richJson' | 'html'
   - 기본값: 'richJson'

3. 배열 필드:
   - keywords: text[]
   - images: text[]
   - tags: text[]
   - seo_keywords: text[]

4. JSONB 필드:
   - productInfo
   - richContent
   - brandInfo
   - promptSettings

5. 멀티 테넌트:
   - 모든 쿼리에 blog_key 필터링 필수!

6. ⭐ 변경 사항 (2025-01-13):
   - posts 테이블에서 published, published_at 필드 제거
   - 모든 포스트는 생성 즉시 표시됨
   - 시간 순서는 created_at 기준
*/
