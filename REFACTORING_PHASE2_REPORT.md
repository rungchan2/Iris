# 🔧 Phase 2: 컴포넌트 코드 라인 수 줄이기 - 실행 계획

## 📋 개요
Phase 1 분석 결과를 바탕으로 500+ 라인 컴포넌트를 리팩토링하여 코드 가독성과 유지보수성을 향상시킵니다.

## 🎯 목표
- 컴포넌트당 최대 300 라인 이하로 축소
- 인라인 타입/함수 추출
- 서브 컴포넌트로 분리
- 재사용 가능한 유틸리티 함수 생성

## 📊 대상 파일 (5개)

### 1. personal-info-form.tsx (934 → ~250 라인 목표)
**현재 문제점:**
- 4단계 폼이 하나의 컴포넌트에 모두 포함
- 인라인 함수 8개 이상
- useEffect 2개 (form watch, phone formatting)
- 복잡한 JSX 구조

**리팩토링 계획:**
- [x] 인라인 함수 추출 → `lib/utils/booking-form.utils.ts`
  - `isDateAvailable`
  - `getDateModifiers`
  - `formatPhoneNumber` (useEffect → 유틸 함수)

- [x] 서브 컴포넌트 분리
  - `PersonalInfoSection.tsx` - 개인정보 입력 (1단계)
  - `AdditionalInfoSection.tsx` - 추가정보 입력 (2단계)
  - `ProductSelectionSection.tsx` - 상품 선택 (3단계)
  - `PaymentSection.tsx` - 결제 (4단계)
  - `BookingSummary.tsx` - 예약 정보 요약 카드

- [x] 커스텀 훅 생성
  - `useBookingForm.ts` - 폼 로직 통합
  - `usePhoneFormatter.ts` - 전화번호 포맷팅 로직

### 2. photographer-signup-form.tsx (929 → ~300 라인 목표)
**현재 문제점:**
- 다단계 회원가입 폼
- 이미지 업로드 로직 인라인
- 복잡한 validation

**리팩토링 계획:**
- [ ] 스텝별 컴포넌트 분리
  - `BasicInfoStep.tsx`
  - `ContactInfoStep.tsx`
  - `SpecialtyStep.tsx`
  - `PricingStep.tsx`
  - `PortfolioStep.tsx`

- [ ] 이미지 업로드 로직 분리
  - `lib/utils/image-upload.utils.ts`
  - `useImageUpload.ts` 커스텀 훅

### 3. admin/matching/settings/page.tsx (881 → ~300 라인 목표)
**현재 문제점:**
- Supabase 직접 호출 (Server Component 패턴 위반)
- 많은 상태 관리

**리팩토링 계획:**
- [ ] Server Actions 생성
  - `lib/actions/matching-settings.ts`

- [ ] 커스텀 훅 생성
  - `use-matching-settings.ts`

- [ ] 컴포넌트 분리
  - `MatchingSettingsClient.tsx`
  - 각 설정 섹션별 서브 컴포넌트

### 4. admin/analytics/matching-analytics-dashboard.tsx (871 → ~300 라인 목표)
**리팩토링 계획:**
- [ ] 차트 컴포넌트 분리
- [ ] 통계 카드 컴포넌트 분리
- [ ] 데이터 페칭 로직 커스텀 훅으로

### 5. admin/payment-management.tsx (831 → ~300 라인 목표)
**리팩토링 계획:**
- [ ] 결제 관리 로직 Server Actions로
- [ ] 테이블 컴포넌트 분리
- [ ] 필터/검색 컴포넌트 분리

## 🔄 공통 리팩토링 패턴

### 1. 인라인 타입 정의 추출
```typescript
// Before (컴포넌트 내부)
interface Props { ... }

// After
// types/booking.types.ts
export interface PersonalInfoFormProps { ... }
```

### 2. 인라인 함수 추출
```typescript
// Before (컴포넌트 내부)
const formatPhone = (value: string) => { ... }

// After
// lib/utils/format.utils.ts
export function formatPhoneNumber(value: string) { ... }
```

### 3. useEffect 데이터 페칭 → 커스텀 훅
```typescript
// Before
useEffect(() => {
  const supabase = createClient()
  supabase.from('table').select('*')
}, [])

// After
const { data } = useTableData()
```

### 4. 서브 컴포넌트 분리
```typescript
// Before (하나의 큰 컴포넌트)
function BigForm() {
  return (
    <>
      {/* 1단계 - 200줄 */}
      {/* 2단계 - 200줄 */}
      {/* 3단계 - 200줄 */}
    </>
  )
}

// After
function BigForm() {
  return (
    <>
      <Step1 />
      <Step2 />
      <Step3 />
    </>
  )
}
```

## 📈 예상 효과
- 코드 라인 수: 4,445 → ~1,500 라인 (66% 감소)
- 컴포넌트 재사용성 증가
- 테스트 용이성 향상
- 유지보수성 대폭 개선

## 🚀 실행 순서
1. ✅ personal-info-form.tsx 리팩토링
2. ⏳ photographer-signup-form.tsx 리팩토링
3. ⏳ admin/matching/settings/page.tsx 리팩토링
4. ⏳ admin/analytics 리팩토링
5. ⏳ admin/payment-management.tsx 리팩토링

---
*작성일: 2025-10-12*
*Phase: 2/4*
