-- ============================================
-- Posts 테이블 구조 업데이트
-- 카테고리 제거 및 tags 기반으로 변경
-- ============================================

-- Step 1: category_id 컬럼 제거
ALTER TABLE public.posts
DROP COLUMN IF EXISTS category_id;

-- Step 2: 최종 posts 테이블 구조 확인을 위한 CREATE TABLE 문
-- (참고용 - 이미 테이블이 있으므로 실행하지 마세요)

/*
CREATE TABLE public.posts (
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

  -- 이미지
  images text[] NULL DEFAULT '{}'::text[],

  -- 태그 (카테고리 대신 사용)
  tags text[] NULL DEFAULT '{}'::text[],

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
  CONSTRAINT posts_authorId_fkey FOREIGN KEY ("authorId") REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT posts_blog_key_fkey FOREIGN KEY (blog_key) REFERENCES blog_settings (blog_key) ON DELETE CASCADE,
  CONSTRAINT posts_contentFormat_check CHECK (
    "contentFormat" = ANY (ARRAY['markdown'::text, 'richJson'::text, 'html'::text])
  )
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_blog_key ON posts(blog_key);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- 코멘트
COMMENT ON TABLE posts IS '블로그 포스트 (카테고리 없음, tags 기반)';
COMMENT ON COLUMN posts.blog_key IS '블로그 고유 식별자 (환경 변수 BLOG_KEY와 매칭)';
COMMENT ON COLUMN posts.tags IS '포스트 태그 배열 (예: ["신메뉴", "이벤트", "후기"])';
COMMENT ON COLUMN posts.slug IS 'URL용 슬러그 (예: my-first-post, introduction)';
*/

-- Step 3: 기존 인덱스 확인 및 추가
CREATE INDEX IF NOT EXISTS idx_posts_blog_key ON posts(blog_key);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- 완료
SELECT 'Posts 테이블 업데이트 완료!' as status;
