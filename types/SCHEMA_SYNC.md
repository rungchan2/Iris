# Database Schema & Zod Schema Synchronization

이 문서는 데이터베이스 스키마와 Zod 스키마가 동기화되도록 보장하는 시스템에 대해 설명합니다.

## 📋 개요

데이터베이스 스키마가 변경되면 Zod 스키마도 함께 업데이트되어야 합니다. 이를 자동으로 감지하기 위해 **빌드 타임 타입 체크**를 사용합니다.

## 🎯 목표

1. **자동 감지**: DB 스키마 변경 시 빌드 타임에 에러 발생
2. **타입 안전성**: Zod 스키마와 DB 타입의 불일치 방지
3. **중앙 관리**: 모든 타입과 스키마를 `/types` 폴더에서 관리

## 🏗️ 시스템 구조

### 1. Database Types (자동 생성)
```bash
npm run gen-types
```
- `database.types.ts` 파일 자동 생성
- Supabase 스키마를 TypeScript 타입으로 변환

### 2. Zod Schemas (수동 관리)
각 도메인별 타입 파일:
- `inquiry.types.ts` - 예약/문의 폼
- `review.types.ts` - 리뷰 폼
- `user-management.types.ts` - 사용자 관리 폼

### 3. Type Compatibility Checks (필수)
각 Zod 스키마 파일에 포함:

```typescript
type _InquiryFormValuesCheck = {
  name: InquiryFormValues['name'] extends InquiryInsert['name']
    ? true
    : 'name type mismatch'

  phone: InquiryFormValues['phone'] extends InquiryInsert['phone']
    ? true
    : 'phone type mismatch'
}
```

## 🔄 작동 원리

### 시나리오 1: DB 스키마 변경 감지

```typescript
// Before: phone is optional
type InquiryInsert = {
  phone?: string | null
}

// Zod schema (현재)
const inquiryFormSchema = z.object({
  phone: z.string().optional()  // string | undefined
})

// Type check (통과)
type Check = {
  phone: (string | undefined) extends (string | null | undefined) ? true : 'mismatch'
  //     ✅ 통과: string | undefined는 string | null | undefined의 부분집합
}
```

```typescript
// After: DB 스키마 변경 - phone이 필수가 됨
type InquiryInsert = {
  phone: string  // null, undefined 불가
}

// Zod schema (아직 업데이트 안 됨)
const inquiryFormSchema = z.object({
  phone: z.string().optional()  // string | undefined
})

// Type check (실패)
type Check = {
  phone: (string | undefined) extends string ? true : 'mismatch'
  //     ❌ 에러: undefined가 string에 할당 불가
}
```

### 시나리오 2: 빌드 에러 발생

```bash
npm run build

# TypeScript Error:
# types/inquiry.types.ts:60:3 - error TS2322:
# Type '"phone type mismatch"' is not assignable to type 'true'.
#
# 60   phone: InquiryFormValues['phone'] extends InquiryInsert['phone'] ? true : 'phone type mismatch'
#       ~~~~~
```

### 시나리오 3: 수정

```typescript
// Zod 스키마 수정 필요
const inquiryFormSchema = z.object({
  phone: z.string()  // optional 제거
})

// Type check (다시 통과)
type Check = {
  phone: string extends string ? true : 'mismatch'
  //     ✅ 통과
}
```

## 📝 새 Form Schema 추가하기

### 1. 타입 파일 생성

```typescript
// types/payment.types.ts
import { z } from 'zod'
import type { Tables, TablesInsert, TablesUpdate } from './database.types'

// 1. Zod Schema 정의
export const paymentFormSchema = z.object({
  amount: z.number().min(0),
  buyer_name: z.string().min(1),
  buyer_email: z.string().email(),
})

export type PaymentFormData = z.infer<typeof paymentFormSchema>

// 2. Database Types
export type Payment = Tables<'payments'>
export type PaymentInsert = TablesInsert<'payments'>
export type PaymentUpdate = TablesUpdate<'payments'>

// 3. Type Compatibility Checks (필수!)
type _PaymentFormDataCheck = {
  amount: PaymentFormData['amount'] extends PaymentInsert['amount']
    ? true : 'amount type mismatch'
  buyer_name: PaymentFormData['buyer_name'] extends PaymentInsert['buyer_name']
    ? true : 'buyer_name type mismatch'
  buyer_email: PaymentFormData['buyer_email'] extends PaymentInsert['buyer_email']
    ? true : 'buyer_email type mismatch'
}
```

### 2. types/index.ts에 Export 추가

```typescript
export {
  paymentFormSchema,
  type PaymentFormData,
  type Payment,
  type PaymentInsert,
  type PaymentUpdate,
} from './payment.types'
```

### 3. 컴포넌트에서 사용

```typescript
import { paymentFormSchema, type PaymentFormData } from '@/types'

export function PaymentForm() {
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
  })
  // ...
}
```

## ⚠️ 주의사항

### 타입 변환이 필요한 경우

일부 필드는 폼과 DB에서 타입이 다를 수 있습니다:

```typescript
// 예: Date vs string
export const inquiryFormSchema = z.object({
  desired_date: z.date(),  // 폼에서는 Date 객체
})

// DB에서는 string (ISO 8601)
type InquiryInsert = {
  desired_date: string
}

// Type check에서 제외
type _InquiryFormValuesCheck = {
  // desired_date는 변환 계층에서 처리
  name: InquiryFormValues['name'] extends InquiryInsert['name'] ? true : 'mismatch'
}
```

### 선택적 필드 처리

```typescript
// Zod: optional()
z.string().optional()  // string | undefined

// DB: nullable
type Field = string | null

// Type check (통과하려면)
type Check = (string | undefined) extends (string | null | undefined) ? true : 'mismatch'
//           ✅ 통과
```

## 🚀 워크플로우

1. **DB 스키마 변경**
   ```bash
   # Supabase에서 migration 실행
   npm run gen-types  # database.types.ts 재생성
   ```

2. **빌드 실행**
   ```bash
   npm run build
   ```

3. **타입 에러 확인**
   - 에러 메시지에서 어떤 필드가 불일치하는지 확인
   - 해당 Zod 스키마 수정

4. **재빌드 & 검증**
   ```bash
   npm run build  # 에러 없이 통과해야 함
   ```

## 📊 현재 적용된 Schema

| 파일 | 대상 테이블 | 타입 체크 |
|------|------------|----------|
| `inquiry.types.ts` | `inquiries` | ✅ |
| `review.types.ts` | `reviews` | ✅ |
| `user-management.types.ts` | `users`, `photographers` | ✅ |

## 🔍 타입 체크 검증 방법

### 실제 불일치 테스트

```typescript
// 임시로 Zod 스키마의 타입을 변경해보기
const testSchema = z.object({
  name: z.number()  // DB는 string인데 number로 변경
})

// 빌드 실행
npm run build

// 예상 결과: 'name type mismatch' 에러 발생
```

## 📚 관련 문서

- [types/README.md](./README.md) - 전체 타입 시스템 가이드
- [CLAUDE.md](../CLAUDE.md) - 개발 가이드라인
- [database.types.ts](./database.types.ts) - 자동 생성된 DB 타입

## 🎯 핵심 규칙

1. ✅ **모든 Zod 스키마는 `/types` 폴더에 정의**
2. ✅ **타입 체크는 필수** (`_[Name]Check` 타입 정의)
3. ✅ **DB 스키마 변경 시 `npm run gen-types` 실행**
4. ✅ **빌드 에러 발생 시 Zod 스키마 업데이트**
5. ❌ **컴포넌트 안에서 Zod 스키마 정의 금지**
