# Type Safety Implementation Guide
**Project**: kindt
**Created**: 2025-10-12
**Status**: Ready for Implementation

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `tsx` - TypeScript execution for migration scripts
- `glob` - File pattern matching for migrations

### 2. Run Enum Migration (Dry Run)

Preview changes without modifying files:

```bash
npm run migrate:enums
```

Expected output:
```
🔄 Enum Migration Script
========================

📂 Found 33 files in lib/actions/

📝 lib/actions/photographer.ts
   45 changes found
   Line 23:
     - if (status === 'pending') {
     + if (status === APPROVAL_STATUS.PENDING) {
   ...

📊 Migration Summary
====================
Files to modify: 33
Total changes: 352

📋 This was a DRY RUN - no files were modified
```

### 3. Apply Enum Migration

After reviewing the preview:

```bash
npm run migrate:enums -- --apply
```

### 4. Verify Changes

```bash
# Check for lint errors
npm run lint

# Check for type errors
npm run type-check

# Build the project
npm run build
```

---

## Implementation Steps

### Phase 1: Enum Migration (Day 1)

#### 1.1 Run Migration Script

```bash
# Preview changes
npm run migrate:enums

# Apply changes
npm run migrate:enums -- --apply
```

#### 1.2 Fix ESLint Errors

The new strict ESLint rules will catch issues:

```bash
npm run lint
```

Common errors and fixes:

**Error: `@typescript-eslint/no-explicit-any`**
```typescript
// ❌ Before
function handleError(error: any) {
  console.log(error)
}

// ✅ After
function handleError(error: Error | unknown) {
  if (error instanceof Error) {
    console.error(error.message)
  }
}
```

**Error: `@typescript-eslint/explicit-function-return-type`**
```typescript
// ❌ Before
export async function getPhotographers() {
  const { data } = await supabase.from('photographers').select()
  return data
}

// ✅ After
export async function getPhotographers(): Promise<ApiResponse<Photographer[]>> {
  const { data } = await supabase.from('photographers').select()
  return { success: true, data }
}
```

**Error: `@typescript-eslint/consistent-type-imports`**
```typescript
// ❌ Before
import { Photographer, Product } from '@/types'

// ✅ After
import type { Photographer, Product } from '@/types'
```

**Error: `no-console`**
```typescript
// ❌ Before
console.log('Payment processed')

// ✅ After
import { paymentLogger } from '@/lib/logger'
paymentLogger.info('Payment processed', { paymentId })
```

#### 1.3 Review and Commit

```bash
# Review all changes
git diff

# Create feature branch
git checkout -b refactor/type-safety-phase1

# Commit changes
git add .
git commit -m "refactor: Phase 1 - Enum migration and ESLint setup

- Replace 352 string literal comparisons with enum constants
- Configure strict TypeScript ESLint rules
- Add type safety enforcement across codebase
- Setup migration scripts for future refactoring

Refs: TYPE_SAFETY_REFACTORING_PLAN.md"

# Push to remote
git push origin refactor/type-safety-phase1
```

---

### Phase 2: API Response Types (Day 2)

#### 2.1 Create API Types

Create `/types/api.types.ts`:

```typescript
/**
 * Standard API response type for Server Actions
 */
export type ApiResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export type ApiPaginatedResponse<T> =
  | { success: true; response: PaginatedResponse<T> }
  | { success: false; error: string }
```

Add to `/types/index.ts`:

```typescript
export type { ApiResponse, ApiPaginatedResponse, PaginatedResponse } from './api.types'
```

#### 2.2 Update Server Actions

Pattern to follow:

```typescript
// ❌ Before
export async function getPhotographers() {
  try {
    const { data, error } = await supabase.from('photographers').select()
    if (error) throw error
    return data
  } catch (error) {
    throw new Error('Failed to fetch photographers')
  }
}

// ✅ After
import type { ApiResponse, Photographer } from '@/types'

export async function getPhotographers(): Promise<ApiResponse<Photographer[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('photographers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      photographerLogger.error('Error fetching photographers:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    photographerLogger.error('Unexpected error in getPhotographers:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

#### 2.3 Update React Query Hooks

```typescript
// lib/hooks/use-photographers.ts
import { useQuery } from '@tanstack/react-query'
import { getPhotographers } from '@/lib/actions/photographer'
import type { Photographer } from '@/types'

export const photographerKeys = {
  all: ['photographers'] as const,
  lists: () => [...photographerKeys.all, 'list'] as const,
}

export function usePhotographers() {
  return useQuery({
    queryKey: photographerKeys.lists(),
    queryFn: async () => {
      const result = await getPhotographers()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch photographers')
      }
      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
```

---

### Phase 3: Zod Schema Creation (Day 3)

#### 3.1 Create Type File Template

For each form, follow this pattern:

```typescript
// /types/[domain].types.ts
import { z } from 'zod'
import type { TablesInsert, TablesUpdate } from './database.types'

// 1. Zod Schema
export const profileCompletionSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '010-0000-0000 형식'),
  bio: z.string().optional(),
})

export type ProfileCompletionData = z.infer<typeof profileCompletionSchema>

// 2. Database Types
export type UserProfile = TablesInsert<'users'>
export type UserProfileUpdate = TablesUpdate<'users'>

// 3. Type Check (MANDATORY - catches schema/DB drift at build time)
type _ProfileCompletionCheck = {
  name: ProfileCompletionData['name'] extends UserProfile['name']
    ? true
    : 'name type mismatch'
  email: ProfileCompletionData['email'] extends UserProfile['email']
    ? true
    : 'email type mismatch'
  phone: ProfileCompletionData['phone'] extends UserProfile['phone']
    ? true
    : 'phone type mismatch'
  // bio is optional in both, no check needed
}
```

#### 3.2 Update Form Component

```typescript
// components/profile-completion-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileCompletionSchema, type ProfileCompletionData } from '@/types'

export function ProfileCompletionForm() {
  const form = useForm<ProfileCompletionData>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      bio: '',
    },
  })

  const onSubmit = async (data: ProfileCompletionData) => {
    // Form data is now fully validated!
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

#### 3.3 Handling Type Conversions

Some fields differ between form and database:

```typescript
// Date fields (form uses Date, DB uses string)
export const inquiryFormSchema = z.object({
  desired_date: z.date(), // User selects a Date
  name: z.string().min(1),
  email: z.string().email(),
})

export type InquiryFormData = z.infer<typeof inquiryFormSchema>
export type InquiryInsert = TablesInsert<'inquiries'>

// Type check - skip converted fields
type _InquiryFormCheck = {
  // desired_date: Date → string conversion handled in submission
  name: InquiryFormData['name'] extends InquiryInsert['name'] ? true : 'name type mismatch'
  email: InquiryFormData['email'] extends InquiryInsert['email'] ? true : 'email type mismatch'
}

// In the form submission handler
const onSubmit = async (data: InquiryFormData) => {
  const dbData: InquiryInsert = {
    ...data,
    desired_date: data.desired_date.toISOString(), // Convert Date → string
  }
  await createInquiry(dbData)
}
```

---

## ESLint Rule Reference

### Strict Rules (Always Enforced)

#### 1. `@typescript-eslint/no-explicit-any`
**Rule**: Prohibit `any` type usage

**Why**: `any` defeats TypeScript's type safety

**Fix**:
```typescript
// ❌ Bad
function log(data: any) { }

// ✅ Good
function log(data: unknown) {
  if (typeof data === 'string') {
    console.log(data)
  }
}
```

#### 2. `@typescript-eslint/explicit-function-return-type`
**Rule**: Require explicit return types on functions

**Why**: Makes function contracts clear, catches return type errors

**Exceptions**:
- Arrow functions (allowed)
- Typed function expressions (allowed)
- Higher-order functions (allowed)

**Fix**:
```typescript
// ❌ Bad
export async function getData() { }

// ✅ Good
export async function getData(): Promise<ApiResponse<Data[]>> { }
```

#### 3. `@typescript-eslint/no-unsafe-*`
**Rules**:
- `no-unsafe-assignment`
- `no-unsafe-member-access`
- `no-unsafe-call`
- `no-unsafe-return`

**Why**: Prevent unsafe operations from `any` types

**Fix**: Add proper types instead of using `any`

#### 4. `@typescript-eslint/consistent-type-imports`
**Rule**: Use `type` keyword for type-only imports

**Why**: Clearer intent, better tree-shaking

**Fix**:
```typescript
// ❌ Bad
import { User, Product } from '@/types'

// ✅ Good
import type { User, Product } from '@/types'
```

#### 5. `no-console`
**Rule**: No console statements (except `.warn` and `.error`)

**Why**: Use centralized logger for better debugging

**Fix**:
```typescript
// ❌ Bad
console.log('User created')

// ✅ Good
import { adminLogger } from '@/lib/logger'
adminLogger.info('User created', { userId })
```

---

### Relaxed Rules

#### Config Files (`*.config.{js,mjs,ts}`, `scripts/**/*`)
- `no-console`: OFF
- `@typescript-eslint/no-explicit-any`: WARN
- `@typescript-eslint/explicit-function-return-type`: OFF

#### Test Files (`**/*.test.{js,ts,tsx}`)
- `@typescript-eslint/no-explicit-any`: WARN
- `@typescript-eslint/explicit-function-return-type`: OFF

---

## TypeScript Strict Mode

### Current Settings (Already Enabled)
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

### Recommended Additions (Phase 4.2)

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,

    // NEW: Stricter checks
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Impact**: Will require handling `undefined` for array/object access

**Example**:
```typescript
// With noUncheckedIndexedAccess: true
const items = ['a', 'b', 'c']
const first = items[0] // Type: string | undefined

// Must handle undefined
if (first) {
  console.log(first.toUpperCase())
}

// Or use non-null assertion (if certain)
console.log(items[0]!.toUpperCase())
```

---

## Troubleshooting

### Issue: Too many ESLint errors

**Solution**: Fix in batches

```bash
# Fix specific file patterns
npm run lint -- --fix lib/actions/photographer.ts
npm run lint -- --fix lib/actions/*.ts

# Fix auto-fixable issues globally
npm run lint -- --fix
```

### Issue: Type check fails after schema change

**Cause**: Zod schema and database types are out of sync

**Solution**: Update Zod schema to match database

```typescript
// If database.types.ts changed:
// 1. Update Zod schema
export const schema = z.object({
  name: z.string(),
  // Add new required field
  status: z.enum(['active', 'inactive']),
})

// 2. Type check will now pass
type _Check = {
  status: SchemaData['status'] extends DBType['status'] ? true : never
}
```

### Issue: Migration script not working

**Debug**:
```bash
# Check if tsx is installed
npm list tsx

# Install if missing
npm install -D tsx

# Run with verbose output
npm run migrate:enums -- --file=lib/actions/test.ts
```

### Issue: "Cannot find module '@/types'"

**Solution**: Ensure path alias is configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## Best Practices

### 1. Always Use Enums
```typescript
// ❌ Bad
if (user.role === 'admin') { }

// ✅ Good
import { USER_ROLE } from '@/types'
if (user.role === USER_ROLE.ADMIN) { }
```

### 2. Type Server Actions
```typescript
// ❌ Bad
export async function createUser(data) {
  return await supabase.from('users').insert(data)
}

// ✅ Good
export async function createUser(
  data: UserInsert
): Promise<ApiResponse<User>> {
  // ...
}
```

### 3. Validate Forms with Zod
```typescript
// ❌ Bad
const [name, setName] = useState('')
// No validation

// ✅ Good
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
})
```

### 4. Use Typed Loggers
```typescript
// ❌ Bad
console.log('Payment processed', payment)

// ✅ Good
paymentLogger.info('Payment processed', {
  paymentId: payment.id,
  amount: payment.amount,
})
```

### 5. Handle Errors Properly
```typescript
// ❌ Bad
try {
  // ...
} catch (error: any) {
  console.log(error)
}

// ✅ Good
try {
  // ...
} catch (error) {
  if (error instanceof Error) {
    logger.error('Operation failed', { message: error.message })
  } else {
    logger.error('Unknown error', { error: String(error) })
  }
  return { success: false, error: 'Operation failed' }
}
```

---

## Migration Checklist

Use this checklist when migrating a file:

- [ ] Replace string literals with enum constants
- [ ] Import enums from `@/types`
- [ ] Add explicit return types to functions
- [ ] Use `type` keyword for type-only imports
- [ ] Replace `console.*` with logger
- [ ] Type `any` parameters properly
- [ ] Handle errors with proper types
- [ ] Add Zod schema if it's a form
- [ ] Run `npm run lint` on file
- [ ] Run `npm run type-check`

---

## Next Steps

After completing Phase 1-3:

1. **Phase 4**: Enable stricter TypeScript compiler options
2. **Phase 5**: Type logger contexts (replace `any` in logger.ts)
3. **Phase 6**: Add Zod schemas to matching system
4. **Phase 7**: Final cleanup and documentation

See [`TYPE_SAFETY_REFACTORING_PLAN.md`](./TYPE_SAFETY_REFACTORING_PLAN.md) for complete roadmap.

---

**Last Updated**: 2025-10-12
**Questions**: See [`TYPE_SAFETY_CHECKLIST.md`](./TYPE_SAFETY_CHECKLIST.md) for detailed task tracking
