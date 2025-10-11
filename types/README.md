# Types Directory

Database types, enums, and Zod schemas for the Kindt project.

## Files

- `database.types.ts` - Auto-generated Supabase database types (DO NOT EDIT MANUALLY)
- `enums.ts` - Extracted database enums with utilities
- `inquiry.types.ts` - Inquiry form Zod schemas and types
- `review.types.ts` - Review form Zod schemas and types
- `user-management.types.ts` - User management Zod schemas and types
- `index.ts` - Central export file for all types
- `SCHEMA_SYNC.md` - **Database & Zod schema synchronization guide** ⭐

## Usage

### Importing Database Types

```typescript
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/types'

// Use table types
type User = Tables<'users'>
type UserInsert = TablesInsert<'users'>
type UserUpdate = TablesUpdate<'users'>
```

### Using Enums

#### Type-safe Enum Values

```typescript
import { APPROVAL_STATUS, USER_ROLE } from '@/types'

// Constants
const status = APPROVAL_STATUS.PENDING  // 'pending'
const role = USER_ROLE.PHOTOGRAPHER    // 'photographer'
```

#### Enum Types

```typescript
import type { ApprovalStatus, UserRole } from '@/types'

function updatePhotographerStatus(
  photographerId: string,
  status: ApprovalStatus  // Only 'pending' | 'approved' | 'rejected'
) {
  // ...
}
```

#### Validation Arrays

```typescript
import { APPROVAL_STATUS_VALUES, USER_ROLE_VALUES } from '@/types'

// For form validation
const isValidStatus = APPROVAL_STATUS_VALUES.includes(inputValue)

// For select options
const statusOptions = APPROVAL_STATUS_VALUES.map(status => ({
  value: status,
  label: status
}))
```

#### Type Guards

```typescript
import { isApprovalStatus, isUserRole } from '@/types'

function handleStatus(value: unknown) {
  if (isApprovalStatus(value)) {
    // TypeScript knows value is ApprovalStatus
    console.log('Valid status:', value)
  }
}
```

#### Display Labels

```typescript
import { APPROVAL_STATUS_LABELS, USER_ROLE_LABELS } from '@/types'

// Korean labels
const statusLabel = APPROVAL_STATUS_LABELS['approved']  // '승인됨'
const roleLabel = USER_ROLE_LABELS['photographer']     // '사진작가'
```

## Regenerating Database Types

When database schema changes:

```bash
npm run update-types
```

This will update `database.types.ts`. The `enums.ts` file should be manually updated if new enums are added to the database.

## Adding New Enums

When a new enum is added to the database:

1. Run `npm run update-types` to update `database.types.ts`
2. Add the new enum type to `enums.ts`:

```typescript
// In enums.ts

// Type
export type NewEnumType = Database['public']['Enums']['new_enum_type']

// Constants
export const NEW_ENUM = {
  VALUE1: 'value1' as const,
  VALUE2: 'value2' as const,
} as const

// Array values
export const NEW_ENUM_VALUES: NewEnumType[] = [
  NEW_ENUM.VALUE1,
  NEW_ENUM.VALUE2,
]

// Type guard
export function isNewEnumType(value: unknown): value is NewEnumType {
  return typeof value === 'string' && NEW_ENUM_VALUES.includes(value as NewEnumType)
}

// Labels (optional)
export const NEW_ENUM_LABELS: Record<NewEnumType, string> = {
  value1: '값 1',
  value2: '값 2',
}
```

3. Export from `index.ts`:

```typescript
export {
  type NewEnumType,
  NEW_ENUM,
  NEW_ENUM_VALUES,
  NEW_ENUM_LABELS,
  isNewEnumType,
} from './enums'
```

## Zod Schemas and Form Validation

### Using Zod Schemas

All Zod schemas are defined in the `types/` folder and must be imported, never defined inline in components.

```typescript
// ✅ Good - Import from types
import { inquiryFormSchema, type InquiryFormValues } from '@/types'

export function InquiryForm() {
  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
  })
  // ...
}

// ❌ Bad - Defining schema in component
import { z } from 'zod'

export function InquiryForm() {
  const schema = z.object({ ... })  // Don't do this!
}
```

### Database Type Synchronization

Each Zod schema file includes **build-time type checks** to ensure Zod schemas stay in sync with database schema:

```typescript
// In inquiry.types.ts
type _InquiryFormValuesCheck = {
  name: InquiryFormValues['name'] extends InquiryInsert['name'] ? true : 'name type mismatch'
  phone: InquiryFormValues['phone'] extends InquiryInsert['phone'] ? true : 'phone type mismatch'
  // ... more checks
}
```

**How it works:**
- If database schema changes (e.g., `phone` becomes required), the type check will fail at build time
- TypeScript will show an error like: `Type 'string | undefined' is not assignable to type 'string'`
- This forces you to update the Zod schema to match the new database schema

### Creating New Form Schemas

When creating a new form that maps to a database table:

1. **Create a new type file** in `/types/` (e.g., `payment.types.ts`)

2. **Define the Zod schema**:
```typescript
import { z } from 'zod'
import type { Tables, TablesInsert, TablesUpdate } from './database.types'

export const paymentFormSchema = z.object({
  amount: z.number().min(0),
  buyer_name: z.string().min(1),
  buyer_email: z.string().email(),
  // ...
})

export type PaymentFormData = z.infer<typeof paymentFormSchema>
```

3. **Add database types**:
```typescript
export type Payment = Tables<'payments'>
export type PaymentInsert = TablesInsert<'payments'>
export type PaymentUpdate = TablesUpdate<'payments'>
```

4. **Add type compatibility checks**:
```typescript
type _PaymentFormDataCheck = {
  amount: PaymentFormData['amount'] extends PaymentInsert['amount'] ? true : 'amount type mismatch'
  buyer_name: PaymentFormData['buyer_name'] extends PaymentInsert['buyer_name'] ? true : 'buyer_name type mismatch'
  buyer_email: PaymentFormData['buyer_email'] extends PaymentInsert['buyer_email'] ? true : 'buyer_email type mismatch'
}
```

5. **Export from `/types/index.ts`**:
```typescript
export {
  paymentFormSchema,
  type PaymentFormData,
  type Payment,
  type PaymentInsert,
  type PaymentUpdate,
} from './payment.types'
```

### Handling Type Conversions

Some fields may need conversion between form and database:

```typescript
// In the schema file, document the conversion
export const inquiryFormSchema = z.object({
  desired_date: z.date({ required_error: "날짜를 선택해주세요" }),
  // Note: desired_date is Date in form, string in DB (handled in conversion)
})

// In the type check, skip fields that require conversion
type _InquiryFormValuesCheck = {
  // desired_date is Date in form, string in DB (handled in conversion)
  name: InquiryFormValues['name'] extends InquiryInsert['name'] ? true : 'name type mismatch'
  // ...
}
```

## Best Practices

1. **Always use enum constants** instead of string literals:
   ```typescript
   // ✅ Good
   status: APPROVAL_STATUS.APPROVED

   // ❌ Bad
   status: 'approved'
   ```

2. **Use type guards** for runtime validation:
   ```typescript
   // ✅ Good
   if (isApprovalStatus(value)) {
     // TypeScript knows the type
   }

   // ❌ Bad
   if (value === 'approved' || value === 'pending' || value === 'rejected') {
     // Manual checking
   }
   ```

3. **Use display labels** for UI:
   ```typescript
   // ✅ Good
   <span>{APPROVAL_STATUS_LABELS[status]}</span>

   // ❌ Bad
   <span>{status === 'approved' ? '승인됨' : status === 'pending' ? '대기중' : '거절됨'}</span>
   ```

4. **Centralize imports** through `@/types`:
   ```typescript
   // ✅ Good
   import { APPROVAL_STATUS, type ApprovalStatus } from '@/types'

   // ❌ Bad
   import { APPROVAL_STATUS } from '@/types/enums'
   import type { ApprovalStatus } from '@/types/database.types'
   ```
