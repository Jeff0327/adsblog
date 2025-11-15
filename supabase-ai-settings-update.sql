-- ============================================
-- AI 설정 필드 업데이트
-- ============================================
-- promptSettings JSONB에 provider, apiKey 필드 추가
-- 기존 promptSettings는 유지하면서 새 필드 추가
-- ============================================

-- promptSettings JSONB 구조:
-- {
--   "provider": "openai" | "gemini" | "claude",
--   "apiKey": "your-api-key-here",
--   "model": "gpt-4o" | "gemini-2.5-flash" | "claude-3-5-sonnet-20241022",
--   "contentPrompt": "커스텀 프롬프트",
--   "seoPrompt": "SEO 프롬프트",
--   "temperature": 0.7,
--   "maxTokens": 2000
-- }

-- 기존 promptSettings 필드는 이미 JSONB이므로 별도 마이그레이션 불필요
-- 단, 기존 데이터에 provider와 apiKey 추가

-- 예시: 기존 블로그 설정에 Gemini provider 추가
UPDATE blog_settings
SET "promptSettings" = jsonb_set(
  COALESCE("promptSettings", '{}'::jsonb),
  '{provider}',
  '"gemini"'
)
WHERE "promptSettings" IS NULL OR "promptSettings"->>'provider' IS NULL;

-- 주석: API 키는 보안상 SQL로 직접 입력하지 말고,
-- 관리자 페이지나 별도 스크립트로 안전하게 저장하세요

-- 확인 쿼리
SELECT
  blog_key,
  "promptSettings"->>'provider' as provider,
  "promptSettings"->>'model' as model,
  CASE
    WHEN "promptSettings"->>'apiKey' IS NOT NULL THEN '(설정됨)'
    ELSE '(미설정)'
  END as api_key_status
FROM blog_settings
WHERE "postingEnabled" = true;
