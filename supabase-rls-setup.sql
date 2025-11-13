-- ============================================
-- Supabase RLS (Row Level Security) 설정
-- ============================================
-- 이 파일은 블로그 프론트엔드를 위한 RLS 정책을 설정합니다.
--
-- 보안 원칙:
-- - Anon Key (공개 키)로 접근하는 외부 블로그 사이트
-- - published = true인 포스트만 읽기 허용
-- - 조회수 업데이트만 UPDATE 허용
-- - INSERT/DELETE는 Service Role Key 필요 (AdHub 관리 페이지에서만)
--
-- Supabase SQL Editor에서 실행하세요.

-- ============================================
-- 1. RLS 활성화
-- ============================================

-- 각 테이블에 RLS 활성화
ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. 기존 정책 제거 (있다면)
-- ============================================

-- 기존 정책이 있을 수 있으므로 제거
DROP POLICY IF EXISTS "Public read access for blog_settings" ON blog_settings;
DROP POLICY IF EXISTS "Public read access for categories" ON categories;
DROP POLICY IF EXISTS "Public read access for published posts" ON posts;
DROP POLICY IF EXISTS "Public read access for post_images" ON post_images;
DROP POLICY IF EXISTS "Public read access for seo_keywords" ON seo_keywords;

-- 이전 버전 정책도 제거
DROP POLICY IF EXISTS "Public read all blog settings" ON blog_settings;
DROP POLICY IF EXISTS "Public read all categories" ON categories;
DROP POLICY IF EXISTS "Public read published posts only" ON posts;
DROP POLICY IF EXISTS "Allow view count update for published posts" ON posts;
DROP POLICY IF EXISTS "Public read all post images" ON post_images;
DROP POLICY IF EXISTS "Public read all seo keywords" ON seo_keywords;

-- ============================================
-- 3. 읽기 정책 설정 (SELECT)
-- ============================================

-- blog_settings: 모든 블로그 설정은 누구나 읽을 수 있음
CREATE POLICY "Allow public read all blog settings"
ON public.blog_settings
FOR SELECT
USING (true);  -- 모든 블로그 공개!

COMMENT ON POLICY "Allow public read all blog settings" ON blog_settings IS
'모든 블로그 설정을 Anon Key로 읽을 수 있음. 각 블로그 사이트는 BLOG_KEY로 필터링하여 자신의 설정만 가져감.';

-- categories: 모든 카테고리는 누구나 읽을 수 있음
CREATE POLICY "Allow public read all categories"
ON public.categories
FOR SELECT
USING (true);  -- 모든 카테고리 공개!

COMMENT ON POLICY "Allow public read all categories" ON categories IS
'모든 카테고리를 Anon Key로 읽을 수 있음. 각 블로그 사이트는 blog_key로 필터링하여 자신의 카테고리만 가져감.';

-- posts: 발행된 포스트만 누구나 읽을 수 있음
CREATE POLICY "Allow public read published posts"
ON public.posts
FOR SELECT
USING (published = true);  -- published = true인 것만!

COMMENT ON POLICY "Allow public read published posts" ON posts IS
'published = true인 포스트만 Anon Key로 읽을 수 있음. 초안(published = false)은 보호됨.';

-- post_images: 모든 이미지는 누구나 읽을 수 있음
-- (포스트 자체가 published = true여야 보이므로 이미지도 안전)
CREATE POLICY "Allow public read all post images"
ON public.post_images
FOR SELECT
USING (true);

COMMENT ON POLICY "Allow public read all post images" ON post_images IS
'모든 이미지를 Anon Key로 읽을 수 있음. 하지만 포스트가 published = false면 포스트 자체가 안 보이므로 이미지도 실질적으로 접근 불가.';

-- seo_keywords: 모든 키워드는 누구나 읽을 수 있음
CREATE POLICY "Allow public read all seo keywords"
ON public.seo_keywords
FOR SELECT
USING (true);

COMMENT ON POLICY "Allow public read all seo keywords" ON seo_keywords IS
'모든 SEO 키워드를 Anon Key로 읽을 수 있음. 각 블로그 사이트는 blog_key로 필터링.';

-- ============================================
-- 4. 조회수 업데이트 정책 (UPDATE)
-- ============================================

-- posts: 조회수만 업데이트 가능 (published = true인 포스트만)
CREATE POLICY "Allow public update view count for published posts"
ON public.posts
FOR UPDATE
USING (published = true)  -- published = true인 포스트만 업데이트 가능
WITH CHECK (published = true);  -- 업데이트 후에도 published = true여야 함

COMMENT ON POLICY "Allow public update view count for published posts" ON posts IS
'Anon Key로 published = true인 포스트의 view_count 증가 허용. 다른 필드 변경은 Service Role Key 필요.';

-- ============================================
-- 5. INSERT/DELETE 차단
-- ============================================

-- INSERT 정책 없음 → 외부(Anon Key)에서 INSERT 불가
-- DELETE 정책 없음 → 외부(Anon Key)에서 DELETE 불가
--
-- Service Role Key를 사용하는 AdHub 관리 페이지에서만 INSERT/DELETE 가능
-- (Service Role Key는 RLS를 무시함)

-- ============================================
-- 6. 정책 확인
-- ============================================

-- 설정된 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('blog_settings', 'categories', 'posts', 'post_images', 'seo_keywords')
ORDER BY tablename, policyname;

-- ============================================
-- 7. 테스트 쿼리 (선택사항)
-- ============================================

-- 다음 쿼리들은 Anon Key로 실행했을 때의 동작을 시뮬레이션합니다.
-- (실제로는 애플리케이션에서 테스트해야 함)

/*
-- ✅ 성공해야 함: published = true인 포스트 조회
SELECT * FROM posts WHERE published = true LIMIT 5;

-- ✅ 성공해야 함: 모든 카테고리 조회
SELECT * FROM categories LIMIT 5;

-- ✅ 성공해야 함: 모든 블로그 설정 조회
SELECT * FROM blog_settings LIMIT 5;

-- ❌ 실패해야 함: published = false인 포스트 조회
-- (RLS 정책에 의해 빈 결과 반환)
SELECT * FROM posts WHERE published = false LIMIT 5;

-- ✅ 성공해야 함: 조회수 증가 (published = true인 포스트만)
-- UPDATE posts SET view_count = view_count + 1
-- WHERE id = 'some-uuid' AND published = true;

-- ❌ 실패해야 함: 포스트 생성
-- (INSERT 정책이 없으므로 권한 오류)
-- INSERT INTO posts (title, content, published) VALUES ('Test', 'Content', true);

-- ❌ 실패해야 함: 포스트 삭제
-- (DELETE 정책이 없으므로 권한 오류)
-- DELETE FROM posts WHERE id = 'some-uuid';
*/

-- ============================================
-- 완료!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS 정책 설정 완료!';
  RAISE NOTICE '';
  RAISE NOTICE '보안 요약:';
  RAISE NOTICE '- Anon Key (공개): 읽기만 가능, published = true 포스트만';
  RAISE NOTICE '- Service Role Key (비밀): 모든 권한 (RLS 무시)';
  RAISE NOTICE '';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. 애플리케이션에서 Anon Key로 데이터 조회 테스트';
  RAISE NOTICE '2. 조회수 증가 기능 테스트';
  RAISE NOTICE '3. published = false 포스트가 안 보이는지 확인';
  RAISE NOTICE '4. Service Role Key는 AdHub 백엔드에만 저장';
END $$;
