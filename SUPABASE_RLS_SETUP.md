# Supabase RLS 설정 가이드 (블로그 공개용)

## 🔐 외부 접근 방식

### Anon Key만으로 접근 (로그인 불필요!)

외부 블로그 사이트는 **Anon Key**만 사용하여 Supabase에 접근합니다.

```typescript
// .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // ← 클라이언트에 노출되어도 안전!
)
```

### 보안 구조

```
외부 블로그 사이트
    ↓
Anon Key로 요청
    ↓
Supabase RLS 정책 체크
    ↓
✅ published = true → 포스트 읽기 허용
❌ published = false → 포스트 접근 거부
✅ 모든 블로그 설정 읽기 허용
✅ 모든 카테고리 읽기 허용
```

---

## 📝 RLS 정책 설정 (Supabase SQL Editor에서 실행)

### 1. RLS 활성화

```sql
-- 각 테이블에서 RLS 활성화
ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
```

### 2. 읽기 정책 설정

```sql
-- ============================================
-- blog_settings: 모든 블로그 설정은 누구나 읽을 수 있음
-- ============================================
CREATE POLICY "모든 블로그 설정은 공개"
ON public.blog_settings
FOR SELECT
USING (true);  -- 모든 블로그 공개!

-- ============================================
-- categories: 모든 카테고리는 누구나 읽을 수 있음
-- ============================================
CREATE POLICY "모든 카테고리는 공개"
ON public.categories
FOR SELECT
USING (true);  -- 모든 카테고리 공개!

-- ============================================
-- posts: 발행된 포스트만 누구나 읽을 수 있음
-- ============================================
CREATE POLICY "발행된 포스트만 공개"
ON public.posts
FOR SELECT
USING (published = true);  -- published = true인 것만!
```

### 3. 조회수 업데이트 정책

```sql
-- ============================================
-- 조회수 업데이트: 발행된 포스트만 가능
-- ============================================
CREATE POLICY "조회수 업데이트 허용"
ON public.posts
FOR UPDATE
USING (published = true)
WITH CHECK (published = true);
```

### 4. 쓰기/삭제 차단 (AdHub에서만 가능하도록)

```sql
-- posts 테이블: 외부에서 INSERT/DELETE 금지
-- (Service Role Key를 사용하는 AdHub에서만 가능)

-- INSERT 정책 없음 → 외부에서 INSERT 불가
-- DELETE 정책 없음 → 외부에서 DELETE 불가
```

---

## 🔑 키 설명

| 키 종류 | 사용처 | 노출 가능 여부 | 권한 |
|---------|--------|---------------|------|
| **Anon Key** | 외부 블로그 사이트 (클라이언트) | ✅ 공개 가능 | RLS 정책에 따라 제한된 읽기 |
| **Service Role Key** | AdHub 백엔드 (NestJS/Next.js Server) | ❌ 절대 노출 금지 | 모든 권한 (RLS 무시) |

---

## 🎯 실제 동작

### 외부 블로그 사이트에서 조회

```typescript
// ✅ 성공: published = true인 포스트 조회
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('blog_key', 'user123-main')
  .eq('published', true)
// → RLS 정책 통과, 데이터 반환

// ❌ 실패: published = false인 포스트 조회
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('blog_key', 'user123-main')
  .eq('published', false)
// → RLS 정책에 의해 빈 배열 반환 (접근 거부)

// ✅ 성공: 블로그 설정 조회
const { data } = await supabase
  .from('blog_settings')
  .select('*')
  .eq('blogKey', 'user123-main')
// → 모든 블로그 설정은 공개되므로 성공

// ✅ 성공: 조회수 증가
const { data } = await supabase
  .from('posts')
  .update({ viewCount: 100 })
  .eq('id', 'post-uuid')
// → published = true인 포스트만 업데이트 가능

// ❌ 실패: 포스트 생성
const { error } = await supabase
  .from('posts')
  .insert({ title: 'New Post' })
// → INSERT 정책이 없으므로 실패 (AdHub에서만 가능)
```

---

## 🛡️ 보안 요약

### ✅ 안전한 이유

1. **Anon Key는 권한이 없음**
   - Anon Key 자체는 아무 권한도 없음
   - RLS 정책이 모든 접근을 제어

2. **RLS 정책으로 완벽히 제어**
   - `published = true`인 포스트만 읽기 가능
   - 나머지는 모두 차단

3. **쓰기 권한 최소화**
   - 조회수 업데이트만 허용
   - INSERT, DELETE는 Service Role Key 필요 (AdHub만 가능)

4. **민감한 정보 노출 방지**
   - `userId`, 개인정보 등은 외부에서 조회 가능하지만
   - RLS 정책으로 필요한 필드만 선택적으로 반환 가능

### ❌ 위험 요소

- **Service Role Key 노출**: 절대 클라이언트에 포함하지 말 것!
- **RLS 정책 누락**: 모든 테이블에 RLS를 활성화하고 정책을 설정해야 함

---

## 📚 참고

- Supabase RLS 공식 문서: https://supabase.com/docs/guides/auth/row-level-security
- RLS 정책 예시: https://supabase.com/docs/guides/database/postgres/row-level-security

---

## 🚀 설정 완료 체크리스트

- [ ] blog_settings, categories, posts 테이블에 RLS 활성화
- [ ] "모든 블로그 설정은 공개" 정책 생성
- [ ] "모든 카테고리는 공개" 정책 생성
- [ ] "발행된 포스트만 공개" 정책 생성
- [ ] "조회수 업데이트 허용" 정책 생성
- [ ] Anon Key를 외부 블로그 사이트 .env에 추가
- [ ] Service Role Key는 AdHub 백엔드에만 보관
