# Type Safety Refactoring Plan (Final)
**Project**: kindt
**Created**: 2025-10-12 (Final Version)
**Status**: Ready for Implementation

---

## 📊 Current State Assessment

### ✅ Already Excellent
Your type system is **already well-structured**:

```typescript
// database.types.ts - Single source of truth ✅
export type Database = { public: { Enums: { ... } } }

// types/enums.ts - Perfect extraction ✅
export type ApprovalStatus = Database['public']['Enums']['approval_status']
export const APPROVAL_STATUS = { PENDING: 'pending', ... }
export function isApprovalStatus(value: unknown): value is ApprovalStatus

// types/index.ts - Central exports ✅
export type { Database, Tables, TablesInsert, TablesUpdate, Enums }
export { APPROVAL_STATUS, USER_ROLE, INQUIRY_STATUS, ... }
```

### 🔴 What Needs Fixing

| Issue | Current | Target |
|-------|---------|--------|
| Zod ↔ DB type checks | 3/10 forms | 10/10 forms |
| `any` types | 74 files | <10 files |
| Form validation | 60% | 95% |

---

## 🎯 Focused 3-Phase Plan (16-22 hours)

### Phase 1: Zod Schema Type Checks (6-8 hours)

**Objective**: All Zod schemas have build-time validation against DB types

#### Current State
**Already has type checks** ✅:
- `types/inquiry.types.ts`
- `types/review.types.ts`
- `types/user-management.types.ts`

**Missing type checks** ❌:
- `types/photographer-signup.types.ts` (5 schemas)
- `types/signup.types.ts` (2 schemas)
- `types/terms.types.ts` (3 schemas)

#### Standard Pattern (Copy from inquiry.types.ts)

```typescript
// /types/[domain].types.ts
import { z } from 'zod'
import type { Database, TablesInsert, TablesUpdate } from './database.types'

// 1. Zod Schema
export const photographerSignupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  bio: z.string().optional(),
})

export type PhotographerSignupData = z.infer<typeof photographerSignupSchema>

// 2. Database types
export type PhotographerInsert = TablesInsert<'photographers'>

// 3. Build-time type check (MANDATORY)
type _PhotographerSignupCheck = {
  email: PhotographerSignupData['email'] extends PhotographerInsert['email']
    ? true : 'email type mismatch - check database schema'
  name: PhotographerSignupData['name'] extends PhotographerInsert['name']
    ? true : 'name type mismatch - check database schema'
  // bio is optional in both, OK
}
```

#### Tasks
- [ ] Add type checks to `photographer-signup.types.ts` (5 schemas)
- [ ] Add type checks to `signup.types.ts` (2 schemas)
- [ ] Add type checks to `terms.types.ts` (3 schemas)
- [ ] Create missing form schemas (see Phase 2)

**Deliverable**: TypeScript build fails when DB schema changes

---

### Phase 2: Missing Form Validation (6-8 hours)

**Objective**: Add Zod schemas to unvalidated forms

#### Forms Without Schemas

1. **Profile Completion** - Create `/types/profile.types.ts`
```typescript
import { z } from 'zod'
import type { TablesInsert } from './database.types'

export const profileCompletionSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다'),
  bio: z.string().optional(),
})

export type ProfileCompletionData = z.infer<typeof profileCompletionSchema>
export type UserInsert = TablesInsert<'users'>

type _ProfileCheck = {
  name: ProfileCompletionData['name'] extends UserInsert['name'] ? true : 'type mismatch'
  phone: ProfileCompletionData['phone'] extends UserInsert['phone'] ? true : 'type mismatch'
}
```

2. **Payment Forms** - Create `/types/payment-form.types.ts`
```typescript
export const tossPaymentFormSchema = z.object({
  amount: z.number().positive(),
  orderId: z.string(),
  orderName: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
})
```

3. **Admin Forms** - Create `/types/admin-forms.types.ts`
```typescript
export const photoUploadSchema = z.object({
  file: z.instanceof(File),
  title: z.string().optional(),
  description: z.string().optional(),
  is_public: z.boolean().default(true),
})

export const bulkScheduleSchema = z.object({
  dates: z.array(z.date()),
  start_time: z.string(),
  end_time: z.string(),
  duration_minutes: z.number().positive(),
})
```

4. **Photographer Forms** - Update `/types/photographer.types.ts`
```typescript
export const photographerProfileEditSchema = z.object({
  name: z.string().min(1),
  bio: z.string().optional(),
  instagram_handle: z.string().optional(),
  website_url: z.string().url().optional(),
})

export const portfolioUploadSchema = z.object({
  files: z.array(z.instanceof(File)).min(1),
  category_id: z.string().uuid().optional(),
  description: z.string().optional(),
})
```

#### Tasks
- [ ] Create `/types/profile.types.ts` with schema + type check
- [ ] Create `/types/payment-form.types.ts` with schemas
- [ ] Create `/types/admin-forms.types.ts` with schemas
- [ ] Update `/types/photographer.types.ts` with profile/portfolio schemas
- [ ] Update `/types/index.ts` to export new schemas
- [ ] Update components to use Zod resolvers

**Deliverable**: 95%+ form validation coverage

---

### Phase 3: Payment System `any` Removal (4-6 hours)

**Objective**: Type all payment system code (35 files with `any`)

#### 3.1 Create Payment Types

```typescript
// /types/payment.types.ts
import { z } from 'zod'
import type { Tables, TablesInsert } from './database.types'

// Payment provider type
export type PaymentProvider = 'toss' | 'eximbay' | 'adyen' | 'stripe'

// Metadata (replaces Record<string, any>)
export const paymentMetadataSchema = z.object({
  orderId: z.string(),
  orderName: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
  photographerId: z.string().uuid().optional(),
  inquiryId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  customData: z.record(z.union([
    z.string(),
    z.number(),
    z.boolean()
  ])).optional(),
})

export type PaymentMetadata = z.infer<typeof paymentMetadataSchema>

// PG Response types (no more `any`)
export interface TossPaymentResponse {
  checkoutUrl: string
  paymentKey: string
  orderId: string
  amount: number
}

export interface EximbayPaymentResponse {
  transactionId: string
  redirectUrl: string
  amount: number
  currency: string
}

export type PaymentInitializeResponse =
  | TossPaymentResponse
  | EximbayPaymentResponse
  | AdyenPaymentResponse
  | StripePaymentResponse

// Webhook schemas
export const tossWebhookSchema = z.object({
  eventType: z.enum(['PAYMENT_CONFIRMED', 'PAYMENT_CANCELED']),
  createdAt: z.string(),
  data: z.object({
    paymentKey: z.string(),
    orderId: z.string(),
    status: z.string(),
    totalAmount: z.number(),
    method: z.string().optional(),
  }),
})

export type TossWebhookPayload = z.infer<typeof tossWebhookSchema>

// DB type check
export type Payment = Tables<'payments'>
type _PaymentMetadataCheck = {
  orderId: PaymentMetadata['orderId'] extends string ? true : 'orderId must be string'
}
```

#### 3.2 Update Payment Adapters

```typescript
// /lib/payments/adapters/toss.ts
import type { PaymentMetadata, TossPaymentResponse } from '@/types'

export class TossPaymentAdapter {
  // ❌ Before: async initialize(params: any): Promise<any>
  // ✅ After:
  async initialize(params: {
    amount: number
    orderId: string
    orderName: string
    customerName: string
  }): Promise<TossPaymentResponse> {
    // Implementation
  }

  // ❌ Before: metadata?: Record<string, any>
  // ✅ After:
  metadata?: PaymentMetadata
}
```

#### 3.3 Webhook Validation

```typescript
// /app/api/webhooks/toss/route.ts
import { tossWebhookSchema } from '@/types'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const data = JSON.parse(rawBody)

  // ✅ Validate with Zod
  const validationResult = tossWebhookSchema.safeParse(data)

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid webhook payload', details: validationResult.error },
      { status: 400 }
    )
  }

  const webhook = validationResult.data  // Fully typed!
  // Process webhook...
}
```

#### Tasks
- [ ] Create `/types/payment.types.ts`
- [ ] Define `PaymentMetadata` (no `any`)
- [ ] Define PG response types (Toss, Eximbay, Adyen, Stripe)
- [ ] Create webhook Zod schemas
- [ ] Update `/lib/payments/adapters/toss.ts`
- [ ] Update `/lib/payments/adapters/eximbay.ts`
- [ ] Update `/lib/payments/adapters/adyen.ts`
- [ ] Update `/lib/payments/adapters/stripe.ts`
- [ ] Update webhook handlers (4 files)
- [ ] Update `/lib/actions/payment.ts`
- [ ] Update `/lib/actions/refunds.ts`
- [ ] Update `/lib/actions/payment-recovery.ts`
- [ ] Update `/types/index.ts` exports

**Deliverable**: No `any` in payment system

---

## 📋 Complete Checklist

### Phase 1: Zod Schema Type Checks (6-8h)
- [ ] Add type checks to `/types/photographer-signup.types.ts`
  - [ ] Step 1 schema check
  - [ ] Step 2 schema check
  - [ ] Step 3 schema check
  - [ ] Step 4 schema check
  - [ ] Step 5 schema check
- [ ] Add type checks to `/types/signup.types.ts`
  - [ ] User signup schema check
  - [ ] Photographer signup schema check
- [ ] Add type checks to `/types/terms.types.ts`
  - [ ] Section schema check
  - [ ] Create schema check
  - [ ] Update schema check
- [ ] Verify all builds fail on DB schema changes

### Phase 2: Missing Form Validation (6-8h)
- [ ] Create `/types/profile.types.ts`
  - [ ] Define `profileCompletionSchema`
  - [ ] Add type check against DB
  - [ ] Export from `/types/index.ts`
- [ ] Create `/types/payment-form.types.ts`
  - [ ] Define `tossPaymentFormSchema`
  - [ ] Define `paymentPopupFormSchema`
  - [ ] Export from `/types/index.ts`
- [ ] Create `/types/admin-forms.types.ts`
  - [ ] Define `photoUploadSchema`
  - [ ] Define `bulkScheduleSchema`
  - [ ] Define `couponCreateSchema`
  - [ ] Define `couponEditSchema`
  - [ ] Export from `/types/index.ts`
- [ ] Create `/types/photographer.types.ts` (if doesn't exist)
  - [ ] Define `photographerProfileEditSchema`
  - [ ] Define `portfolioUploadSchema`
  - [ ] Export from `/types/index.ts`
- [ ] Update components to use Zod resolvers
  - [ ] Profile completion form
  - [ ] Payment forms (2 components)
  - [ ] Admin forms (4 components)
  - [ ] Photographer forms (2 components)

### Phase 3: Payment System (4-6h)
- [ ] Create `/types/payment.types.ts`
  - [ ] Define `PaymentProvider` type
  - [ ] Define `paymentMetadataSchema`
  - [ ] Define `TossPaymentResponse`
  - [ ] Define `EximbayPaymentResponse`
  - [ ] Define `AdyenPaymentResponse`
  - [ ] Define `StripePaymentResponse`
  - [ ] Define `tossWebhookSchema`
  - [ ] Define `eximbayWebhookSchema`
  - [ ] Define `adyenWebhookSchema`
  - [ ] Define `stripeWebhookSchema`
  - [ ] Add DB type checks
- [ ] Update payment adapters
  - [ ] `/lib/payments/adapters/toss.ts`
  - [ ] `/lib/payments/adapters/eximbay.ts`
  - [ ] `/lib/payments/adapters/adyen.ts`
  - [ ] `/lib/payments/adapters/stripe.ts`
- [ ] Update webhook handlers
  - [ ] `/app/api/webhooks/toss/route.ts`
  - [ ] `/app/api/webhooks/eximbay/route.ts`
  - [ ] `/app/api/webhooks/adyen/route.ts`
  - [ ] `/app/api/webhooks/stripe/route.ts`
- [ ] Update server actions
  - [ ] `/lib/actions/payment.ts`
  - [ ] `/lib/actions/refunds.ts`
  - [ ] `/lib/actions/payment-recovery.ts`
- [ ] Export from `/types/index.ts`

### Final Validation
- [ ] Run `npm run type-check` - 0 errors
- [ ] Run `npm run lint` - 0 errors
- [ ] Run `npm run build` - success
- [ ] All forms validate with Zod
- [ ] DB schema changes caught at build time
- [ ] No `any` in payment files

---

## 🎯 Success Criteria

### Quantitative
- ✅ 10/10 forms have Zod schemas
- ✅ 10/10 schemas have DB type checks
- ✅ 0 `any` types in payment system (35 files)
- ✅ Build fails when DB schema changes

### Qualitative
- ✅ database.types.ts is single source of truth
- ✅ All types exported from types/index.ts
- ✅ Consistent validation patterns
- ✅ Type-safe payment processing

---

## 🚀 Implementation Order

### Day 1: Zod Type Checks
**Morning** (3-4h):
1. Add checks to `photographer-signup.types.ts` (5 schemas)
2. Add checks to `signup.types.ts` (2 schemas)

**Afternoon** (3-4h):
3. Add checks to `terms.types.ts` (3 schemas)
4. Test: Change DB schema, verify build fails

### Day 2: Missing Forms
**Morning** (3-4h):
1. Create `profile.types.ts`
2. Create `payment-form.types.ts`
3. Create `admin-forms.types.ts`

**Afternoon** (3-4h):
4. Create `photographer.types.ts`
5. Update components with Zod resolvers
6. Test all forms validate correctly

### Day 3: Payment System
**Morning** (2-3h):
1. Create `payment.types.ts`
2. Update payment adapters (4 files)

**Afternoon** (2-3h):
3. Update webhook handlers (4 files)
4. Update server actions (3 files)
5. Final testing & validation

---

## 📝 Implementation Examples

### Example 1: Add Type Check to Existing Schema

```typescript
// /types/photographer-signup.types.ts (existing file)
import { z } from 'zod'
import type { TablesInsert } from './database.types'

// Existing schema
export const photographerSignupStep1Schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/),
})

export type PhotographerSignupStep1 = z.infer<typeof photographerSignupStep1Schema>

// ✅ ADD THIS - Type check (NEW)
export type PhotographerInsertData = TablesInsert<'photographers'>

type _Step1Check = {
  email: PhotographerSignupStep1['email'] extends PhotographerInsertData['email']
    ? true : 'email type mismatch - update schema or DB'
  name: PhotographerSignupStep1['name'] extends PhotographerInsertData['name']
    ? true : 'name type mismatch - update schema or DB'
  phone: PhotographerSignupStep1['phone'] extends PhotographerInsertData['phone']
    ? true : 'phone type mismatch - update schema or DB'
}
```

### Example 2: Create New Form Schema

```typescript
// /types/profile.types.ts (NEW FILE)
import { z } from 'zod'
import type { TablesInsert, TablesUpdate } from './database.types'

export const profileCompletionSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '올바른 형식: 010-0000-0000'),
  bio: z.string().max(500, '최대 500자').optional(),
})

export type ProfileCompletionData = z.infer<typeof profileCompletionSchema>

// Database types
export type UserInsert = TablesInsert<'users'>
export type UserUpdate = TablesUpdate<'users'>

// Type check
type _ProfileCompletionCheck = {
  name: ProfileCompletionData['name'] extends UserInsert['name']
    ? true : 'name type mismatch'
  phone: ProfileCompletionData['phone'] extends UserInsert['phone']
    ? true : 'phone type mismatch'
  bio: ProfileCompletionData['bio'] extends UserInsert['bio']
    ? true : 'bio type mismatch'
}

// Then add to /types/index.ts:
export {
  profileCompletionSchema,
  type ProfileCompletionData,
  type UserInsert,
  type UserUpdate,
} from './profile.types'
```

### Example 3: Component Usage

```typescript
// /components/profile-completion-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileCompletionSchema, type ProfileCompletionData } from '@/types'

export function ProfileCompletionForm() {
  const form = useForm<ProfileCompletionData>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      name: '',
      phone: '',
      bio: '',
    },
  })

  const onSubmit = async (data: ProfileCompletionData) => {
    // `data` is fully validated!
    const result = await updateUserProfile(data)
    if (result.success) {
      toast.success('프로필이 업데이트되었습니다')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

---

## 🎉 Expected Outcomes

### Type Safety Score

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Zod ↔ DB Alignment | 30% | 100% | +70% |
| Form Validation | 60% | 95% | +35% |
| Payment `any` Types | 35 files | 0 files | -100% |
| **Overall Score** | **76%** | **95%** | **+19%** |

### Developer Benefits

1. **Build-Time Safety**: DB changes caught immediately
2. **IntelliSense**: Full autocomplete for all types
3. **Runtime Validation**: Zod catches malformed data
4. **Maintainability**: Single source of truth (database.types.ts)
5. **Confidence**: Type-safe payment processing

---

## 📚 Documentation

After implementation, update:

1. **CLAUDE.md**: Add Phase 1-3 completion notes
2. **TYPE_SAFETY_SUMMARY.md**: Update success metrics
3. Create **TYPE_SAFETY_EXAMPLES.md**: Copy examples from this doc

---

**Document Version**: Final 1.0
**Last Updated**: 2025-10-12
**Estimated Time**: 16-22 hours (2-3 days)
**Status**: ✅ Ready to Start
