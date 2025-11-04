# AdHub 프로젝트 개발 규칙

## 프로젝트 개요
- **Frontend**: Next.js 16 (App Router)
- **Backend**: NestJS (별도 백엔드 서버)
- **Database**: Supabase
- **기술 스택**: React 19, TypeScript, Tailwind CSS 4

## 핵심 개발 원칙

### ⚠️ 절대 규칙
1. **any 타입 사용 금지**: 모든 타입은 명시적으로 정의해야 합니다
2. **useState 최소화**: 상태 관리는 searchParams 또는 Server Actions로 처리
3. **Server-First 접근**: 최대한 Server Component와 Server Actions 활용
4. **훅 사용 분리**: React Hooks가 필요하면 Client Component로 분리

## 아키텍처 규칙

### 1. 컴포넌트 구조 (Server-First)
**모든 페이지는 Server Component를 기본으로 사용합니다.**

```
app/
  └── feature/
      ├── page.tsx              # Server Component (필수)
      ├── actions.ts            # Server Actions (필수)
      ├── FeatureServer.tsx     # Server Component (선택)
      └── FeatureClient.tsx     # Client Component (필요시만)
```

**계층 구조:**
```
Page (Server Component)
  └── Server Component
      └── Client Component (필요한 부분만)
```

**클라이언트 컴포넌트가 필요한 경우:**
- 사용자 이벤트 핸들링 (onClick, onChange 등)
- React Hooks 사용 (useState, useEffect 등) - 단, useState는 최소화
- 브라우저 API 사용 (localStorage, window 등)

**❌ 잘못된 예시 (useState 남용):**
```typescript
'use client'
export default function FilterPage() {
  const [filter, setFilter] = useState('all')
  // 필터 변경 시 클라이언트에서만 처리
}
```

**✅ 올바른 예시 (searchParams 활용):**
```typescript
// Server Component
export default function FilterPage({ searchParams }: { searchParams: { filter?: string } }) {
  const filter = searchParams.filter || 'all'
  // URL 기반 상태 관리로 새로고침, 공유 가능
}
```

### 2. Server Actions 분리
각 페이지/기능 디렉토리에 `actions.ts` 파일을 생성하여 서버사이드 로직을 분리합니다.

```typescript
// app/login/actions.ts
'use server'

export async function loginUser(email: string, password: string) {
  // 서버 로직
}
```

### 3. 유틸리티 함수 관리
중복되는 함수는 `utils/utils.ts`에 외부 함수로 정리합니다.

```typescript
// utils/utils.ts
export function formatDate(date: Date): string {
  // 재사용 가능한 로직
}
```

### 4. 파일 분할
**컴포넌트 파일이 너무 길어지면 기능별로 분할합니다.**

예시:
```
app/dashboard/
  ├── page.tsx
  ├── actions.ts
  ├── DashboardHeader.tsx
  ├── DashboardContent.tsx
  ├── DashboardSidebar.tsx
  └── DashboardFooter.tsx
```

### 5. 병렬 처리 최적화
여러 개의 actions.ts 함수를 호출할 때는 `Promise.all()`을 사용합니다.

```typescript
const [userData, postsData, statsData] = await Promise.all([
  getUserData(),
  getPostsData(),
  getStatsData()
])
```

### 6. 성능 우선
- React 19의 Server Components 활용
- Dynamic imports로 코드 스플리팅
- 이미지 최적화 (Next.js Image component)
- 캐싱 전략 활용 (fetch cache, revalidate)

### 7. Supabase 사용 규칙

**Next.js에서 허용되는 Supabase 사용:**
```typescript
// ✅ 허용: Public 데이터 조회
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .eq('is_public', true)

// ✅ 허용: 인증 확인
const { data: { user } } = await supabase.auth.getUser()

// ✅ 허용: 세션 관리
const { data: { session } } = await supabase.auth.getSession()
```

**NestJS 백엔드에서 처리할 사항:**
- 민감한 정보 접근 (개인정보, 결제 정보 등)
- 복잡한 비즈니스 로직
- 데이터 수정/삭제 (중요한 작업)
- 외부 API 호출 (API 키 사용 등)

## TypeScript 타입 규칙

### 타입 정의 원칙
**❌ any 타입 절대 금지**
```typescript
// ❌ 잘못된 예시
export async function someAction(prevState: any, formData: FormData) { }
const data: any = await fetchData()
```

**✅ 명시적 타입 정의**
```typescript
// ✅ 올바른 예시
type ActionState = { error?: string; success?: boolean } | null

export async function someAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> { }

interface UserData {
  id: string
  name: string
  email: string
}
const data: UserData = await fetchData()
```

### 타입 파일 구조
```
types/
  ├── auth.types.ts      # 인증 관련 타입
  ├── user.types.ts      # 사용자 관련 타입
  └── common.types.ts    # 공통 타입
```

## 네이밍 컨벤션

### 파일명
- Server Component: `FeatureName.tsx` 또는 `FeatureNameServer.tsx`
- Client Component: `FeatureNameClient.tsx`
- Server Actions: `actions.ts`
- Utils: `utils.ts`, `helpers.ts`

### 함수명
- Server Actions: `actionName` (camelCase)
- Utils: `utilityName` (camelCase)
- Components: `ComponentName` (PascalCase)

## 디렉토리 구조

```
adhub/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   ├── actions.ts
│   │   │   └── LoginForm.tsx
│   │   └── signup/
│   ├── dashboard/
│   └── api/           # API routes (필요시)
├── components/        # 공통 컴포넌트
│   ├── ui/           # UI 컴포넌트
│   └── shared/       # 공유 컴포넌트
├── utils/
│   ├── utils.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── constants.ts
├── types/            # TypeScript 타입 정의
└── lib/              # 라이브러리 설정
```

## 체크리스트

**새 기능 개발 전 확인사항:**
- [ ] Page는 Server Component인가?
- [ ] Server Actions는 actions.ts로 분리했는가?
- [ ] **any 타입을 사용하지 않았는가?** ⚠️
- [ ] **useState 대신 searchParams를 사용할 수 있는가?** ⚠️
- [ ] 훅이 필요하면 Client Component로 분리했는가?
- [ ] 중복 로직은 utils로 추출했는가?
- [ ] Client Component는 필요한 부분만 사용했는가?
- [ ] 병렬 처리가 가능한 부분은 Promise.all()을 사용했는가?
- [ ] 민감한 정보는 NestJS 백엔드에서 처리하는가?
- [ ] 성능 최적화를 고려했는가?
