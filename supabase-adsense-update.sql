-- 애드센스 설정 필드 추가
-- Supabase SQL Editor에서 실행하세요

-- blog_settings 테이블에 애드센스 관련 컬럼 추가
ALTER TABLE blog_settings
ADD COLUMN IF NOT EXISTS adsense_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adsense_client_id TEXT,
ADD COLUMN IF NOT EXISTS adsense_sidebar_slot TEXT,
ADD COLUMN IF NOT EXISTS adsense_in_article_slot TEXT;

-- 애드센스 활성화 시 client_id 필수값 체크 제약조건
ALTER TABLE blog_settings
ADD CONSTRAINT adsense_client_id_required
CHECK (
  (adsense_enabled = false) OR
  (adsense_enabled = true AND adsense_client_id IS NOT NULL AND adsense_client_id != '')
);

-- 기존 데이터가 있다면 기본값으로 업데이트
UPDATE blog_settings
SET adsense_enabled = false
WHERE adsense_enabled IS NULL;

-- 확인
SELECT
  id,
  site_title,
  adsense_enabled,
  adsense_client_id,
  adsense_sidebar_slot,
  adsense_in_article_slot
FROM blog_settings;
