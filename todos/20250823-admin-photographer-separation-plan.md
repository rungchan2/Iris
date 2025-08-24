# 관리자(Admin)와 사진작가(Photographer) 시스템 분리 계획서

**작성일**: 2025년 8월 23일  
**진행 상태**: Phase 1 완료, Phase 2 진행 중  

---

## ✅ Phase 1: 데이터베이스 및 기본 구조 설정 (완료)

### 완료된 작업들

1. **✅ 새로운 `admins` 테이블 생성**
   - `admins` 테이블 구조 정의 및 생성
   - 적절한 RLS 정책 설정
   - 인덱스 및 트리거 추가

2. **✅ 데이터 마이그레이션**
   - 기존 Admin 사용자 데이터를 `photographers`에서 `admins`로 이관
   - `photographers` 테이블에서 `is_admin_account` 필드 제거

3. **✅ TypeScript 타입 업데이트**
   - 새로운 `admins` 테이블 타입 추가
   - `photographers` 타입에서 Admin 관련 필드 제거

4. **✅ 기본 Server Actions 생성**
   - `lib/actions/admin.ts` 생성 (Admin 전용 CRUD 작업)
   - 권한 검증 로직 포함

5. **✅ 권한 시스템 업데이트**
   - `lib/auth/permissions.ts` 업데이트 (새로운 Admin 테이블 참조)
   - `lib/hooks/use-permissions.ts` 업데이트 (클라이언트 측)

---

## 🚧 Phase 2: 인증 시스템 분리 (진행 중)

### 해야 할 작업들

1. **🔄 로그인 플로우 수정**
   - 사용자 타입별 자동 리디렉션 구현
   - Admin → `/admin`, Photographer → `/photographers`

2. **🔄 인증 미들웨어 업데이트**
   - 경로별 접근 권한 체크
   - Admin 페이지와 Photographer 페이지 간 크로스 접근 방지

3. **🔄 세션 관리 개선**
   - 각 사용자 타입별 세션 데이터 최적화

---

## ⏳ Phase 3: Admin 시스템 완성 (대기 중)

### 계획된 작업들

1. **Admin Layout 업데이트**
   - `app/admin/layout.tsx`에서 새로운 `admins` 테이블 참조
   - Admin 전용 sidebar 구현

2. **Admin Server Actions 완성**
   - 사용자 관리 기능 업데이트
   - 시스템 설정 기능 추가

3. **Admin 전용 페이지들**
   - 전체 시스템 통계
   - 사용자 관리 (Admin + Photographer)
   - 시스템 설정

---

## ⏳ Phase 4: Photographer 시스템 생성 (대기 중)

### 계획된 작업들

1. **새로운 Photographer Layout**
   - `app/photographers/layout.tsx` 생성
   - Photographer 전용 sidebar 구현

2. **Photographer Dashboard**
   - `app/photographers/page.tsx` 생성
   - 개인 성과 대시보드

3. **Photographer 전용 기능들**
   - 내 프로필 관리 (`/photographers/profile`)
   - 내 포트폴리오 관리 (`/photographers/portfolio`)
   - 내 예약 관리 (`/photographers/bookings`)
   - 내 리뷰 관리 (`/photographers/reviews`)
   - 개인 통계 (`/photographers/analytics`)

---

## 📊 현재 시스템 상태

### 데이터베이스
- ✅ `admins` 테이블: 생성 완료, 데이터 마이그레이션 완료
- ✅ `photographers` 테이블: Admin 관련 필드 제거 완료
- ✅ RLS 정책: 업데이트 완료

### 백엔드 (Server Actions)
- ✅ `lib/actions/admin.ts`: Admin 전용 CRUD 완료
- ⏳ `lib/actions/photographer.ts`: 기존 파일 확장 필요
- ✅ 권한 시스템: 새로운 구조로 업데이트 완료

### 프론트엔드
- ⏳ Admin Layout: 새로운 `admins` 테이블 참조로 업데이트 필요
- ⏳ Photographer Layout: 신규 생성 필요
- ✅ 권한 훅: 새로운 구조로 업데이트 완료

---

## 🎯 다음 단계 (Phase 2 완료)

1. **로그인 후 리디렉션 로직 구현**
2. **Admin Layout을 새로운 `admins` 테이블 기준으로 수정**
3. **기존 user-management.ts 파일 업데이트**
4. **Admin 페이지들의 권한 체크 로직 업데이트**

---

## 🔍 테스트 체크리스트

### Phase 1 테스트 (완료)
- ✅ `admins` 테이블 생성 확인
- ✅ 데이터 마이그레이션 확인
- ✅ TypeScript 컴파일 오류 없음 확인
- ✅ 권한 시스템 기본 동작 확인

### Phase 2 테스트 (진행 중)
- ⏳ Admin 로그인 후 `/admin` 접근 확인
- ⏳ Photographer 로그인 후 적절한 권한 확인
- ⏳ 크로스 접근 방지 확인

---

## ⚠️ 주의사항

1. **기존 사용자 세션**: 현재 로그인된 사용자들의 세션이 유지되어야 함
2. **데이터 정합성**: 마이그레이션 과정에서 데이터 손실 방지
3. **점진적 배포**: 단계별로 테스트하면서 진행
4. **롤백 계획**: 문제 발생 시 즉시 롤백 가능한 상태 유지

---

## 📈 예상 완료 시점

- **Phase 2**: 오늘 완료 목표
- **Phase 3**: 내일 (1일)
- **Phase 4**: 모레 (2일)
- **전체 완료**: 3일 내 목표

---

*이 문서는 프로젝트 진행상황에 따라 지속적으로 업데이트됩니다.*