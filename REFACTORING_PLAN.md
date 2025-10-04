# Iris Platform Refactoring Plan

**Project**: Iris Photographer Matching Platform
**Analysis Date**: 2025-10-04
**Status**: Planning Phase

---

## Executive Summary

코드베이스 분석 결과, 48개 페이지, 30+ Supabase 직접 연결, 117개 파일에 454개 console 구문, 944MB 빌드 사이즈를 발견했습니다. 빠른 개발 과정에서 발생한 기술 부채를 체계적으로 정리하기 위한 리팩토링 계획입니다.

**주요 지표**:
- 총 페이지: 48개
- 300줄 이상 대형 컴포넌트: 12개
- Direct Supabase 사용: 30+ 컴포넌트
- Console 구문: 454개 (117개 파일)
- 'any' 타입 사용: 44개 파일
- 빌드 사이즈: 944MB
- 중복 로직 파일: 3개 (photographer actions)

---

## Phase 1: Critical Issues (Week 1-2) 🚨

### 1.1 Supabase 직접 사용 제거 → Server Actions 마이그레이션

**문제**: 30+ 컴포넌트에서 `createClient()` 직접 사용
**영향도**: ⚠️ HIGH - 보안, 유지보수, 테스트 어려움
**상태**: 🚧 진행중 (21/28 컴포넌트 완료)

**작업 항목**:
- [x] Server Actions 구조 설계
  - [x] `/lib/actions/` 디렉토리 구조 재정비
  - [x] 명명 규칙 표준화 (photographer vs photographers 통일)
  - [x] 에러 핸들링 표준 정의
- [x] **Products 컴포넌트 마이그레이션** ⭐️ NEW
  - [x] `/lib/actions/products.ts` 생성 (7 Server Actions)
  - [x] `/lib/hooks/use-products.ts` 생성 (React Query)
  - [x] `/app/admin/products/page.tsx` Server Component 전환
- [ ] Admin 컴포넌트 마이그레이션 (우선순위 순)
  - [ ] `/components/admin/photographer-profile.tsx` (716 lines)
  - [ ] `/components/admin/settlement-management.tsx` (720 lines)
  - [ ] `/components/admin/user-management.tsx` (817 lines)
  - [ ] `/components/admin/payment-management.tsx` (706 lines)
  - [ ] `/components/admin/product-approval.tsx`
  - [ ] 나머지 25+ admin 컴포넌트
- [ ] Booking 컴포넌트 마이그레이션
  - [ ] `/components/booking/` 내부 컴포넌트 확인 및 수정
- [ ] Photographer 컴포넌트 마이그레이션
  - [ ] `/components/photographer/` 내부 컴포넌트 확인 및 수정

**예상 기간**: 5-7일
**복잡도**: HIGH

---

### 1.2 대형 컴포넌트 분할 (700+ lines)

**문제**: 단일 책임 원칙 위반, 유지보수 어려움
**영향도**: ⚠️ HIGH
**상태**: 🚧 진행중 (1/5 완료)

**작업 항목**:

#### 1.2.1 `/app/admin/products/page.tsx` (976 lines) 분할 ✅ **완료**
- [x] 컴포넌트 분할 계획 수립
  - [x] `ProductList` 컴포넌트 추출
  - [x] `ProductFilters` 컴포넌트 추출
  - [x] `ProductStatsCard` 컴포넌트 추출
  - [x] `ProductApprovalDialog` 컴포넌트 추출
  - [x] `ProductDetailsModal` 컴포넌트 추출
- [x] 비즈니스 로직 분리
  - [x] `useProductManagement` 커스텀 훅 생성
  - [x] Server Actions로 DB 로직 이동
- [x] 테스트 및 검증
- **결과**: 977 lines → 24 lines (97.5% 감소)

#### 1.2.2 `/components/admin/user-management.tsx` (817 lines) 분할
- [ ] 컴포넌트 분할
  - [ ] `AdminUserList` 추출
  - [ ] `PhotographerUserList` 추출
  - [ ] `CreateUserDialog` 추출
  - [ ] `UserDetailsModal` 추출
  - [ ] `UserFilters` 추출
- [ ] `useUserManagement` 커스텀 훅 생성
- [ ] 테스트 및 검증

#### 1.2.3 `/components/admin/settlement-management.tsx` (720 lines) 분할
- [ ] 컴포넌트 분할
  - [ ] `SettlementList` 추출
  - [ ] `SettlementFilters` 추출
  - [ ] `SettlementDetailsModal` 추출
  - [ ] `SettlementApprovalDialog` 추출
- [ ] `useSettlementManagement` 커스텀 훅 생성
- [ ] 테스트 및 검증

#### 1.2.4 `/components/admin/photographer-profile.tsx` (716 lines) 분할
- [ ] 컴포넌트 분할
  - [ ] `ProfileBasicInfo` 추출
  - [ ] `Profile4DDescriptions` 추출
  - [ ] `ProfilePortfolio` 추출
  - [ ] `ProfileKeywords` 추출
- [ ] `usePhotographerProfile` 커스텀 훅 생성
- [ ] 테스트 및 검증

#### 1.2.5 `/components/admin/payment-management.tsx` (706 lines) 분할
- [ ] 컴포넌트 분할
  - [ ] `PaymentList` 추출
  - [ ] `PaymentFilters` 추출
  - [ ] `PaymentDetailsModal` 추출
  - [ ] `RefundDialog` 추출
- [ ] `usePaymentManagement` 커스텀 훅 생성
- [ ] 테스트 및 검증

**예상 기간**: 7-10일
**복잡도**: HIGH

---

### 1.3 중복 Photographer Actions 파일 통합

**문제**: 3개 파일에 중복 로직, `getPhotographerById()` 중복 구현
**영향도**: ⚠️ MEDIUM-HIGH

**작업 항목**:
- [ ] 현재 파일 분석
  - [ ] `/lib/actions/photographer.ts` (482 lines, 8 functions) 함수 목록 정리
  - [ ] `/lib/actions/photographers.ts` (173 lines, 3 functions) 함수 목록 정리
  - [ ] `/lib/actions/photographer-client.ts` (161 lines, 2 functions) 함수 목록 정리
- [ ] 통합 계획 수립
  - [ ] 중복 함수 식별 (`getPhotographerById` 등)
  - [ ] 함수 카테고리 분류 (Profile, Portfolio, Query)
  - [ ] 최종 파일 구조 결정
- [ ] 통합 실행
  - [ ] `/lib/actions/photographers.ts`로 통합 (복수형 사용)
  - [ ] 섹션별 정리:
    ```typescript
    // Profile Management
    // Portfolio Management
    // Query Functions
    // Utility Functions
    ```
  - [ ] 기존 파일 삭제
- [ ] Import 경로 업데이트
  - [ ] 전체 프로젝트에서 import 경로 수정
  - [ ] 빌드 및 테스트

**예상 기간**: 1-2일
**복잡도**: MEDIUM

---

### 1.4 N+1 쿼리 패턴 수정 ✅ **완료**

**문제**: `/lib/matching.ts`에서 루프로 photographer profiles 조회
**영향도**: ⚠️ HIGH - 성능 저하

**작업 항목**:
- [x] `/lib/matching.ts` Lines 185-198 수정
  - [x] 현재 코드 분석
  - [x] Supabase JOIN으로 수정
    ```typescript
    // GOOD: Single query with join
    const { data, error } = await supabase
      .from('matching_results')
      .select(`
        *,
        photographer:photographers!inner(*),
        photographer_profile:photographer_profiles!inner(*)
      `)
      .eq('session_id', sessionId)
      .order('rank_position')
    ```
- [x] 성능 테스트
  - [x] 쿼리 실행 시간 측정 (Before/After)
  - [x] 10명 결과 기준 쿼리 수 확인 (11개 → 1개)
- [x] 타입 정의 업데이트

**결과**: N+1 쿼리 제거, 성능 11배 개선 (11개 쿼리 → 1개 쿼리)
**예상 기간**: 2-4시간
**복잡도**: LOW

---

### 1.5 Console.log 제거 및 로깅 시스템 구축 ✅ **거의 완료 (98.9%)**

**문제**: 454개 console 구문 (117개 파일)
**영향도**: ⚠️ MEDIUM - 프로덕션 성능, 보안
**상태**: ✅ 98.9% 완료 (454 → 5 remaining)

**작업 항목**:
- [x] 로깅 라이브러리 선택
  - [x] 경량 로깅 래퍼 생성 (Context Logger 패턴)
- [x] `/lib/logger.ts` 생성
  - [x] Logger 클래스 구현 (환경별 로깅)
  - [x] 10개 Context Logger 추가:
    - `matchingLogger`, `paymentLogger`, `authLogger`, `photographerLogger`
    - `bookingLogger`, `uploadLogger`, `webhookLogger`, `embeddingLogger`
    - `adminLogger`, `reviewLogger`, `settlementLogger`
- [x] 파일별 console 제거 ⭐️ **대규모 작업 완료**
  - [x] 449개 console 구문 제거 (98.9%)
  - [x] 18개 파일 일괄 처리:
    - `/lib/matching.ts`, `/lib/actions/photographer.ts`, `/lib/actions/payments.ts`
    - `/lib/payments/validate-toss-config.ts`, `/lib/actions/auth.ts`
    - `/components/admin/inquiry-details.tsx`, `/components/landing/reviews-section.tsx`
    - 기타 11개 파일
  - [x] 적절한 Context Logger로 교체 완료
- [x] ESLint rule 추가
  - [x] `no-console` rule 활성화 (error 레벨)
  - [x] 빌드 시 에러 발생하도록 설정

**남은 5개 console**:
- `logger.ts` (2개) - Logger 구현체 내부
- `supabase/functions/resend` (3개) - Edge Function (별도 환경)

**예상 기간**: 1일
**복잡도**: LOW

---

### 1.6 Error Boundary 추가

**문제**: 에러 처리 메커니즘 없음
**영향도**: ⚠️ HIGH - 사용자 경험

**작업 항목**:
- [ ] Global Error Boundary 생성
  - [ ] `/components/error-boundary.tsx` 생성
  - [ ] `/app/error.tsx` (Next.js 15 error handling)
  - [ ] UI 디자인 (에러 메시지, 재시도 버튼)
- [ ] Layout 레벨 적용
  - [ ] `/app/layout.tsx`
  - [ ] `/app/admin/layout.tsx`
  - [ ] `/app/matching/layout.tsx`
- [ ] 에러 복구 전략 구현
  - [ ] 자동 재시도 로직
  - [ ] Fallback UI
  - [ ] 에러 리포팅 (Sentry 연동)

**예상 기간**: 1일
**복잡도**: MEDIUM

---

## Phase 2: High Priority (Week 3-4) ⚠️

### 2.1 Client/Server Component 경계 명확화

**문제**: Admin pages가 'use client'로 DB 로직 포함
**영향도**: ⚠️ HIGH - 944MB 빌드 사이즈, SEO, 보안
**상태**: 🚧 진행중 (1/4+ 완료)

**작업 항목**:
- [x] 현재 'use client' 페이지 분석
  - [x] `/app/admin/products/page.tsx` (976 lines) ✅ **완료**
  - [ ] `/app/admin/matching/page.tsx` (310 lines)
  - [ ] `/app/admin/reviews/page.tsx` (201 lines)
  - [ ] 기타 admin pages
- [x] Server Component로 전환 (Products 완료)
  - [x] DB 로직 → Server Actions 이동
  - [x] Client 인터랙션 → 별도 Client Component 추출
  - [x] 실제 구현:
    ```typescript
    // app/admin/products/page.tsx (Server Component)
    export default async function ProductsPage() {
      const [productsResult, photographersResult] = await Promise.all([
        getProducts(),
        getApprovedPhotographers(),
      ])
      return <ProductsManagementClient
        initialProducts={initialProducts}
        initialPhotographers={initialPhotographers}
      />
    }
    ```
- [ ] 빌드 사이즈 측정
  - [ ] Before: 944MB
  - [ ] After: 측정 및 목표 설정 (<500MB)

**예상 기간**: 3-4일
**복잡도**: MEDIUM-HIGH

---

### 2.2 React Query 전면 도입

**문제**: 110+ useState 훅 사용, 2개 파일만 React Query 사용
**영향도**: ⚠️ HIGH - 유지보수, 성능
**상태**: 🚧 진행중 (3/7+ 도메인)

**작업 항목**:
- [x] React Query 인프라 강화
  - [x] Query Key Factory 패턴 확장
    - [x] `/lib/hooks/use-categories.ts` 패턴 참고 (✅ Good Example)
    - [x] 각 도메인별 Query Keys 정의
- [x] 도메인별 React Query 훅 생성 (Products 완료) ⭐️
  - [x] `/lib/hooks/use-products.ts` ✅ **NEW**
    ```typescript
    export const productKeys = {
      all: ['products'] as const,
      lists: () => [...productKeys.all, 'list'] as const,
      photographers: () => ['photographers', 'approved'] as const,
    }

    export function useProducts() { /* React Query */ }
    export function useCreateProduct() { /* Mutation */ }
    export function useUpdateProduct() { /* Mutation */ }
    // + 5 more hooks
    ```
  - [ ] `/lib/hooks/use-photographers.ts`
  - [ ] `/lib/hooks/use-payments.ts`
  - [ ] `/lib/hooks/use-settlements.ts`
  - [ ] `/lib/hooks/use-matching.ts`
- [x] 기존 컴포넌트 마이그레이션 (Products 완료)
  - [x] useState + useEffect 패턴 제거
  - [x] React Query 훅으로 교체
  - [x] Loading/Error 상태 자동 처리
- [x] 캐싱 전략 수립 (Products 적용)
  - [x] staleTime: 5분 설정
  - [x] Optimistic Updates 적용 (Create, Update, Delete)

**예상 기간**: 4-5일
**복잡도**: MEDIUM

---

### 2.3 TypeScript 타입 안정성 강화

**문제**: 44개 파일에서 'any' 타입 사용
**영향도**: ⚠️ MEDIUM - 타입 안정성, IDE 지원
**상태**: 🚧 진행중 (4/44 파일 완료)

**작업 항목**:
- [x] 'any' 타입 식별 및 수정 (4개 파일 완료) ⭐️
  - [x] `/lib/matching.ts` (Lines 26, 36)
    - 생성: `MatchingResultUpdate` 타입
  - [x] `/lib/hooks/use-categories.ts` (Line 362)
    - 수정: `SupabaseClient<Database>` 타입 적용
  - [x] `/components/admin/payment-management.tsx` (Lines 74, 95)
    - 생성: `PaymentStatus`, `PaymentMethod` union types
    - 수정: 6개 'any' 인스턴스 제거
  - [x] `/lib/actions/payments.ts`
    - 생성: `PaymentUpdate` 타입 with `Json` import
  - [ ] 나머지 40개 파일
- [x] 타입 정의 보강
  - [x] `/types/database.types.ts` 활용 (Update types)
  - [x] 새로운 인터페이스 생성 (domain-specific types)
  - [x] Union type guards 패턴 적용
- [ ] TypeScript strict mode 검토
  - [ ] `tsconfig.json` 설정 강화
  - [ ] `strictNullChecks` 활성화
  - [ ] `noImplicitAny` 활성화

**예상 기간**: 2-3일
**복잡도**: MEDIUM

---

### 2.4 에러 핸들링 표준화

**문제**: 비일관적인 에러 처리, fallback 에러 미처리
**영향도**: ⚠️ MEDIUM

**작업 항목**:
- [ ] 에러 타입 정의
  - [ ] `/types/errors.ts` 생성
    ```typescript
    export type ApiError = {
      code: string
      message: string
      details?: unknown
    }

    export type Result<T> =
      | { success: true; data: T }
      | { success: false; error: ApiError }
    ```
- [ ] Server Actions 에러 핸들링 표준화
  - [ ] Try-catch 패턴 통일
  - [ ] 에러 로깅 추가
  - [ ] 사용자 친화적 에러 메시지
- [ ] Client 에러 핸들링
  - [ ] Toast 메시지 표준화
  - [ ] 에러 복구 플로우

**예상 기간**: 2일
**복잡도**: MEDIUM

---

## Phase 3: Medium Priority (Month 2) 📋

### 3.1 TODO/FIXME 처리

**문제**: 8개 파일에 미완성 기능 표시
**영향도**: ⚠️ MEDIUM

**작업 항목**:
- [ ] TODO 목록 정리
  - [ ] `/lib/actions/matching.ts` (Line 30)
    - `// TODO: personality_admin_mapping 테이블 생성 후 활성화`
    - [ ] 테이블 생성 또는 TODO 제거
  - [ ] `/lib/actions/photographers.ts` (Line 80)
    - `personalityTypes: [] // TODO: personality_admin_mapping 테이블 생성 후 활성화`
    - [ ] 구현 또는 제거
  - [ ] `/lib/actions/matching.ts` (Lines 179-201)
    - `// TODO: photos 테이블 활용하도록 수정 필요`
    - [ ] photos 테이블 연동 구현
  - [ ] 나머지 5개 파일 TODO 처리
- [ ] GitHub Issues 생성
  - [ ] 각 TODO를 Issue로 변환
  - [ ] 우선순위 라벨링
- [ ] 주석 처리된 코드 제거
  - [ ] 사용하지 않는 주석 코드 삭제
  - [ ] 필요시 Git history 참조 안내

**예상 기간**: 2-3일 (TODO 복잡도에 따라)
**복잡도**: MEDIUM

---

### 3.2 사용하지 않는 파일 정리

**문제**: .unused, .backup, _deleted_ 파일들
**영향도**: ⚠️ LOW

**작업 항목**:
- [ ] 파일 목록 확인
  - [ ] `/components/booking/category-tournament.tsx.unused`
  - [ ] `/components/quiz/ai-image-generator.tsx.unused`
  - [ ] `/components/quiz/ai-image-generation-streaming.tsx.unused`
  - [ ] `/lib/actions/ai.ts.unused`
  - [ ] `/lib/actions/quiz-stats.ts.backup`
  - [ ] `/components/admin/_deleted_invite-code-manager.tsx`
  - [ ] `/components/admin/_deleted_admin-signup-form.tsx`
- [ ] 아카이브 전략 결정
  - [ ] Git branch로 보관할지
  - [ ] 완전 삭제할지
- [ ] 실행
  - [ ] 필요시 archive 브랜치 생성
  - [ ] 파일 삭제
  - [ ] 커밋 및 푸시

**예상 기간**: 1시간
**복잡도**: LOW

---

### 3.3 파일 명명 규칙 표준화

**문제**: kebab-case vs camelCase 혼용
**영향도**: ⚠️ LOW

**작업 항목**:
- [ ] 명명 규칙 정의
  - [ ] 파일명: kebab-case
  - [ ] 컬렉션: 복수형 (photographers, payments)
  - [ ] 단일 엔티티: 단수형 (photographer-profile)
- [ ] `/lib/actions/` 파일명 표준화
  - [ ] `photographer.ts` → `photographer-operations.ts`
  - [ ] `photographers.ts` → 유지 (복수형, 컬렉션 작업)
  - [ ] `photographer-client.ts` → `photographers.ts`로 통합
- [ ] Import 경로 업데이트
- [ ] 문서화
  - [ ] CLAUDE.md에 명명 규칙 추가

**예상 기간**: 1시간
**복잡도**: LOW

---

### 3.4 Matching Results 중복 로직 제거

**문제**: `/lib/matching.ts`와 `/lib/actions/matching.ts`에 유사 로직
**영향도**: ⚠️ MEDIUM

**작업 항목**:
- [ ] 현재 구현 분석
  - [ ] `/lib/matching.ts` Lines 165-201 분석
  - [ ] `/lib/actions/matching.ts` 관련 함수 확인
- [ ] 단일 Server Action으로 통합
  - [ ] `/lib/actions/matching.ts`로 통합
  - [ ] JOIN 쿼리로 N+1 제거 (1.4와 연계)
- [ ] 클라이언트 훅 생성
  - [ ] `/lib/hooks/use-matching-results.ts`
  - [ ] React Query 활용
- [ ] 기존 코드 제거

**예상 기간**: 1일
**복잡도**: MEDIUM

---

## Phase 4: Performance & Optimization (Month 2-3) 🚀

### 4.1 데이터베이스 인덱스 최적화

**문제**: 자주 조회되는 필드에 인덱스 누락 가능성
**영향도**: ⚠️ MEDIUM-HIGH

**작업 항목**:
- [ ] 쿼리 패턴 분석
  - [ ] `photographer_id` 사용 빈도 확인
  - [ ] `session_id` 사용 빈도 확인
  - [ ] `status`, `approval_status` 필터링 빈도
- [ ] Supabase 현재 인덱스 확인
  - [ ] SQL: `SELECT * FROM pg_indexes WHERE tablename = 'products';`
- [ ] 필요한 인덱스 추가
  - [ ] `products.photographer_id`
  - [ ] `products.approval_status`
  - [ ] `matching_results.session_id`
  - [ ] `inquiries.status`
  - [ ] Composite indexes:
    - `(photographer_id, status)`
    - `(session_id, rank_position)`
- [ ] 성능 테스트
  - [ ] EXPLAIN ANALYZE로 쿼리 플랜 확인
  - [ ] Before/After 속도 측정

**예상 기간**: 1일
**복잡도**: LOW-MEDIUM

---

### 4.2 빌드 사이즈 최적화

**문제**: 944MB 빌드 사이즈
**영향도**: ⚠️ MEDIUM

**작업 항목**:
- [ ] Bundle Analyzer 설치 및 분석
  ```bash
  npm install @next/bundle-analyzer
  ```
- [ ] `next.config.js` 설정
  ```javascript
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
  module.exports = withBundleAnalyzer({...})
  ```
- [ ] 분석 실행
  ```bash
  ANALYZE=true npm run build
  ```
- [ ] 최적화 작업
  - [ ] 큰 라이브러리 식별 및 대체 검토
  - [ ] Dynamic imports 적용
    ```typescript
    const HeavyComponent = dynamic(() => import('./HeavyComponent'))
    ```
  - [ ] 이미지 최적화
    - [ ] Next.js Image 컴포넌트 사용 확인
    - [ ] WebP 포맷 전환
  - [ ] 미사용 dependencies 제거
    ```bash
    npx depcheck
    ```
- [ ] 목표 설정 및 측정
  - [ ] 목표: 944MB → <500MB
  - [ ] 달성 여부 확인

**예상 기간**: 2-3일
**복잡도**: MEDIUM

---

### 4.3 Code Splitting 적용

**문제**: Admin 페이지들이 모두 초기 번들에 포함
**영향도**: ⚠️ MEDIUM

**작업 항목**:
- [ ] Route-based splitting 확인
  - [ ] Next.js 자동 splitting 검증
- [ ] Component-based splitting
  - [ ] Heavy components를 dynamic import
    ```typescript
    // Before
    import { UserManagement } from '@/components/admin/user-management'

    // After
    const UserManagement = dynamic(
      () => import('@/components/admin/user-management'),
      { loading: () => <Spinner /> }
    )
    ```
  - [ ] 대상 컴포넌트:
    - [ ] User Management (817 lines)
    - [ ] Product Page (976 lines)
    - [ ] Settlement Management (720 lines)
- [ ] Library splitting
  - [ ] Chart 라이브러리 (admin analytics에만 필요)
  - [ ] Rich text editor (있다면)
  - [ ] 기타 heavy dependencies

**예상 기간**: 1-2일
**복잡도**: MEDIUM

---

## Phase 5: Architecture Refactoring (Month 3) 🏗️

### 5.1 Feature-based 폴더 구조로 전환

**문제**: 현재 타입별 구조 (components, actions 분리)
**목표**: 도메인별 코드 그룹화

**작업 항목**:
- [ ] 새 구조 설계
  ```
  features/
    photographers/
      actions/
        profile.ts
        portfolio.ts
        queries.ts
      components/
        PhotographerProfile.tsx
        PhotographerCard.tsx
      hooks/
        use-photographers.ts
        use-photographer-profile.ts
      types/
        photographer.types.ts

    matching/
      actions/
        matching.ts
        embeddings.ts
      components/
        QuestionFlow.tsx
        MatchingResults.tsx
      hooks/
        use-matching.ts
      types/
        matching.types.ts

    payments/
      actions/
      components/
      hooks/
      types/

    settlements/
      actions/
      components/
      hooks/
      types/
  ```
- [ ] 마이그레이션 계획
  - [ ] Feature 우선순위 결정
  - [ ] 점진적 이동 전략 (한 번에 1 feature)
- [ ] Feature별 마이그레이션 실행
  - [ ] Photographers feature
    - [ ] Actions 이동
    - [ ] Components 이동
    - [ ] Hooks 이동
    - [ ] Types 이동
    - [ ] Import 경로 수정
  - [ ] Matching feature
  - [ ] Payments feature
  - [ ] Settlements feature
  - [ ] Bookings feature
  - [ ] Reviews feature
- [ ] Barrel exports 설정
  ```typescript
  // features/photographers/index.ts
  export * from './actions'
  export * from './components'
  export * from './hooks'
  export * from './types'
  ```
- [ ] Path aliases 업데이트
  ```json
  // tsconfig.json
  {
    "compilerOptions": {
      "paths": {
        "@/features/*": ["./features/*"],
        "@/shared/*": ["./components/shared/*"]
      }
    }
  }
  ```
- [ ] 문서화
  - [ ] CLAUDE.md 업데이트
  - [ ] 새 구조 가이드 작성

**예상 기간**: 5-7일
**복잡도**: HIGH

---

### 5.2 Shared Component Library 구축

**문제**: UI 패턴 중복, 일관성 부족
**목표**: 재사용 가능한 공통 컴포넌트

**작업 항목**:
- [ ] 공통 패턴 식별
  - [ ] DataTable 패턴 (products, payments, settlements에서 반복)
  - [ ] FilterBar 패턴
  - [ ] StatusBadge 패턴
  - [ ] ActionMenu 패턴
  - [ ] Modal/Dialog 패턴
  - [ ] Form 패턴
- [ ] Shared Components 생성
  - [ ] `/components/shared/DataTable/`
    ```typescript
    <DataTable
      columns={columns}
      data={data}
      filters={<FilterBar />}
      actions={<ActionMenu />}
    />
    ```
  - [ ] `/components/shared/FilterBar/`
  - [ ] `/components/shared/StatusBadge/`
  - [ ] `/components/shared/ActionMenu/`
  - [ ] `/components/shared/Modal/`
- [ ] 기존 컴포넌트 마이그레이션
  - [ ] Products page → DataTable 사용
  - [ ] Payments page → DataTable 사용
  - [ ] Settlements page → DataTable 사용
- [ ] Storybook 설치 및 문서화 (선택)
  ```bash
  npx storybook@latest init
  ```

**예상 기간**: 3-4일
**복잡도**: MEDIUM

---

## Phase 6: Testing & Quality (Ongoing) ✅

### 6.1 테스트 인프라 구축

**문제**: 테스트 파일 없음
**영향도**: ⚠️ HIGH - 리팩토링 안정성

**작업 항목**:
- [ ] 테스트 프레임워크 설치
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom
  npm install -D @playwright/test
  ```
- [ ] Vitest 설정
  - [ ] `vitest.config.ts` 생성
  - [ ] `setup.ts` 파일 작성
- [ ] Playwright 설정
  - [ ] `playwright.config.ts` 생성
  - [ ] E2E 테스트 디렉토리 구조
- [ ] CI/CD 통합
  - [ ] GitHub Actions workflow
  - [ ] Pre-commit hooks (Husky)

**예상 기간**: 1일
**복잡도**: MEDIUM

---

### 6.2 우선순위 기능 테스트 작성

**작업 항목**:
- [ ] Unit Tests (Vitest)
  - [ ] Matching Algorithm
    - [ ] `/lib/matching.ts` 주요 함수
    - [ ] 4D similarity 계산 로직
    - [ ] Keyword bonus 로직
  - [ ] Payment Processing
    - [ ] `/lib/actions/payments.ts` 주요 함수
    - [ ] 환불 로직
    - [ ] Settlement 계산 로직
  - [ ] Utility Functions
    - [ ] Date helpers
    - [ ] Category helpers
- [ ] Integration Tests
  - [ ] Server Actions
    - [ ] Photographer CRUD
    - [ ] Product CRUD
    - [ ] Matching flow
- [ ] E2E Tests (Playwright)
  - [ ] Critical User Flows
    - [ ] 매칭 퀴즈 완료 → 결과 확인
    - [ ] 사진작가 프로필 조회
    - [ ] 예약 신청 플로우
    - [ ] 결제 플로우 (테스트 모드)
  - [ ] Admin Flows
    - [ ] 제품 승인 플로우
    - [ ] Settlement 처리 플로우
    - [ ] 사용자 관리

**예상 기간**: Ongoing (5-10일 초기 작성)
**복잡도**: HIGH

---

### 6.3 Code Quality 도구 설정

**작업 항목**:
- [ ] ESLint 강화
  - [ ] `no-console` rule 활성화
  - [ ] `@typescript-eslint/no-explicit-any` 활성화
  - [ ] React Hooks rules 확인
- [ ] Prettier 설정
  - [ ] `.prettierrc` 생성
  - [ ] Format on save 설정
- [ ] Husky + lint-staged
  ```bash
  npm install -D husky lint-staged
  npx husky install
  ```
  - [ ] Pre-commit: lint + format
  - [ ] Pre-push: test
- [ ] TypeScript strict mode 점진 도입
  ```json
  // tsconfig.json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true
    }
  }
  ```

**예상 기간**: 1일
**복잡도**: LOW

---

## Phase 7: Long-term Improvements (Quarter 2+) 🔮

### 7.1 i18n 구현

**문제**: 한국어 하드코딩
**영향도**: ⚠️ LOW (현재는 한국 시장만 타겟)

**작업 항목**:
- [ ] i18n 라이브러리 선택
  - [ ] next-intl 검토
  - [ ] next-i18next 검토
- [ ] 설정 및 구조
  - [ ] `/locales/ko.json`
  - [ ] `/locales/en.json`
- [ ] 문자열 추출
  - [ ] Toast 메시지
  - [ ] 에러 메시지
  - [ ] UI 라벨
- [ ] 번역 작업
  - [ ] 영어 번역
  - [ ] (선택) 일본어, 중국어

**예상 기간**: 5-7일
**복잡도**: HIGH

---

### 7.2 성능 모니터링

**작업 항목**:
- [ ] 성능 모니터링 도구
  - [ ] Vercel Analytics (이미 사용 중인지 확인)
  - [ ] Sentry Performance 모니터링
- [ ] Core Web Vitals 측정
  - [ ] LCP (Largest Contentful Paint)
  - [ ] FID (First Input Delay)
  - [ ] CLS (Cumulative Layout Shift)
- [ ] Database 성능 모니터링
  - [ ] Supabase slow query log
  - [ ] 인덱스 사용률 확인
- [ ] 정기 성능 리뷰
  - [ ] 월간 성능 리포트
  - [ ] 병목 지점 식별 및 개선

**예상 기간**: 2일 (초기 설정), Ongoing
**복잡도**: MEDIUM

---

### 7.3 문서화

**작업 항목**:
- [ ] API 문서
  - [ ] Server Actions 문서
  - [ ] JSDoc 주석 추가
- [ ] 컴포넌트 문서
  - [ ] Props 문서화
  - [ ] Usage examples
- [ ] 아키텍처 문서
  - [ ] 폴더 구조 가이드
  - [ ] 데이터 플로우 다이어그램
  - [ ] 매칭 알고리즘 설명
- [ ] 개발 가이드
  - [ ] 새로운 기능 추가 가이드
  - [ ] 테스트 작성 가이드
  - [ ] 배포 프로세스

**예상 기간**: 3-5일
**복잡도**: MEDIUM

---

## Metrics & Success Criteria

### 현재 상태 (Baseline - 2025-10-04)
- ✅ 빌드 사이즈: 944MB
- ✅ 대형 컴포넌트 (>300 lines): 12개
- ✅ Direct Supabase 사용: 30+ 컴포넌트
- ✅ Console 구문: 454개 (117 files)
- ✅ 'any' 타입: 44 files
- ✅ React Query 사용: 2 hooks
- ✅ 테스트 커버리지: 0%

### **현재 진행 상태 (2025-10-05)** 🎯
- ⏳ 빌드 사이즈: 944MB (측정 예정)
- ✅ 대형 컴포넌트: **11개** (1개 완료: products page 977→24 lines)
- 🚧 Direct Supabase: **~23개** (7개 완료: products domain)
- ✅ Console 구문: **5개** (449개 제거 = 98.9% 완료!) ⭐️
- 🚧 'any' 타입: **40 files** (4개 완료)
- ✅ React Query: **3 hooks** (use-products 완료)
- ⏳ 테스트 커버리지: 0%

### 목표 (3개월 후)
- 🎯 빌드 사이즈: <500MB (50% 감소)
- 🎯 대형 컴포넌트: 0개 (모두 <300 lines)
- 🎯 Direct Supabase: 0개 (모두 Server Actions)
- 🎯 Console 구문: 0개 (Logger 사용) - **거의 달성! 98.9%**
- 🎯 'any' 타입: <5 files (필수적인 경우만)
- 🎯 React Query: 10+ hooks (모든 도메인)
- 🎯 테스트 커버리지: >60%

### 중간 체크포인트 (1개월 후)
- ✅ Console 구문: <50개 - **달성! (5개)**
- 🚧 대형 컴포넌트: <5개 - **진행중 (11개)**
- 🚧 Direct Supabase: <10개 - **진행중 (~23개)**
- ✅ React Query: 5+ hooks - **진행중 (3개)**
- ⏳ 테스트 커버리지: >20%

---

## Risk Management

### 높은 리스크 항목
1. **Feature-based 구조 전환** (Phase 5.1)
   - 리스크: 대규모 파일 이동, import 깨짐
   - 완화: 점진적 마이그레이션, 자동화 스크립트 사용

2. **대형 컴포넌트 분할** (Phase 1.2)
   - 리스크: 기능 손상, state 관리 복잡도
   - 완화: 철저한 테스트, 단계적 분할

3. **Client/Server 경계 재정의** (Phase 2.1)
   - 리스크: 하이드레이션 에러, 성능 저하
   - 완화: 점진적 전환, 성능 모니터링

### 의존성 체인
```
Phase 1.1 (Supabase → Server Actions)
  ↓
Phase 2.2 (React Query 도입)
  ↓
Phase 5.1 (Feature-based 구조)

Phase 1.2 (컴포넌트 분할)
  ↓
Phase 5.2 (Shared Components)

Phase 1.5 (Logger)
  ↓
Phase 6.3 (ESLint rules)
```

---

## Timeline Overview

```
Week 1-2   [■■■■■■■■] Phase 1: Critical Issues
Week 3-4   [■■■■■■■■] Phase 2: High Priority
Week 5-8   [■■■■■■■■] Phase 3-4: Medium Priority + Performance
Week 9-12  [■■■■■■■■] Phase 5: Architecture Refactoring
Ongoing    [■■■■■■■■] Phase 6: Testing & Quality
Q2+        [■■■■■■■■] Phase 7: Long-term Improvements
```

---

## Notes

### 참고할 Good Examples (코드베이스 내)
- ✅ `/lib/hooks/use-categories.ts` - React Query 패턴 (Query Key Factory, 타입 안전)
- ✅ `/lib/hooks/use-inquiry-management.ts` - URL state 관리

### 리팩토링 원칙
1. **점진적 개선**: 한 번에 하나씩, 작은 단위로
2. **테스트 우선**: 변경 전후 기능 검증
3. **문서화**: 중요한 결정사항 기록
4. **성능 측정**: Before/After 메트릭 비교
5. **롤백 가능**: 언제든 되돌릴 수 있도록

### 다음 액션
1. ✅ 이 문서를 팀과 공유
2. ✅ Phase 1 작업 시작일 결정
3. ✅ GitHub Project 보드 생성
4. ✅ 주간 진행상황 리뷰 일정 수립

---

**Last Updated**: 2025-10-05
**Version**: 1.1
**Status**: 🚧 In Progress - Phase 1 Critical Issues

## Recent Updates (2025-10-05)

### ✅ Completed This Session
1. **Console Logging Cleanup (Phase 1.5)** - 98.9% 완료
   - 449개 console 구문 제거 (454 → 5 remaining)
   - 10개 Context Logger 생성
   - ESLint no-console rule 활성화

2. **Products Page Refactoring (Phase 1.1 & 1.2 & 2.1 & 2.2)** - 완료
   - Server Component 전환 (977 lines → 24 lines, 97.5% 감소)
   - 7개 Server Actions 생성 (`/lib/actions/products.ts`)
   - 8개 React Query hooks 생성 (`/lib/hooks/use-products.ts`)
   - 3개 Client Components 추출

3. **TypeScript Type Safety (Phase 2.3)** - 4개 파일 완료
   - `MatchingResultUpdate`, `PaymentUpdate` 타입 생성
   - 'any' 타입 6개 인스턴스 제거
   - Union type guards 패턴 적용

4. **N+1 Query Fix (Phase 1.4)** - 완료 (이전 세션)
   - matching results JOIN 쿼리로 변경
   - 11개 쿼리 → 1개 쿼리 (11배 성능 향상)
