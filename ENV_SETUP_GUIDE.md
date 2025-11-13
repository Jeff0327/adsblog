# 🔐 환경 변수 설정 가이드

## 📋 필수 vs 선택 환경 변수

### ✅ 필수 (블로그 기본 동작)

| 변수명 | 설명 | 얻는 방법 | 예시 |
|--------|------|-----------|------|
| `BLOG_KEY` | 블로그 고유 식별자 | 직접 정의 | `tech-blog-2024` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Supabase Dashboard > Settings > API | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 (읽기 전용) | Supabase Dashboard > Settings > API | `eyJhbGci...` |

### 🤖 Cron Job & 자동 포스팅 필수

| 변수명 | 설명 | 얻는 방법 | 예시 |
|--------|------|-----------|------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 관리자 키 (쓰기 권한) | Supabase Dashboard > Settings > API | `eyJhbGci...` |
| `GEMINI_API_KEY` | Google Gemini AI API 키 | [Google AI Studio](https://aistudio.google.com/app/apikey) | `AIzaSy...` |
| `UNSPLASH_ACCESS_KEY` | Unsplash 이미지 API 키 | [Unsplash Developers](https://unsplash.com/developers) | `abc123...` |

### 🔒 선택 (보안 강화)

| 변수명 | 설명 | 생성 방법 | 예시 |
|--------|------|-----------|------|
| `CRON_SECRET` | Cron Job 엔드포인트 보호 | `openssl rand -base64 32` | `random-string` |
| `NEXT_PUBLIC_SITE_URL` | 사이트 도메인 (SEO용) | 직접 입력 | `https://yourblog.com` |

---

## 🚀 빠른 설정 가이드

### 1단계: Supabase 키 발급

1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택 > **Settings** > **API**
3. 다음 값을 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 비밀!)

### 2단계: Gemini AI API 키 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. **Get API Key** 클릭
3. 프로젝트 선택 또는 새로 생성
4. API 키 복사 → `GEMINI_API_KEY`

**무료 할당량:**
- 15 requests/minute
- 1,500 requests/day
- 충분히 블로그 자동 포스팅 가능!

### 3단계: Unsplash API 키 발급

1. [Unsplash Developers](https://unsplash.com/developers) 접속
2. **Register as a developer** (가입)
3. **New Application** 생성
4. Application 이름 입력 (예: "My Blog")
5. Access Key 복사 → `UNSPLASH_ACCESS_KEY`

**무료 할당량:**
- Demo: 50 requests/hour
- Production: 5,000 requests/hour (신청 필요)
- 블로그용으로는 Demo로 충분!

---

## 💻 로컬 개발 설정

```bash
# 1. .env.example 복사
cp .env.example .env.local

# 2. .env.local 편집
# 최소 설정 (블로그만 보기)
BLOG_KEY=my-test-blog
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 3. 개발 서버 실행
npm run dev
```

### ⚠️ 로컬 개발 주의사항

**Service Role Key는 .env.local에 넣지 마세요!**
- Git에 올라갈 수 있음
- 로컬에서 Cron Job 테스트가 필요하면:
  - 임시로 입력 → 테스트 → **즉시 삭제**
  - 또는 Supabase RLS를 일시적으로 비활성화

---

## 🚀 Vercel 프로덕션 설정

### Vercel Dashboard에서 설정

1. **Vercel Dashboard** > 프로젝트 선택
2. **Settings** > **Environment Variables**
3. 다음 변수 추가:

```bash
# 필수
BLOG_KEY=your-blog-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_SITE_URL=https://yourblog.com

# Cron Job 사용시 필수
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GEMINI_API_KEY=AIzaSy...
UNSPLASH_ACCESS_KEY=abc123...

# 선택 (보안 강화)
CRON_SECRET=your-random-secret
```

4. **Save** 클릭
5. **Redeploy** (환경 변수 적용을 위해)

### 환경별 설정 (선택)

Vercel은 환경별 변수를 지원합니다:

- **Production**: 실제 서비스용
- **Preview**: PR 미리보기용
- **Development**: 로컬 개발용

대부분은 **All** (모든 환경)로 설정하면 됩니다.

---

## 🔐 보안 체크리스트

### ✅ 안전한 키 (공개 가능)

- `NEXT_PUBLIC_SUPABASE_URL` - 프론트엔드 코드에 노출됨
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 프론트엔드 코드에 노출됨
- `NEXT_PUBLIC_SITE_URL` - 공개 URL
- `BLOG_KEY` - 공개 가능 (단순 식별자)

### ⚠️ 비밀 키 (절대 공개 금지!)

- `SUPABASE_SERVICE_ROLE_KEY` - RLS 무시, 모든 권한
- `GEMINI_API_KEY` - 유료 API 사용량 발생
- `UNSPLASH_ACCESS_KEY` - API 할당량 소진
- `CRON_SECRET` - 보안 키

**보안 원칙:**
1. 비밀 키는 `.env.local`에 넣지 말 것
2. Git에 절대 커밋하지 말 것
3. Vercel 환경 변수에만 저장
4. 주기적으로 키 갱신 (특히 유출 의심시)

---

## 🐛 문제 해결

### 문제 1: "Missing environment variable BLOG_KEY"

**원인:** 환경 변수가 설정되지 않음

**해결:**
```bash
# 로컬: .env.local 파일 확인
cat .env.local

# Vercel: 환경 변수 확인
# Settings > Environment Variables
```

### 문제 2: Cron Job이 실패함

**원인:** Service Role Key 또는 API 키 누락

**해결:**
```bash
# Vercel 환경 변수 확인
SUPABASE_SERVICE_ROLE_KEY=설정됨?
GEMINI_API_KEY=설정됨?
UNSPLASH_ACCESS_KEY=설정됨?

# Vercel 로그 확인
# Deployments > 최신 배포 > Functions 탭
```

### 문제 3: "Unauthorized" 에러 (Cron Job)

**원인:** CRON_SECRET이 일치하지 않음

**해결:**
```bash
# vercel.json 확인
{
  "crons": [{
    "headers": {
      "authorization": "Bearer ${CRON_SECRET}"
    }
  }]
}

# Vercel 환경 변수와 일치하는지 확인
CRON_SECRET=same-value-here
```

### 문제 4: API 할당량 초과

**Gemini AI:**
- 무료: 15 requests/minute, 1,500/day
- 해결: 요청 간격 늘리기 또는 유료 플랜

**Unsplash:**
- Demo: 50 requests/hour
- 해결: Production 승인 신청 (5,000/hour)

---

## 📚 키 발급 링크 모음

- [Supabase Dashboard](https://supabase.com/dashboard) - Supabase 키
- [Google AI Studio](https://aistudio.google.com/app/apikey) - Gemini API 키
- [Unsplash Developers](https://unsplash.com/developers) - Unsplash API 키
- [Vercel Dashboard](https://vercel.com/dashboard) - Vercel 프로젝트 설정

---

## ✅ 최종 체크리스트

### 로컬 개발
- [ ] `.env.local` 파일 생성
- [ ] `BLOG_KEY` 설정
- [ ] Supabase 공개 키 설정
- [ ] `npm run dev` 성공

### Vercel 프로덕션
- [ ] 모든 필수 환경 변수 설정
- [ ] Service Role Key 설정 (Cron Job용)
- [ ] Gemini & Unsplash API 키 설정
- [ ] 빌드 성공 확인
- [ ] Cron Job 실행 확인 (Vercel > Cron 탭)

### 보안
- [ ] Service Role Key가 Git에 없는지 확인
- [ ] `.env.local`이 `.gitignore`에 있는지 확인
- [ ] 비밀 키를 Slack/Discord에 공유하지 않았는지 확인

---

완료! 🎉
