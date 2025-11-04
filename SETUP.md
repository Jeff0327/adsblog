# 🚀 AdBlog 설정 가이드

## 1단계: Supabase 데이터베이스 설정

### 1-1. Supabase 프로젝트 생성
1. https://supabase.com 접속 후 로그인
2. "New Project" 클릭
3. 프로젝트 이름, 비밀번호, 리전 선택
4. "Create new project" 클릭

### 1-2. 데이터베이스 스키마 생성
1. Supabase 대시보드에서 왼쪽 메뉴 "SQL Editor" 클릭
2. "New query" 클릭
3. `supabase-schema.sql` 파일의 전체 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 실행

### 1-3. 환경 변수 설정
1. Supabase 대시보드에서 "Settings" → "API" 클릭
2. 다음 값들을 복사:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGc...`
3. `.env.local` 파일에 붙여넣기

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 1-4. 블로그 기본 설정 추가
Supabase SQL Editor에서 다음 SQL 실행:

```sql
-- 블로그 기본 정보
INSERT INTO blog_settings (site_title, site_description, site_url)
VALUES (
  'My Blog',
  'AI로 자동 생성되는 블로그',
  'https://yourdomain.com'
);

-- 카테고리 추가
INSERT INTO categories (name, slug, description, order_index)
VALUES
  ('기술', 'technology', '기술 관련 글', 1),
  ('라이프스타일', 'lifestyle', '라이프스타일 글', 2),
  ('비즈니스', 'business', '비즈니스 관련 글', 3);

-- SEO 키워드 추가 (선택사항)
INSERT INTO seo_keywords (keyword, is_global)
VALUES
  ('AI', true),
  ('블로그', true),
  ('개발', true),
  ('기술', true),
  ('트렌드', true);
```

## 2단계: API 키 발급

### 2-1. Google Gemini API Key
1. https://makersuite.google.com/app/apikey 접속
2. "Create API Key" 클릭
3. 생성된 API 키 복사
4. `.env.local`에 추가:

```env
GEMINI_API_KEY=AIzaSy...
```

### 2-2. Unsplash API Key
1. https://unsplash.com/developers 접속 및 가입
2. "Your apps" → "New Application" 클릭
3. 약관 동의 후 애플리케이션 이름 입력
4. "Access Key" 복사
5. `.env.local`에 추가:

```env
UNSPLASH_ACCESS_KEY=abc123...
```

### 2-3. 최종 .env.local 파일 확인

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...

# Unsplash
UNSPLASH_ACCESS_KEY=abc123...

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cron Secret (optional)
CRON_SECRET=your_random_secret_key
```

## 3단계: 로컬 실행 및 테스트

```bash
# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 3-1. 자동 글 생성 테스트

```bash
# 로컬에서 자동 글 생성 API 호출
curl http://localhost:3000/api/cron/generate-post
```

성공하면 다음과 같은 응답이 나옵니다:
```json
{
  "success": true,
  "post": {
    "id": "...",
    "title": "생성된 글 제목",
    "slug": "...",
    "category": "기술",
    "images_count": 3
  }
}
```

## 4단계: Vercel 배포

### 4-1. Vercel 프로젝트 생성
```bash
npm install -g vercel
vercel login
vercel
```

### 4-2. 환경 변수 설정
Vercel 대시보드에서:
1. 프로젝트 선택
2. "Settings" → "Environment Variables"
3. 모든 환경 변수 추가 (Production, Preview, Development 모두 체크)

### 4-3. 배포
```bash
vercel --prod
```

### 4-4. Vercel Cron 확인
- `vercel.json`에 이미 설정되어 있음
- 매일 오전 9시에 자동으로 `/api/cron/generate-post` 호출
- Vercel 대시보드 → Cron Jobs에서 확인 가능

## 문제 해결

### ❌ "Error fetching blog settings"
**원인**: Supabase 테이블이 생성되지 않았거나 데이터가 없음

**해결**:
1. Supabase SQL Editor에서 `supabase-schema.sql` 실행 확인
2. `blog_settings` 테이블에 데이터가 있는지 확인:
   ```sql
   SELECT * FROM blog_settings;
   ```
3. 데이터가 없으면 1-4 단계의 SQL 실행

### ❌ "Module not found: Can't resolve '@/utils'"
**원인**: Import 경로 문제

**해결**: 이미 수정 완료됨 (`@/lib/utils`로 변경)

### ❌ Gemini API 에러
**원인**: API 키가 없거나 잘못됨

**해결**:
1. `.env.local`의 `GEMINI_API_KEY` 확인
2. Google AI Studio에서 새 API 키 발급

### ❌ Unsplash API 에러
**원인**: API 키가 없거나 Rate Limit 초과

**해결**:
1. `.env.local`의 `UNSPLASH_ACCESS_KEY` 확인
2. Unsplash 무료 플랜은 시간당 50회 제한

## 다음 단계

✅ 모든 설정이 완료되면:
1. 블로그 글이 정상적으로 표시되는지 확인
2. 카테고리 필터링 테스트
3. 자동 글 생성 테스트
4. SEO 메타데이터 확인 (개발자 도구 → Elements → head)
5. Vercel 배포 및 도메인 연결

## 추가 자료

- [Next.js 16 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
