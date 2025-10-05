# Iris 프로젝트 사용자 관리 시스템 최종 설계

## 📋 목차
1. [설계 철학 변경](#설계-철학-변경)
2. [저장소 전략: 쿠키 vs 세션 스토리지](#저장소-전략)
3. [페이지 기반 권한 라우팅](#페이지-기반-권한-라우팅)
4. [서버/클라이언트 통합 접근](#서버클라이언트-통합-접근)
5. [최소 권한 체크 시스템](#최소-권한-체크-시스템)
6. [구현 코드](#구현-코드)

---

## 🎯 설계 철학 변경

### AS-IS (이전 설계)
```
복잡한 권한 체크 함수들
  ↓
모든 컴포넌트에서 hasPermission() 호출
  ↓
복잡도 증가
```

### TO-BE (최종 설계)
```
권한별 페이지 경로 분리
  /admin/*     → 관리자만
  /photographer/* → 사진작가만
  /user/*      → 일반 유저만
  
Middleware에서 한 번만 체크
  ↓
페이지 내부는 권한 체크 불필요
```

**핵심 원칙**:
1. **페이지 = 권한**: 경로로 권한 구분, 컴포넌트별 체크 제거
2. **서버 우선**: 인증 정보는 서버에서 관리, 클라이언트는 읽기만
3. **단순화**: 복잡한 유틸 대신 middleware + RLS로 해결

---

## 🗄️ 저장소 전략: 쿠키 vs 세션 스토리지

### 비교 분석

| 저장소 | 서버 접근 | 클라이언트 접근 | 보안 | 추천도 |
|--------|----------|----------------|------|--------|
| **HttpOnly Cookie** | ✅ 자동 전송 | ❌ JS 접근 불가 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **일반 Cookie** | ✅ 자동 전송 | ✅ JS 접근 가능 | ⭐⭐⭐ | ⭐⭐⭐ |
| **LocalStorage** | ❌ 접근 불가 | ✅ JS 접근 가능 | ⭐⭐ | ⭐ |
| **SessionStorage** | ❌ 접근 불가 | ✅ JS 접근 가능 | ⭐⭐ | ⭐ |

### 🏆 최종 선택: HttpOnly Cookie + 일반 Cookie 하이브리드

**전략**:
```
[HttpOnly Cookie] (서버 전용)
  ├─ Supabase Auth Token (인증)
  └─ Session ID (민감 정보)

[일반 Cookie] (서버 + 클라이언트)
  └─ 암호화된 기본 유저 정보
      ├─ id
      ├─ name
      ├─ email
      ├─ role
      └─ approvalStatus
```

**이유**:
1. **서버 접근**: Cookie는 요청 시 자동 전송 (LocalStorage는 불가)
2. **클라이언트 접근**: 일반 Cookie는 JS에서 읽기 가능
3. **보안**: 암호화 + JWT 서명으로 변조 방지
4. **Next.js 최적**: `cookies()` 함수로 서버 컴포넌트에서 즉시 접근

---

## 🛣️ 페이지 기반 권한 라우팅

### 1. 디렉토리 구조

```
app/
├── (public)/              # 비로그인 접근 가능
│   ├── page.tsx           # 홈
│   ├── login/
│   └── matching/          # 익명 매칭
│
├── (authenticated)/       # 로그인 필수
│   ├── middleware.ts      # 인증 체크
│   │
│   ├── user/             # role: 'user'
│   │   ├── dashboard/
│   │   ├── inquiries/
│   │   └── bookings/
│   │
│   ├── photographer/     # role: 'photographer'
│   │   ├── layout.tsx    # 승인 상태 체크
│   │   ├── profile/
│   │   ├── portfolio/
│   │   ├── inquiries/
│   │   └── settlement/
│   │
│   └── admin/            # role: 'admin'
│       ├── users/
│       ├── photographers/
│       ├── approval/
│       └── analytics/
```

### 2. Middleware 권한 체크

**목적**: 페이지 진입 전 권한 검증 (한 곳에서만)

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromCookie } from '@/lib/auth/cookie';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. 쿠키에서 유저 정보 읽기
  const user = await getUserFromCookie(request);
  
  // 2. 인증 필요 경로
  const authRequired = pathname.startsWith('/user') 
    || pathname.startsWith('/photographer') 
    || pathname.startsWith('/admin');
  
  if (authRequired && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 3. 역할별 경로 체크
  if (pathname.startsWith('/admin') && user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  if (pathname.startsWith('/photographer')) {
    if (user?.role !== 'photographer') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    // 승인 대기 중인 작가는 프로필 페이지만 접근
    if (user.approvalStatus === 'pending' 
        && !pathname.startsWith('/photographer/profile')) {
      return NextResponse.redirect(new URL('/photographer/profile', request.url));
    }
  }
  
  if (pathname.startsWith('/user') && user?.role !== 'user') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/user/:path*',
    '/photographer/:path*',
    '/admin/:path*',
  ],
};
```

**핵심**:
- ✅ 권한 체크는 **middleware에서만** (컴포넌트에서 불필요)
- ✅ 페이지 진입 전 리다이렉트
- ✅ 사진작가 승인 상태 체크

---

## 🔄 서버/클라이언트 통합 접근

### 3. 쿠키 기반 유저 정보 관리

**핵심 원칙**:
- **서버**: `cookies()` 함수로 직접 읽기
- **클라이언트**: Zustand에 캐싱 (쿠키는 읽기만)
- **동기화**: 서버 → 클라이언트 단방향

#### 3-1. 쿠키 헬퍼 함수

```typescript
// lib/auth/cookie.ts

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'iris-user';
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY!);
const MAX_AGE = 60 * 60 * 24 * 7; // 7일

export interface UserCookie {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'photographer' | 'admin';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  profileImageUrl?: string;
}

// === 서버 컴포넌트용 ===

// 쿠키 저장 (로그인/프로필 업데이트 시)
export async function setUserCookie(user: UserCookie) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);

  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: false,      // 클라이언트에서도 읽기 가능
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

// 쿠키 읽기 (서버 컴포넌트)
export async function getUserCookie(): Promise<UserCookie | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as UserCookie;
  } catch {
    return null;
  }
}

// 쿠키 삭제 (로그아웃)
export function clearUserCookie() {
  cookies().delete(COOKIE_NAME);
}

// === Middleware용 ===

// Next.js Request 객체에서 쿠키 읽기
export async function getUserFromCookie(
  request: NextRequest
): Promise<UserCookie | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as UserCookie;
  } catch {
    return null;
  }
}
```

**특징**:
- ✅ `httpOnly: false`: 클라이언트도 읽을 수 있음 (하지만 변조 방지)
- ✅ JWT 서명: 클라이언트가 수정해도 서버가 거부
- ✅ 서버/클라이언트 양쪽 접근 가능

---

#### 3-2. 서버 액션 (DB 조회 + 쿠키 동기화)

```typescript
// app/actions/auth.ts
'use server';

import { unstable_cache } from 'next/cache';
import { setUserCookie, clearUserCookie } from '@/lib/auth/cookie';
import { createServerClient } from '@/lib/supabase/server';

// 현재 사용자 조회 (캐시 + 쿠키 업데이트)
export const getCurrentUser = unstable_cache(
  async () => {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      clearUserCookie();
      return null;
    }

    // DB에서 전체 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, name, role, phone')
      .eq('id', user.id)
      .single();

    if (!userData) return null;

    // 사진작가면 추가 정보
    let photographerData = null;
    if (userData.role === 'photographer') {
      const { data } = await supabase
        .from('photographers')
        .select('approval_status, profile_image_url')
        .eq('id', user.id)
        .single();
      
      photographerData = data;
    }

    const completeUser = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      approvalStatus: photographerData?.approval_status,
      profileImageUrl: photographerData?.profile_image_url,
    };

    // 쿠키 업데이트 (최신 정보 동기화)
    await setUserCookie({
      id: completeUser.id,
      email: completeUser.email,
      name: completeUser.name,
      role: completeUser.role,
      approvalStatus: completeUser.approvalStatus,
      profileImageUrl: completeUser.profileImageUrl,
    });

    return completeUser;
  },
  ['current-user'],
  { revalidate: 300, tags: ['user'] }
);

// 로그아웃
export async function logout() {
  const supabase = createServerClient();
  await supabase.auth.signOut();
  clearUserCookie();
}

// 프로필 업데이트 (쿠키도 함께 업데이트)
export async function updateProfile(updates: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const supabase = createServerClient();
  
  await supabase
    .from('users')
    .update({ name: updates.name })
    .eq('id', user.id);

  // 캐시 무효화
  const { revalidateTag } = await import('next/cache');
  revalidateTag('user');

  // 최신 정보 반환 (자동으로 쿠키 업데이트됨)
  return await getCurrentUser();
}
```

**흐름**:
1. DB 조회 (캐시됨)
2. 쿠키 자동 업데이트
3. 서버 컴포넌트/클라이언트 모두 최신 정보 사용

---

#### 3-3. 클라이언트에서 쿠키 읽기

```typescript
// lib/auth/client-cookie.ts
'use client';

import { jwtVerify } from 'jose';
import type { UserCookie } from './cookie';

const COOKIE_NAME = 'iris-user';
const SECRET = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET_KEY!);

// 브라우저에서 쿠키 읽기
export async function getUserFromBrowserCookie(): Promise<UserCookie | null> {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const userCookie = cookies.find(c => c.trim().startsWith(`${COOKIE_NAME}=`));

  if (!userCookie) return null;

  const token = userCookie.split('=')[1];

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as UserCookie;
  } catch {
    return null;
  }
}
```

---

### 4. Zustand: 클라이언트 캐시 전용

```typescript
// stores/useUserStore.ts
'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UserStore {
  user: UserCookie | null;
  isHydrated: boolean;
  
  setUser: (user: UserCookie | null) => void;
  clearUser: () => void;
  
  // 편의 함수
  isAdmin: () => boolean;
  isPhotographer: () => boolean;
  isApprovedPhotographer: () => boolean;
}

export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      user: null,
      isHydrated: false,

      setUser: (user) => {
        set({ user, isHydrated: true });
      },

      clearUser: () => {
        set({ user: null });
      },

      isAdmin: () => get().user?.role === 'admin',
      
      isPhotographer: () => get().user?.role === 'photographer',
      
      isApprovedPhotographer: () => {
        const user = get().user;
        return user?.role === 'photographer' && user.approvalStatus === 'approved';
      },
    }),
    { name: 'UserStore' }
  )
);
```

**변경점**:
- ❌ `persist` 제거 (쿠키가 저장소)
- ✅ 메모리 캐시 전용
- ✅ 권한 체크 함수는 최소화 (페이지 레벨에서 이미 체크됨)

---

### 5. Provider: 서버 → 클라이언트 동기화

```typescript
// app/providers/UserProvider.tsx
'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { getUserFromBrowserCookie } from '@/lib/auth/client-cookie';
import type { UserCookie } from '@/lib/auth/cookie';

export function UserProvider({
  children,
  serverUser,
}: {
  children: React.ReactNode;
  serverUser: UserCookie | null;
}) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    // 우선순위 1: 서버에서 전달된 유저
    if (serverUser) {
      setUser(serverUser);
      return;
    }

    // 우선순위 2: 브라우저 쿠키에서 읽기
    getUserFromBrowserCookie().then(setUser);
  }, [serverUser, setUser]);

  return <>{children}</>;
}
```

```typescript
// app/layout.tsx
import { getUserCookie } from '@/lib/auth/cookie';
import { UserProvider } from './providers/UserProvider';

export default async function RootLayout({ children }) {
  const user = await getUserCookie();

  return (
    <html>
      <body>
        <UserProvider serverUser={user}>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
```

---

## 🔒 최소 권한 체크 시스템

### 6. 페이지 레이아웃 가드 (필요한 경우만)

```typescript
// app/photographer/layout.tsx
import { getUserCookie } from '@/lib/auth/cookie';
import { redirect } from 'next/navigation';

export default async function PhotographerLayout({ children }) {
  const user = await getUserCookie();

  // Middleware가 체크하지만, 이중 확인
  if (!user || user.role !== 'photographer') {
    redirect('/unauthorized');
  }

  // 승인 대기 중이면 안내 표시
  if (user.approvalStatus === 'pending') {
    return (
      <div>
        <h1>승인 대기 중입니다</h1>
        <p>관리자 승인 후 이용 가능합니다.</p>
      </div>
    );
  }

  return <>{children}</>;
}
```

**핵심**:
- Middleware에서 이미 체크했으므로 **페이지 내부는 권한 체크 불필요**
- Layout에서만 승인 상태 등 세부 조건 체크

---

### 7. RLS: 최종 방어선

```sql
-- users 테이블 RLS
CREATE POLICY "users_select_policy"
ON users FOR SELECT
TO authenticated
USING (
  auth.is_admin() 
  OR auth.is_owner(id)
);

-- photographers 테이블 RLS
CREATE POLICY "photographers_select_policy"
ON photographers FOR SELECT
USING (
  auth.is_admin()
  OR approval_status = 'approved'
  OR auth.is_photographer_owner(id)
);
```

**3단계 보안**:
1. **Middleware**: 페이지 접근 차단
2. **Layout**: 승인 상태 등 세부 체크
3. **RLS**: DB 레벨 최종 방어

---

## 💾 저장소 비교 최종 정리

### 왜 쿠키인가?

```
LocalStorage/SessionStorage:
  ❌ 서버 접근 불가 → middleware에서 체크 못함
  ❌ XSS 취약 → 스크립트로 탈취 가능
  ❌ CSRF 방어 없음
  
HttpOnly Cookie (인증 토큰):
  ✅ 서버 자동 전송
  ✅ JS 접근 차단 (XSS 방어)
  ❌ 클라이언트 읽기 불가
  
일반 Cookie (유저 정보, 암호화):
  ✅ 서버 자동 전송
  ✅ 클라이언트 읽기 가능
  ✅ JWT 서명으로 변조 방지
  ✅ Next.js와 완벽한 호환
```

**최종 선택**: 일반 Cookie (JWT 서명) ⭐⭐⭐⭐⭐

---

## 📁 최종 파일 구조

```
app/
├── (public)/
│   ├── page.tsx
│   └── login/
│       └── page.tsx
│
├── (authenticated)/
│   ├── user/
│   │   └── dashboard/page.tsx
│   ├── photographer/
│   │   ├── layout.tsx        # 승인 상태 체크
│   │   ├── profile/page.tsx
│   │   └── portfolio/page.tsx
│   └── admin/
│       └── users/page.tsx
│
├── providers/
│   └── UserProvider.tsx
├── actions/
│   └── auth.ts
└── middleware.ts             # 권한 라우팅

lib/
├── auth/
│   ├── cookie.ts             # 서버 쿠키 함수
│   └── client-cookie.ts      # 클라이언트 쿠키 읽기
└── supabase/
    └── server.ts

stores/
└── useUserStore.ts           # Zustand (메모리 전용)

supabase/
└── migrations/
    └── xxx_rls_helpers.sql   # RLS 함수
```

---

## 🛣️ 구현 로드맵

### Phase 1: 쿠키 시스템 (1일)
1. ✅ `lib/auth/cookie.ts` - 서버 쿠키 함수
2. ✅ `lib/auth/client-cookie.ts` - 클라이언트 읽기
3. ✅ `app/actions/auth.ts` - getCurrentUser

### Phase 2: 권한 라우팅 (1일)
1. ✅ `middleware.ts` - 경로별 권한 체크
2. ✅ 디렉토리 구조 재구성
3. ✅ Layout 가드 (photographer)

### Phase 3: Zustand + Provider (0.5일)
1. ✅ `stores/useUserStore.ts` - 메모리 전용
2. ✅ `app/providers/UserProvider.tsx`
3. ✅ `app/layout.tsx` 적용

### Phase 4: RLS (1일)
1. ✅ RLS 헬퍼 함수
2. ✅ 핵심 테이블 RLS 적용

---

## 🎯 핵심 변경 사항

### 1. 복잡도 대폭 감소
- ❌ 컴포넌트별 `hasPermission()` 제거
- ✅ Middleware 한 곳에서만 체크

### 2. 서버/클라이언트 통합
- ❌ LocalStorage (서버 접근 불가)
- ✅ Cookie (양쪽 접근 가능)

### 3. 보안 강화
- ✅ JWT 서명 (변조 방지)
- ✅ Middleware (페이지 진입 차단)
- ✅ RLS (DB 최종 방어)

이제 정말 **심플하고 안전한** 시스템입니다! 🚀