-- ============================================
-- 멀티 테넌트 블로그 마이그레이션
-- 하나의 DB로 여러 블로그 프로젝트 운영
-- 각 프로젝트는 .env의 BLOG_KEY로 구분
-- ============================================

-- 1. blog_settings에 blog_key와 마케팅 정보 추가
ALTER TABLE blog_settings
  ADD COLUMN IF NOT EXISTS blog_key TEXT UNIQUE NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS business_name TEXT, -- 홍보 대상 비즈니스명
  ADD COLUMN IF NOT EXISTS business_type TEXT, -- 비즈니스 종류 (자유 입력: IT기업, 병원, 음식점, 휴대폰매장 등)
  ADD COLUMN IF NOT EXISTS marketing_goal TEXT, -- 마케팅 목표
  ADD COLUMN IF NOT EXISTS target_keywords TEXT[], -- AI 글쓰기에 활용할 키워드 배열
  ADD COLUMN IF NOT EXISTS content_style TEXT; -- 콘텐츠 스타일/톤 (전문적, 친근한, 설득적 등)

-- blog_settings의 id 컬럼을 blog_key 기준으로 재설정 (기존 데이터 유지)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM blog_settings WHERE blog_key = 'default') THEN
    INSERT INTO blog_settings (
      blog_key,
      site_title,
      site_description,
      site_url,
      business_name,
      business_type
    ) VALUES (
      'default',
      'My Blog',
      'A modern blog built with Next.js and Supabase',
      'http://localhost:3000',
      'Default Company',
      'general'
    );
  END IF;
END $$;

-- 2. categories에 blog_key 연결
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS blog_key TEXT DEFAULT 'default' REFERENCES blog_settings(blog_key) ON DELETE CASCADE;

-- 기존 카테고리에 default blog_key 설정
UPDATE categories SET blog_key = 'default' WHERE blog_key IS NULL;

-- blog_key를 NOT NULL로 변경
ALTER TABLE categories ALTER COLUMN blog_key SET NOT NULL;

-- 3. seo_keywords에 blog_key 연결
ALTER TABLE seo_keywords
  ADD COLUMN IF NOT EXISTS blog_key TEXT DEFAULT 'default' REFERENCES blog_settings(blog_key) ON DELETE CASCADE;

-- 기존 SEO 키워드에 default blog_key 설정
UPDATE seo_keywords SET blog_key = 'default' WHERE blog_key IS NULL;

-- blog_key를 NOT NULL로 변경
ALTER TABLE seo_keywords ALTER COLUMN blog_key SET NOT NULL;

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_categories_blog_key ON categories(blog_key);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_blog_key ON seo_keywords(blog_key);
CREATE INDEX IF NOT EXISTS idx_blog_settings_blog_key ON blog_settings(blog_key);

-- 5. posts는 category를 통해 간접적으로 blog_key와 연결됨 (변경 불필요)
-- category → blog_key 관계로 자동 필터링

-- ============================================
-- 사용 예시
-- ============================================

-- 예시: 휴대폰 매장 블로그
INSERT INTO blog_settings (
  blog_key,
  site_title,
  site_description,
  site_url,
  business_name,
  business_type,
  marketing_goal,
  target_keywords,
  content_style,
  default_og_image
) VALUES (
  'mobile-shop-gangnam',
  '스마트폰 구매 가이드',
  '후회없는 스마트폰 선택을 위한 전문가 조언',
  'https://mobile-shop-blog.vercel.app',
  '모바일킹 강남점',
  '휴대폰매장',
  '신규 고객 유치 및 제품 판매',
  ARRAY['갤럭시', '아이폰', '스마트폰', '강남', '휴대폰매장'],
  '친근하고 설득적인 톤, 숫자를 활용한 후킹 (예: 이 3가지만 확인하면...)',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200'
) ON CONFLICT (blog_key) DO NOTHING;

-- 휴대폰 매장 카테고리
INSERT INTO categories (blog_key, name, slug, description, order_index) VALUES
  ('mobile-shop-gangnam', '갤럭시', 'galaxy', '삼성 갤럭시 시리즈', 1),
  ('mobile-shop-gangnam', '아이폰', 'iphone', '애플 아이폰 정보', 2),
  ('mobile-shop-gangnam', '구매가이드', 'guide', '스마트폰 선택 팁', 3)
ON CONFLICT (slug) DO NOTHING;

-- 휴대폰 매장 SEO 키워드
INSERT INTO seo_keywords (blog_key, keyword, is_global) VALUES
  ('mobile-shop-gangnam', '강남 휴대폰', true),
  ('mobile-shop-gangnam', '갤럭시 구매', true),
  ('mobile-shop-gangnam', '아이폰 할인', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 컬럼 설명
-- ============================================
COMMENT ON COLUMN blog_settings.blog_key IS '블로그 고유 식별자 (.env의 BLOG_KEY와 매칭)';
COMMENT ON COLUMN blog_settings.business_name IS '홍보할 비즈니스/기업명';
COMMENT ON COLUMN blog_settings.business_type IS '비즈니스 종류 (자유 텍스트)';
COMMENT ON COLUMN blog_settings.marketing_goal IS '마케팅 목표 설정';
COMMENT ON COLUMN blog_settings.target_keywords IS 'AI 글쓰기 시 우선 활용할 키워드 배열';
COMMENT ON COLUMN blog_settings.content_style IS '콘텐츠 작성 스타일/톤 (AI에게 전달될 가이드)';
COMMENT ON COLUMN categories.blog_key IS '이 카테고리가 속한 블로그';
COMMENT ON COLUMN seo_keywords.blog_key IS '이 키워드가 속한 블로그';
