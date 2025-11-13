# 🎉 독립 블로그 프로젝트 - 최종 완료

## 📋 프로젝트 개요

**멀티 테넌트 블로그 시스템** - 하나의 Supabase DB를 공유하면서 각 블로그가 독립적으로 운영됩니다.

### 핵심 개념
- 각 블로그 = 1개 사업자 = 단일 홍보 블로그
- 같은 코드를 여러 번 배포, 각각 다른 도메인 + BLOG_KEY
- URL 구조: `/`, `/post/[slug]` (카테고리 없음!)
- Tags 기반 분류 시스템

---

## 🗄️ 데이터베이스 스키마

### `blog_settings` 테이블

| 필드명 | 타입 | 기본값 | 설명 |
|--------|------|--------|------|
| `id` | uuid | gen_random_uuid() | Primary Key |
| `blog_key` | text | - | 블로그 고유 식별자 (UNIQUE) |
| `userId` | uuid | null | auth.users FK |
| `site_title` | text | 'My Blog' | 사이트 제목 |
| `site_description` | text | null | 사이트 설명 |
| `site_url` | text | null | 사이트 URL |
| `keywords` | text[] | {} | SEO 키워드 |
| `adsense_enabled` | boolean | false | AdSense 활성화 |
| `adsense_client_id` | text | null | AdSense 클라이언트 ID |
| `content_style` | text | 'professional' | 콘텐츠 스타일 |
| `is_public` | boolean | true | 공개 여부 |
| `isActive` | boolean | true | 활성 상태 |
| `businessName` | text | null | 비즈니스 이름 |
| `businessDescription` | text | null | 비즈니스 설명 |
| `promotionGoal` | text | null | 프로모션 목표 |
| `productInfo` | jsonb | null | 제품 정보 |
| `postsPerDay` | integer | 2 | 일일 포스트 수 (0-10) |
| `imagesPerPost` | integer | 3 | 포스트당 이미지 수 (2-4) |
| `postingEnabled` | boolean | true | 자동 포스팅 활성화 |
| `lastPostedAt` | timestamptz | null | 마지막 포스팅 시간 |
| `industry` | text | null | 산업 분야 |
| `brandInfo` | jsonb | null | 브랜딩 정보 |
| `promptSettings` | jsonb | null | AI 프롬프트 설정 |
| `created_at` | timestamptz | now() | 생성 시간 |
| `updated_at` | timestamptz | now() | 수정 시간 |

### `posts` 테이블

| 필드명 | 타입 | 기본값 | 설명 |
|--------|------|--------|------|
| `id` | uuid | gen_random_uuid() | Primary Key |
| `blog_key` | text | - | 블로그 고유 식별자 (FK) |
| `authorId` | uuid | null | auth.users FK |
| `title` | text | - | 제목 |
| `slug` | text | - | URL 슬러그 (UNIQUE with blog_key) |
| `content` | text | '' | 콘텐츠 (HTML 또는 마크다운) |
| `excerpt` | text | null | 발췌문 |
| `richContent` | jsonb | null | Rich JSON 콘텐츠 |
| `contentFormat` | text | 'richJson' | 콘텐츠 형식 (markdown/richJson/html) |
| `images` | text[] | {} | 이미지 URL 배열 |
| `tags` | text[] | {} | 태그 배열 |
| `seo_title` | text | null | SEO 제목 |
| `seo_description` | text | null | SEO 설명 |
| `seo_keywords` | text[] | {} | SEO 키워드 |
| `og_image` | text | null | Open Graph 이미지 |
| `published` | boolean | false | 발행 여부 |
| `published_at` | timestamptz | null | 발행 시간 |
| `view_count` | integer | 0 | 조회수 |
| `created_at` | timestamptz | now() | 생성 시간 |
| `updated_at` | timestamptz | now() | 수정 시간 |

---

## 🏗️ 프로젝트 구조

```
adsblog/
├── app/
│   ├── actions.ts                     # 블로그 설정, 포스트 목록 조회
│   ├── page.tsx                       # 홈페이지 (모던 카드 레이아웃)
│   ├── layout.tsx                     # 루트 레이아웃
│   ├── post/
│   │   └── [slug]/
│   │       ├── page.tsx              # 포스트 상세 페이지
│   │       └── actions.ts            # 포스트 조회, 조회수 증가
│   ├── sitemap.ts                    # sitemap.xml
│   └── robots.ts                     # robots.txt
├── types/
│   ├── database.types.ts             # DB 타입 정의 (100% 일치)
│   └── index.ts
├── utils/
│   └── supabase/
│       ├── server.ts                 # Supabase 서버 클라이언트
│       └── client.ts                 # Supabase 클라이언트 클라이언트
├── .env.local                        # 환경 변수 (Git 무시)
├── .env.example                      # 환경 변수 예시
├── BLOG_PROJECT_GUIDE.md             # 프로젝트 가이드
├── SUPABASE_FINAL_SCHEMA.sql         # 최종 DB 스키마
└── README_FINAL.md                   # 이 파일
```

---

## 🔧 환경 변수 설정

### `.env.local` (로컬 개발)

```env
# 블로그 고유 키 (필수!)
BLOG_KEY=my-test-blog

# Supabase (필수!)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# 사이트 URL (권장)
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### Vercel 환경 변수 (프로덕션)

```env
# 필수
BLOG_KEY=your-blog-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_SITE_URL=https://yourblog.com

# 자동 포스팅용 (선택)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GEMINI_API_KEY=AIzaSy...
UNSPLASH_ACCESS_KEY=abc123...
CRON_SECRET=your-random-secret
```

---

## 🎨 UI/UX 특징

### 홈페이지
- ✨ 그라데이션 히어로 헤더 (파란색 → 보라색)
- 📱 반응형 3열 그리드 (데스크톱), 2열 (태블릿), 1열 (모바일)
- 🎭 카드 호버 효과 (lift, 그림자, 이미지 줌)
- 🔢 모던한 페이지네이션

### 포스트 상세 페이지
- 🖼️ 큰 히어로 이미지 (500px 높이)
- 📌 스티키 헤더 (스크롤시 상단 고정)
- 📝 Excerpt 강조 박스
- 🎨 개선된 Prose 스타일링
- 🔙 그라데이션 버튼

---

## 🚀 배포 가이드

### 1. Supabase 설정

1. **Supabase 대시보드**에서 프로젝트 생성
2. **SQL Editor**에서 `SUPABASE_FINAL_SCHEMA.sql` 실행
3. **API Keys** 복사 (URL, Anon Key)

### 2. Vercel 배포

```bash
# GitHub에 푸시
git add .
git commit -m "Initial commit"
git push origin main

# Vercel 배포
vercel --prod
```

### 3. 환경 변수 설정

Vercel Dashboard > Settings > Environment Variables에서 설정

### 4. 여러 블로그 배포

같은 코드를 여러 번 배포:
- 배포 1: `cafe-blog.com` (BLOG_KEY=user123-cafe)
- 배포 2: `gym-fitness.com` (BLOG_KEY=company-gym)
- 배포 3: `tech-startup.com` (BLOG_KEY=startup-tech)

---

## ⚠️ 중요 사항

### 1. Slug 형식 주의
- ✅ 올바름: `my-first-post`, `introduction`
- ❌ 잘못됨: `https://youtube.com` (URL 형식 불가)

**잘못된 slug 수정:**
```sql
UPDATE posts
SET slug = 'youtube-video-guide'
WHERE slug LIKE 'https://%';
```

### 2. 멀티 테넌트 필터링
모든 쿼리에 `blog_key` 필터링 필수:

```typescript
.eq('blog_key', BLOG_KEY)  // ⭐ 필수!
```

### 3. 필드명 대소문자
- **snake_case**: `blog_key`, `site_title`, `created_at`
- **camelCase**: `userId`, `authorId`, `businessName`

---

## 📝 TypeScript 타입 예시

```typescript
// 블로그 설정 조회
const settings: BlogSettings = await getBlogSettings()

// 포스트 목록 조회
const { posts, total } = await getPosts(undefined, 1, 10)
posts.forEach((post: Post) => {
  console.log(post.title, post.slug, post.tags)
})

// 포스트 상세 조회
const post: Post | null = await getPostBySlug('my-first-post')
```

---

## ✅ 완료 체크리스트

- [x] DB 스키마 최종 확인 (`SUPABASE_FINAL_SCHEMA.sql`)
- [x] TypeScript 타입 정의 (100% 일치)
- [x] 카테고리 제거, tags 기반으로 전환
- [x] `/post/[slug]` URL 구조
- [x] 모던한 UI 레이아웃
- [x] 멀티 테넌트 지원 (BLOG_KEY)
- [x] ISR 설정 (revalidate = 600)
- [x] SEO 최적화 (sitemap, robots.txt)
- [x] 반응형 디자인
- [x] 다크모드 지원

---

## 🎉 다음 단계

1. **Supabase에서 slug 값 확인 및 수정**
2. **테스트 포스트 작성**
3. **개발 서버 확인**: http://localhost:3001
4. **Vercel 배포**
5. **커스텀 도메인 연결**

---

## 📚 참고 문서

- [BLOG_PROJECT_GUIDE.md](./BLOG_PROJECT_GUIDE.md) - 프로젝트 전체 가이드
- [SUPABASE_FINAL_SCHEMA.sql](./SUPABASE_FINAL_SCHEMA.sql) - DB 스키마
- [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) - 환경 변수 설정
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 배포 가이드
- [DB_SCHEMA_FINAL.md](./DB_SCHEMA_FINAL.md) - DB 변경 사항

---

**개발 서버 실행:**
```bash
npm run dev
# → http://localhost:3001
```

**프로덕션 빌드:**
```bash
npm run build
npm start
```

---

## 🐛 문제 해결

### slug 관련 404 에러
```sql
-- Supabase SQL Editor에서 실행
UPDATE posts
SET slug = 'post-' || id::text
WHERE slug LIKE 'http%';
```

### TypeScript 타입 에러
```bash
# 타입 정의 확인
cat types/database.types.ts

# Next.js 재시작
rm -rf .next
npm run dev
```

---

**프로젝트 상태: 완료 ✅**
- 포트: 3001
- URL: http://localhost:3001
