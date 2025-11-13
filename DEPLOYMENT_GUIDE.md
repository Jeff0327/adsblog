# 🚀 블로그 배포 가이드

## 📋 배포 전 체크리스트

### 1️⃣ Supabase 데이터베이스 설정 (필수!)

#### Step 1: 마이그레이션 실행

Supabase Dashboard > SQL Editor로 이동하여 다음 SQL 파일들을 순서대로 실행하세요:

1. **멀티테넌트 마이그레이션** (첫 배포시 1회만)
   ```sql
   -- 파일: supabase-migration-multitenant.sql
   -- 실행: Supabase SQL Editor에서 전체 복사 후 실행
   ```

   이 마이그레이션은:
   - blog_settings, categories, posts에 `blog_key` 컬럼 추가
   - 복합 UNIQUE 제약조건 설정 (blog_key, slug)
   - 마케팅/브랜딩 필드 추가 (industry, brand_info, prompt_settings)
   - AdSense 필드 추가

2. **RLS 보안 정책 설정** (필수)
   ```sql
   -- 파일: supabase-rls-setup.sql
   -- 실행: Supabase SQL Editor에서 전체 복사 후 실행
   ```

   이 설정은:
   - Anon Key로 읽기만 허용 (published = true 포스트만)
   - 조회수 업데이트만 허용
   - INSERT/DELETE는 Service Role Key 필요

#### Step 2: 블로그 데이터 생성

AdHub 관리 페이지에서 새 블로그를 생성하거나, SQL로 직접 추가:

```sql
-- 블로그 설정 생성
INSERT INTO blog_settings (
  blog_key,
  site_title,
  site_description,
  site_url,
  business_name,
  content_style
) VALUES (
  'tech-blog-2024',  -- ⭐ 배포시 환경변수 BLOG_KEY와 동일해야 함!
  'Tech Insights',
  'Latest technology trends and tutorials',
  'https://techblog.example.com',
  'TechCorp Inc.',
  'professional'
);

-- 카테고리 생성
INSERT INTO categories (blog_key, name, slug, description, order_index) VALUES
('tech-blog-2024', 'Web Development', 'web-dev', 'Frontend and backend development', 1),
('tech-blog-2024', 'AI & Machine Learning', 'ai-ml', 'Artificial intelligence topics', 2);

-- 샘플 포스트 생성 (선택)
INSERT INTO posts (
  blog_key,
  title,
  slug,
  content,
  excerpt,
  category_id,
  published,
  published_at
) VALUES (
  'tech-blog-2024',
  'Getting Started with Next.js 15',
  'getting-started-nextjs-15',
  '# Introduction\n\nNext.js 15 brings many new features...',
  'Learn about the latest features in Next.js 15',
  (SELECT id FROM categories WHERE blog_key = 'tech-blog-2024' AND slug = 'web-dev'),
  true,
  NOW()
);
```

---

### 2️⃣ 환경 변수 설정

#### 로컬 개발용 (.env.local)

```bash
# 루트 디렉토리에 .env.local 파일 생성
cp .env.example .env.local

# 값 입력
BLOG_KEY=tech-blog-2024
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Vercel 배포용

Vercel Dashboard > 프로젝트 > Settings > Environment Variables에서 설정:

| 키 | 값 예시 | 설명 |
|---|---|---|
| `BLOG_KEY` | `tech-blog-2024` | **가장 중요!** 이 블로그의 고유 식별자 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abc.supabase.co` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase Anon Key (공개 가능) |
| `NEXT_PUBLIC_SITE_URL` | `https://techblog.com` | 프로덕션 도메인 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Service Role Key (Cron Job용, 선택) |
| `CRON_SECRET` | `your-secret` | Cron Job 보안 키 (선택) |
| `GEMINI_API_KEY` | `AIza...` | Gemini AI API 키 (자동 포스팅용, 선택) |
| `UNSPLASH_ACCESS_KEY` | `abc123` | Unsplash API 키 (이미지용, 선택) |

---

### 3️⃣ 로컬 테스트

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 확인
# http://localhost:3000/                     (홈)
# http://localhost:3000/category/web-dev     (카테고리)
# http://localhost:3000/posts/your-slug      (포스트)
# http://localhost:3000/sitemap.xml          (사이트맵)
# http://localhost:3000/robots.txt           (robots)
```

#### 확인 사항:
- [ ] 블로그 제목이 올바르게 표시되는가?
- [ ] 카테고리 목록이 보이는가?
- [ ] 포스트 목록이 보이는가?
- [ ] 다른 blog_key의 데이터가 섞이지 않는가?
- [ ] sitemap.xml에 현재 blog_key의 URL만 있는가?

---

### 4️⃣ Vercel 배포

#### 방법 1: Vercel CLI

```bash
# Vercel CLI 설치 (최초 1회)
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

#### 방법 2: GitHub 연동 (추천)

1. GitHub에 푸시
   ```bash
   git add .
   git commit -m "Setup multi-tenant blog"
   git push origin main
   ```

2. Vercel Dashboard > New Project
   - GitHub 저장소 연결
   - Framework Preset: Next.js 자동 감지
   - Environment Variables 입력 (위 표 참고)
   - Deploy 클릭

3. 커스텀 도메인 연결
   - Settings > Domains
   - 도메인 추가: `techblog.com`
   - DNS 설정 (Vercel이 안내)

---

## 🎯 멀티 블로그 배포 전략

### 시나리오: 여러 블로그 운영

같은 코드베이스로 여러 블로그를 배포할 수 있습니다:

```
Supabase DB (하나)
├── blog_key: "tech-blog-2024" (Tech Insights)
├── blog_key: "food-blog-2024" (Delicious Recipes)
└── blog_key: "travel-blog-2024" (Travel Adventures)

Vercel 배포 (3개)
├── 배포 1: techblog.com (BLOG_KEY=tech-blog-2024)
├── 배포 2: foodblog.com (BLOG_KEY=food-blog-2024)
└── 배포 3: travelblog.com (BLOG_KEY=travel-blog-2024)
```

#### 배포 방법:

**블로그 1: Tech Blog**
```bash
# Vercel Dashboard > New Project
# 같은 GitHub 저장소 선택
# Environment Variables:
BLOG_KEY=tech-blog-2024
NEXT_PUBLIC_SITE_URL=https://techblog.com
# (나머지 Supabase 변수는 동일)

# Domain: techblog.com
```

**블로그 2: Food Blog**
```bash
# Vercel Dashboard > New Project
# 같은 GitHub 저장소 선택
# Environment Variables:
BLOG_KEY=food-blog-2024
NEXT_PUBLIC_SITE_URL=https://foodblog.com
# (나머지 Supabase 변수는 동일)

# Domain: foodblog.com
```

이렇게 하면:
- 하나의 코드베이스로 여러 블로그 관리
- 각 블로그는 완전히 독립적
- DB는 하나로 공유 (blog_key로 자동 분리)
- 새 블로그 추가 시 코드 변경 불필요

---

## 🔍 트러블슈팅

### 문제 1: "BLOG_KEY 환경 변수가 없습니다"

**원인:** 환경 변수가 설정되지 않음

**해결:**
```bash
# 로컬: .env.local 파일 확인
BLOG_KEY=your-blog-key

# Vercel: 환경 변수 설정 후 재배포
```

### 문제 2: "포스트가 안 보입니다"

**원인:**
1. blog_key가 일치하지 않음
2. published = false
3. RLS 정책 문제

**해결:**
```sql
-- 1. blog_key 확인
SELECT blog_key, title FROM posts WHERE slug = 'your-slug';

-- 2. published 상태 확인
SELECT published FROM posts WHERE slug = 'your-slug';

-- 3. RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'posts';
```

### 문제 3: "다른 블로그의 포스트가 보입니다"

**원인:** BLOG_KEY 필터링 누락

**해결:**
- 모든 쿼리에 `.eq('blog_key', BLOG_KEY)` 있는지 확인
- 이 프로젝트는 이미 모든 쿼리에 필터링 적용됨

### 문제 4: "sitemap.xml이 비어 있습니다"

**원인:**
1. BLOG_KEY 데이터가 없음
2. published = false

**해결:**
```sql
-- 해당 블로그의 공개 포스트 확인
SELECT COUNT(*) FROM posts
WHERE blog_key = 'your-blog-key' AND published = true;
```

---

## 📚 추가 리소스

- **BLOG_PROJECT_GUIDE.md**: 프로젝트 구조 및 개념 설명
- **CLAUDE.md**: 개발 규칙 및 아키텍처 원칙
- **SUPABASE_RLS_SETUP.md**: RLS 보안 설정 상세 설명
- **supabase-migration-multitenant.sql**: DB 마이그레이션 스크립트
- **supabase-rls-setup.sql**: RLS 정책 설정 스크립트
- **supabase-category-enhancement.sql**: 카테고리 마케팅 필드 추가 (선택)

---

## ✅ 배포 완료 체크리스트

### Supabase
- [ ] `supabase-migration-multitenant.sql` 실행 완료
- [ ] `supabase-rls-setup.sql` 실행 완료
- [ ] 블로그 데이터 (blog_settings, categories) 생성 완료
- [ ] 샘플 포스트 생성 완료 (선택)

### 환경 변수
- [ ] `BLOG_KEY` 설정 (필수!)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- [ ] `NEXT_PUBLIC_SITE_URL` 설정 (프로덕션)

### 로컬 테스트
- [ ] `npm run dev` 성공
- [ ] 홈페이지 정상 작동
- [ ] 카테고리 페이지 정상 작동
- [ ] 포스트 페이지 정상 작동
- [ ] sitemap.xml 생성 확인
- [ ] robots.txt 확인

### Vercel 배포
- [ ] GitHub 푸시 완료
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정 완료
- [ ] 빌드 성공
- [ ] 커스텀 도메인 연결 (선택)
- [ ] HTTPS 활성화

### SEO
- [ ] sitemap.xml 확인 (https://yourblog.com/sitemap.xml)
- [ ] robots.txt 확인 (https://yourblog.com/robots.txt)
- [ ] Google Search Console 등록 (선택)
- [ ] Google Analytics 연동 (선택)

---

## 🎉 배포 성공!

축하합니다! 멀티테넌트 블로그가 성공적으로 배포되었습니다.

### 다음 단계:
1. 콘텐츠 작성 시작
2. SEO 최적화 모니터링
3. Google Search Console에서 인덱싱 확인
4. 필요시 추가 블로그 배포

문제가 발생하면 위 트러블슈팅 섹션을 참고하세요!
