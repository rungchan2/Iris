# 인증 시스템 구현 완료

## 📋 구현 내용

쿠키 기반 인증 및 권한 관리 시스템이 성공적으로 구현되었습니다.

### ✅ 완료된 작업

#### Phase 1: 쿠키 시스템 구축
- ✅ `lib/auth/cookie.ts` - 서버 쿠키 함수 (JWT 서명)
- ✅ `lib/auth/client-cookie.ts` - 클라이언트 쿠키 읽기
- ✅ `app/actions/auth.ts` - Server Actions (getCurrentUser, logout, updateProfile)

#### Phase 2: 권한 라우팅
- ✅ `middleware.ts` - 페이지별 권한 체크
  - Admin 경로: `/admin/*` (admin 역할만)
  - Photographer 경로: `/photographer-admin/*` (photographer 역할만)
  - 승인 대기 사진작가: 특정 페이지만 접근 가능

#### Phase 3: 상태 관리
- ✅ `stores/useUserStore.ts` - Zustand 스토어 (메모리 전용)
- ✅ `app/providers/UserProvider.tsx` - 서버 → 클라이언트 동기화
- ✅ `app/providers.tsx` - Provider 통합
- ✅ `app/layout.tsx` - RootLayout에 serverUser 전달

#### 추가 작업
- ✅ Zustand 설치
- ✅ jose (JWT) 라이브러리 설치
- ✅ TypeScript 타입 에러 수정
- ✅ 빌드 테스트 성공

---

## 🔧 필수 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가해야 합니다:

\`\`\`bash
# JWT Secret Key (서버 전용) - 32자 이상의 랜덤 문자열
JWT_SECRET_KEY="your-very-long-and-secure-random-secret-key-here"

# JWT Secret Key (클라이언트용) - 같은 값 사용
NEXT_PUBLIC_JWT_SECRET_KEY="your-very-long-and-secure-random-secret-key-here"
\`\`\`

### JWT Secret Key 생성 방법

터미널에서 다음 명령어로 안전한 랜덤 키를 생성하세요:

\`\`\`bash
# macOS/Linux
openssl rand -base64 32

# 또는 Node.js 사용
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
\`\`\`

---

## 📚 사용법

### 1. Server Components에서 사용

\`\`\`typescript
import { getUserCookie } from '@/lib/auth/cookie'

export default async function MyPage() {
  const user = await getUserCookie()

  if (!user) {
    return <div>로그인이 필요합니다</div>
  }

  return (
    <div>
      <h1>안녕하세요, {user.name}님</h1>
      <p>역할: {user.role}</p>
    </div>
  )
}
\`\`\`

### 2. Client Components에서 사용

\`\`\`typescript
'use client'
import { useUserStore } from '@/stores/useUserStore'

export function MyComponent() {
  const user = useUserStore(state => state.user)
  const isAdmin = useUserStore(state => state.isAdmin())

  if (!user) return null

  return (
    <div>
      <p>이름: {user.name}</p>
      {isAdmin && <AdminPanel />}
    </div>
  )
}
\`\`\`

### 3. Server Actions 사용

\`\`\`typescript
'use client'
import { logout, updateProfile } from '@/app/actions/auth'

export function LogoutButton() {
  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return <button onClick={handleLogout}>로그아웃</button>
}

export function UpdateProfileForm() {
  const handleSubmit = async (formData: FormData) => {
    await updateProfile({
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
    })
  }

  return <form action={handleSubmit}>...</form>
}
\`\`\`

---

## 🛣️ 권한 시스템

### Middleware 자동 체크

현재 구현된 권한 체크:

1. **Admin 경로** (`/admin/*`)
   - `user.role === 'admin'` 필수
   - 다른 역할은 홈으로 리다이렉트

2. **Photographer Admin 경로** (`/photographer-admin/*`)
   - `user.role === 'photographer'` 필수
   - 승인 대기 중(`approvalStatus === 'pending'`)인 경우:
     - `/photographer-admin/my-page` 또는 `/photographer/approval-status`만 접근 가능
     - 다른 페이지 접근 시 승인 상태 페이지로 리다이렉트

3. **인증 필요 경로** (`/booking`)
   - 로그인 필수
   - 미로그인 시 로그인 페이지로 리다이렉트 (redirect 파라미터 포함)

---

## 🔐 보안 특징

1. **JWT 서명**: 쿠키 내용은 암호화되어 클라이언트에서 수정 불가
2. **HttpOnly 미사용**: 클라이언트에서도 읽을 수 있지만, 변조 방지를 위해 서버에서 검증
3. **Middleware 검증**: 모든 요청에서 권한 체크
4. **자동 리다이렉트**: 권한 없는 페이지 접근 시 자동 리다이렉트

---

## 📁 생성된 파일

\`\`\`
lib/auth/
├── cookie.ts              # 서버 쿠키 함수
└── client-cookie.ts       # 클라이언트 쿠키 읽기

app/actions/
└── auth.ts               # Server Actions

app/providers/
└── UserProvider.tsx      # 유저 상태 동기화

stores/
└── useUserStore.ts       # Zustand 스토어

middleware.ts             # 권한 라우팅 (수정됨)
app/providers.tsx         # Provider 통합 (수정됨)
app/layout.tsx           # RootLayout (수정됨)
\`\`\`

---

## 🚀 다음 단계 (선택사항)

### 디렉토리 구조 재구성

현재 구조:
- `/admin/*` - 관리자 페이지
- `/photographer-admin/*` - 사진작가 페이지

권장 구조 (specs/abac-modified.md 참고):
\`\`\`
app/
├── (public)/              # 비로그인 접근 가능
│   ├── page.tsx
│   ├── login/
│   └── matching/
│
├── (authenticated)/       # 로그인 필수
│   ├── user/             # role: 'user'
│   ├── photographer/     # role: 'photographer'
│   └── admin/            # role: 'admin'
\`\`\`

이 구조 변경은 필수는 아니며, 현재 middleware가 동일한 기능을 제공합니다.

---

## 🐛 트러블슈팅

### 1. "Cannot find module 'jose'" 에러
\`\`\`bash
npm install jose
\`\`\`

### 2. "JWT_SECRET_KEY is not defined" 에러
- `.env.local` 파일에 `JWT_SECRET_KEY` 추가
- 개발 서버 재시작

### 3. 쿠키가 설정되지 않음
- 브라우저 개발자 도구 → Application → Cookies 확인
- `kindt-user` 쿠키가 있는지 확인
- 없다면 로그인 과정에서 `setUserCookie()` 호출 필요

### 4. 권한 체크가 작동하지 않음
- 서버 재시작 후 확인
- middleware.ts의 config.matcher 확인
- 브라우저 캐시 삭제 후 재시도

---

## 📝 참고

- 원본 설계 문서: `specs/abac-modified.md`
- JWT 라이브러리: [jose](https://github.com/panva/jose)
- Zustand 문서: [zustand](https://github.com/pmndrs/zustand)
