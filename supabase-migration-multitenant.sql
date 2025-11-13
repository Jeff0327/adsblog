-- ============================================
-- 멀티테넌트 구조로 마이그레이션
-- ============================================
-- 이 마이그레이션은 단일 블로그 스키마를 멀티테넌트 구조로 변경합니다.
-- 여러 블로그의 데이터를 하나의 DB에 저장하고 blog_key로 구분합니다.
--
-- 실행 전 주의사항:
-- 1. 기존 데이터가 있다면 백업하세요
-- 2. 이 마이그레이션 후 기존 데이터에 blog_key를 할당해야 합니다
-- 3. Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. blog_settings 테이블 수정
-- ============================================

-- blog_key 컬럼 추가 (멀티테넌트의 핵심!)
ALTER TABLE blog_settings
ADD COLUMN IF NOT EXISTS blog_key TEXT;

-- 기존 데이터에 기본 blog_key 할당 (한 번만 실행됨)
UPDATE blog_settings
SET blog_key = 'default'
WHERE blog_key IS NULL;

-- blog_key를 NOT NULL로 변경
ALTER TABLE blog_settings
ALTER COLUMN blog_key SET NOT NULL;

-- blog_key에 UNIQUE 제약조건 추가
ALTER TABLE blog_settings
ADD CONSTRAINT blog_settings_blog_key_unique UNIQUE (blog_key);

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_blog_settings_blog_key ON blog_settings(blog_key);

-- AdSense 관련 컬럼 추가
ALTER TABLE blog_settings
ADD COLUMN IF NOT EXISTS adsense_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adsense_client_id TEXT,
ADD COLUMN IF NOT EXISTS adsense_sidebar_slot TEXT,
ADD COLUMN IF NOT EXISTS adsense_in_article_slot TEXT;

-- 마케팅 관련 컬럼 추가
ALTER TABLE blog_settings
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS marketing_goal TEXT,
ADD COLUMN IF NOT EXISTS target_keywords TEXT[],
ADD COLUMN IF NOT EXISTS content_style TEXT;

-- ============================================
-- 2. categories 테이블 수정
-- ============================================

-- blog_key 컬럼 추가
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS blog_key TEXT;

-- 기존 데이터에 blog_key 할당
UPDATE categories
SET blog_key = 'default'
WHERE blog_key IS NULL;

-- blog_key를 NOT NULL로 변경
ALTER TABLE categories
ALTER COLUMN blog_key SET NOT NULL;

-- UNIQUE 제약조건 변경: (slug) → (blog_key, slug)
-- 1. 기존 UNIQUE 제약조건 제거
ALTER TABLE categories
DROP CONSTRAINT IF EXISTS categories_slug_key;

-- 2. 새로운 복합 UNIQUE 제약조건 추가
ALTER TABLE categories
ADD CONSTRAINT categories_blog_key_slug_unique UNIQUE (blog_key, slug);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_categories_blog_key ON categories(blog_key);

-- 마케팅/브랜딩 컬럼 추가 (BLOG_PROJECT_GUIDE.md 참고)
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS brand_info JSONB,
ADD COLUMN IF NOT EXISTS prompt_settings JSONB;

-- ============================================
-- 3. posts 테이블 수정
-- ============================================

-- blog_key 컬럼 추가
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS blog_key TEXT;

-- 기존 데이터에 blog_key 할당
-- (카테고리를 통해 blog_key 가져오기)
UPDATE posts
SET blog_key = (
  SELECT c.blog_key
  FROM categories c
  WHERE c.id = posts.category_id
)
WHERE blog_key IS NULL AND category_id IS NOT NULL;

-- 카테고리가 없는 포스트는 기본값 할당
UPDATE posts
SET blog_key = 'default'
WHERE blog_key IS NULL;

-- blog_key를 NOT NULL로 변경
ALTER TABLE posts
ALTER COLUMN blog_key SET NOT NULL;

-- UNIQUE 제약조건 변경: (slug) → (blog_key, slug)
-- 1. 기존 UNIQUE 제약조건 제거
ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_slug_key;

-- 2. 새로운 복합 UNIQUE 제약조건 추가
ALTER TABLE posts
ADD CONSTRAINT posts_blog_key_slug_unique UNIQUE (blog_key, slug);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_posts_blog_key ON posts(blog_key);
CREATE INDEX IF NOT EXISTS idx_posts_blog_key_published ON posts(blog_key, published, published_at DESC);

-- ============================================
-- 4. seo_keywords 테이블 수정
-- ============================================

-- blog_key 컬럼 추가
ALTER TABLE seo_keywords
ADD COLUMN IF NOT EXISTS blog_key TEXT;

-- 기존 데이터에 blog_key 할당
UPDATE seo_keywords
SET blog_key = 'default'
WHERE blog_key IS NULL;

-- blog_key를 NOT NULL로 변경
ALTER TABLE seo_keywords
ALTER COLUMN blog_key SET NOT NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_seo_keywords_blog_key ON seo_keywords(blog_key);

-- ============================================
-- 5. RLS 정책 업데이트
-- ============================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "Public read access for blog_settings" ON blog_settings;
DROP POLICY IF EXISTS "Public read access for categories" ON categories;
DROP POLICY IF EXISTS "Public read access for published posts" ON posts;
DROP POLICY IF EXISTS "Public read access for post_images" ON post_images;
DROP POLICY IF EXISTS "Public read access for seo_keywords" ON seo_keywords;

-- 새로운 RLS 정책 생성 (멀티테넌트 대응)

-- blog_settings: 모든 블로그 설정 공개 (blog_key 상관없이)
CREATE POLICY "Public read all blog settings"
ON blog_settings FOR SELECT
USING (true);

-- categories: 모든 카테고리 공개
CREATE POLICY "Public read all categories"
ON categories FOR SELECT
USING (true);

-- posts: published = true인 포스트만 공개
CREATE POLICY "Public read published posts only"
ON posts FOR SELECT
USING (published = true);

-- posts: 조회수 업데이트 허용 (published = true만)
CREATE POLICY "Allow view count update for published posts"
ON posts FOR UPDATE
USING (published = true)
WITH CHECK (published = true);

-- post_images: 모든 이미지 공개
CREATE POLICY "Public read all post images"
ON post_images FOR SELECT
USING (true);

-- seo_keywords: 모든 키워드 공개
CREATE POLICY "Public read all seo keywords"
ON seo_keywords FOR SELECT
USING (true);

-- ============================================
-- 6. 검증 쿼리
-- ============================================

-- 마이그레이션 결과 확인
SELECT
  'blog_settings' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'blog_settings'
AND column_name IN ('blog_key', 'adsense_enabled', 'business_name')

UNION ALL

SELECT
  'categories' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
AND column_name IN ('blog_key', 'industry', 'brand_info', 'prompt_settings')

UNION ALL

SELECT
  'posts' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
AND column_name = 'blog_key'

UNION ALL

SELECT
  'seo_keywords' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'seo_keywords'
AND column_name = 'blog_key';

-- ============================================
-- 7. 샘플 데이터 (선택사항)
-- ============================================

-- 테스트용 블로그 2개 생성 예시 (주석 처리됨)
/*
-- 첫 번째 블로그
INSERT INTO blog_settings (
  blog_key,
  site_title,
  site_description,
  site_url,
  adsense_enabled,
  business_name,
  content_style
) VALUES (
  'tech-blog-2024',
  'Tech Insights',
  'Latest technology trends and tutorials',
  'https://techblog.example.com',
  true,
  'TechCorp Inc.',
  'professional'
) ON CONFLICT (blog_key) DO NOTHING;

-- 두 번째 블로그
INSERT INTO blog_settings (
  blog_key,
  site_title,
  site_description,
  site_url,
  business_name,
  content_style
) VALUES (
  'food-blog-2024',
  'Delicious Recipes',
  'Home cooking and restaurant reviews',
  'https://foodblog.example.com',
  'Food Lovers Network',
  'casual'
) ON CONFLICT (blog_key) DO NOTHING;

-- 각 블로그에 카테고리 추가
INSERT INTO categories (blog_key, name, slug, order_index) VALUES
('tech-blog-2024', 'Web Development', 'web-dev', 1),
('tech-blog-2024', 'AI & Machine Learning', 'ai-ml', 2),
('food-blog-2024', 'Asian Cuisine', 'asian', 1),
('food-blog-2024', 'Desserts', 'desserts', 2)
ON CONFLICT (blog_key, slug) DO NOTHING;
*/

-- ============================================
-- 완료!
-- ============================================

-- 마이그레이션 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 멀티테넌트 마이그레이션 완료!';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. 기존 데이터의 blog_key를 적절한 값으로 업데이트하세요';
  RAISE NOTICE '2. 애플리케이션에서 BLOG_KEY 환경 변수를 설정하세요';
  RAISE NOTICE '3. 모든 쿼리가 blog_key로 필터링되는지 확인하세요';
END $$;
