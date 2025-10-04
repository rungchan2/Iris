# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Iris (Iris)** is a photographer matching and booking platform built on Next.js. The system combines AI-powered photographer matching with streamlined booking and payment processing:

1. **10-Question Matching System**: Advanced embedding-based photographer matching using pgvector
2. **Direct Booking System**: Simplified appointment scheduling and management
3. **Photographer Management**: Admin-managed photographer accounts with 4-dimensional profile system
4. **Payment Processing**: Multi-PG payment system (Toss, Eximbay, Adyen, Stripe)
5. **Admin Dashboard**: Comprehensive management interface for matching settings, bookings, and analytics

## Development Commands

### Essential Commands
```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint and fix code
npm run lint

# Sync Types with Supabase
npm run gen-types
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript with strict mode
- **Database**: Supabase (PostgreSQL) with pgvector extension
- **AI/ML**: OpenAI embeddings (text-embedding-3-small), pgvector for similarity search
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query for server state, React hooks for client state
- **Image Handling**: browser-image-compression, html2canvas-pro

### Key Directories

- `app/` - Next.js App Router pages and layouts
  - `admin/` - Admin dashboard and matching system management
  - `matching/` - 10-question matching flow and results
  - `gallery/` - Public photo gallery
  - `login/` - Authentication pages
- `hooks/` - Custom React hooks
- `components/` - Reusable UI components
  - `admin/` - Admin-specific components (including matching system controls)
  - `matching/` - Matching flow components (questionnaire, results)
  - `booking/` - Booking and inquiry forms
  - `ui/` - shadcn/ui base components
- `lib/` - Utility functions and configurations
  - `actions/` - Server actions (including matching algorithms)
  - `supabase/` - Database client configurations
  - `matching/` - Matching algorithms and embedding utilities
- `types/` - TypeScript type definitions
- `specs/` - Detailed project documentation

## Database Schema

### Core Tables (Legacy)

**User Management:**
- `users` - General users (customers) for payment/booking system
- `photographers` - Photographer accounts with approval workflow
- `products` - Unified photo packages with admin approval system

**Payment System (2025.08.31):**
- `payments` - PG-neutral payment processing
- `refunds` - Comprehensive refund management
- `settlements` - Automated photographer settlement system
- `payment_logs` - Detailed audit trail

**Booking System:**
- `inquiries` - Booking requests and customer information
- `available_slots` - Photographer availability management
- `reviews` - Anonymous review system

### New Matching System Tables (2025.09.16)

**Matching Core:**
- `survey_questions` - 10-question master template (admin configurable)
- `survey_choices` - Choice options with embeddings (Q1-Q6, Q8-Q9)
- `survey_images` - Image choices with embeddings (Q7)
- `matching_sessions` - User questionnaire sessions with aggregated embeddings
- `matching_results` - 4-dimensional matching scores and rankings

**4-Dimensional Photographer Profiles:**
- `photographer_profiles` - Extended profiles with 4 description dimensions:
  - `style_emotion_description` + `style_emotion_embedding` (40% weight)
  - `communication_psychology_description` + `communication_psychology_embedding` (30% weight)
  - `purpose_story_description` + `purpose_story_embedding` (20% weight)
  - `companion_description` + `companion_embedding` (10% weight)
- `photographer_keywords` - Specialty keywords with proficiency levels

**Analytics & Optimization (V2/V3):**
- `weight_experiments` - A/B testing for matching weights
- `experiment_sessions` - Session assignment to experiments
- `user_feedback` - Matching quality feedback collection
- `matching_performance_logs` - System performance tracking
- `embedding_jobs` - Async embedding regeneration queue

**System Management:**
- `system_settings` - Global matching configuration
- Enhanced `photos` table with `image_embedding` for portfolio matching

## Matching System Architecture

### 4-Dimensional Matching Algorithm

**Question Weight Distribution:**
- **Style/Emotion (40%)**: Q6 (keyword), Q7 (image), Q8 (lighting), Q9 (location)
- **Communication/Psychology (30%)**: Q3 (comfort), Q4 (atmosphere), Q5 (immersion)
- **Purpose/Story (20%)**: Q1 (purpose), Q10 (subjective text)
- **Companion (10%)**: Q2 (companion type) - also serves as hard filter

**Matching Pipeline:**
1. **Hard Filtering**: Region, budget, companion type, keyword compatibility
2. **4D Similarity**: Each user response mapped to corresponding photographer dimension
3. **Keyword Bonus**: Graduated scoring (1-3+ matches = 50%-100% bonus weight)
4. **Final Ranking**: Weighted combination of similarity scores

### Embedding Strategy
- **Pre-computed**: All choice options and photographer profiles
- **Real-time**: Only Q10 subjective responses
- **Admin-triggered**: Regeneration via `embedding_jobs` queue when content changes
- **Model**: OpenAI text-embedding-3-small (1536 dimensions)

## Key Implementation Patterns

### Matching Flow Components
- `QuestionFlow` - Progressive 10-question interface
- `MatchingResults` - Ranked photographer display with explanation
- `PhotographerMatchCard` - Individual result with 4D score breakdown

### Admin Matching Controls
- Question/choice text editing with auto-embedding regeneration
- Weight experiment setup and A/B testing
- Performance analytics and matching quality metrics
- Photographer profile completeness monitoring

### State Management
- React Query for matching results and photographer data
- Session token-based anonymous matching (no login required)
- Supabase real-time subscriptions for admin dashboards

## Important Implementation Notes

### Supabase Configuration
- Project ID: `kypwcsgwjtnkiiwjedcn`
- **pgvector extension enabled** for similarity search
- IVFFLAT indexes on all embedding columns for performance
- RLS policies support anonymous matching via session tokens

### Authentication & Authorization
- **Anonymous Matching**: Full questionnaire and results without login
- **Session Tokens**: Secure access to anonymous matching results
- **Admin Controls**: Full matching system configuration access
- **Photographer Profiles**: 4-dimensional description management

### Performance Considerations
- pgvector indexes optimized for embedding similarity search
- Batch embedding generation via background jobs
- Caching of frequent matching queries
- Efficient hard filtering before expensive similarity calculations

## Matching System Development

### Adding New Questions
1. Insert into `survey_questions` with proper weights
2. Add choices to `survey_choices` or images to `survey_images`
3. Update matching algorithm to handle new question type
4. Regenerate embeddings via `embedding_jobs`

### Modifying Matching Weights
1. Create new `weight_experiments` entry
2. A/B test with `experiment_sessions` assignment
3. Monitor performance via `matching_performance_logs`
4. Update `system_settings` with successful configurations

### Extending Photographer Profiles
1. Add new description fields to `photographer_profiles`
2. Create corresponding embedding columns
3. Update matching algorithm dimensions
4. Modify admin interface for profile management

## Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY= # Required for embedding generation
RUNWAY_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Recent Updates

### 2025.10.05 - Code Quality & Architecture Refactoring
**MAJOR REFACTORING**: Systematic code quality improvements and architectural cleanup

#### Console Logging System (98.9% Complete)
- ✅ **Logger Infrastructure**: Context-based logging system with 10+ domain loggers
- ✅ **449 Console Removals**: Cleaned up 98.9% of console statements (454 → 5)
- ✅ **ESLint Enforcement**: `no-console` rule set to error level
- ✅ **Production Ready**: All logging now goes through centralized logger with environment controls

#### Products Page Refactoring (97.5% Code Reduction)
- ✅ **Server Component Migration**: 977 lines → 24 lines in main page
- ✅ **Server Actions**: Created 7 Server Actions in `/lib/actions/products.ts` (273 lines)
- ✅ **React Query Hooks**: Created 8 hooks in `/lib/hooks/use-products.ts` (178 lines)
- ✅ **Component Extraction**: Split into 3 focused client components
- ✅ **Optimistic Updates**: Full React Query cache management with rollback

#### TypeScript Type Safety
- ✅ **'any' Type Removal**: Fixed 4 critical files with proper typing
- ✅ **Database Types**: Leveraged Supabase-generated types extensively
- ✅ **Union Type Guards**: Implemented ApiResponse pattern across Server Actions
- ✅ **Type Utilities**: Created domain-specific types (MatchingResultUpdate, PaymentUpdate)

#### Performance Optimization
- ✅ **N+1 Query Fix**: Matching results now use JOIN queries (11x improvement)
- ✅ **Query Optimization**: Single query instead of 1 + N queries for related data
- ✅ **React Query Caching**: 5-minute staleTime for efficient data fetching

#### Architecture Patterns Established
- ✅ **Server Action Pattern**: Component → React Query Hook → Server Action → Supabase
- ✅ **Query Key Factory**: Standardized cache key management
- ✅ **Error Handling**: Consistent ApiResponse<T> pattern with proper error propagation
- ✅ **File Naming**: Established conventions (kebab-case, domain-plural, use-prefix)

#### Documentation
- ✅ **REFACTORING_PLAN.md**: Comprehensive 3-month refactoring roadmap
- ✅ **REFACTORING_CHECKLIST.md**: Detailed progress tracking with completion status
- ✅ **MIGRATION_REPORT.md**: Session-by-session migration documentation
- ✅ **CLAUDE.md**: Updated with mandatory coding standards and patterns

#### Impact Metrics
- Console statements: 454 → 5 (98.9% reduction)
- Products page: 977 → 24 lines (97.5% reduction)
- N+1 queries: 11 queries → 1 query (11x faster)
- TypeScript 'any': 44 → 40 files (4 files cleaned)
- React Query hooks: 2 → 3+ domains
- New files created: 26 (Server Actions, hooks, components, docs)

### 2025.09.29 - AI Image Generation System Removal
**MAJOR CLEANUP**: Complete removal of AI image generation feature

#### Database Changes
- ✅ **Table Removal**: Dropped `ai_image_generations` table entirely
- ✅ **Column Cleanup**: Removed `ai_generation_id` from inquiries table
- ✅ **Constraint Cleanup**: Dropped foreign key constraints linking to AI generation
- ✅ **Type Regeneration**: Updated TypeScript types to reflect schema changes

#### Code Cleanup
- ✅ **Component Removal**: Moved AI generation components to .unused files
- ✅ **Function Cleanup**: Removed AI generation server actions and analytics
- ✅ **Dashboard Update**: Cleaned up admin analytics dashboard AI references
- ✅ **Build Verification**: Confirmed successful compilation without AI code

#### System Simplification
- ✅ **Focused Analytics**: Analytics now focus on matching and booking metrics only
- ✅ **Cleaner Schema**: Simplified inquiries table without AI-related complexity
- ✅ **Reduced Dependencies**: No longer requires OpenAI DALL-E API integration

### 2025.09.16 - Matching System Implementation
**MAJOR FEATURE**: Complete 10-question photographer matching system

#### Database Architecture
- ✅ **pgvector Integration**: Semantic similarity search with 1536-dimension embeddings
- ✅ **4-Dimensional Profiles**: Photographer descriptions split by matching categories
- ✅ **Admin-Configurable Questions**: Dynamic question/choice management with auto-embedding
- ✅ **Anonymous Matching**: Token-based system for non-logged users
- ✅ **V2/V3 Analytics Framework**: A/B testing and performance tracking infrastructure

#### Matching Algorithm
- ✅ **Weighted Similarity**: 40/30/20/10 distribution across style/communication/purpose/companion
- ✅ **Hard Filtering**: Budget, region, companion compatibility pre-filtering
- ✅ **Keyword Bonuses**: Graduated scoring for specialty matching
- ✅ **Real-time Optimization**: Only Q10 subjective responses generate embeddings live

#### User Experience
- ✅ **Progressive Questionnaire**: 10-question flow with image selection
- ✅ **Explained Results**: 4D score breakdown with matching highlights
- ✅ **Anonymous Access**: Full matching without account creation
- ✅ **Photographer Profiles**: Rich 4-dimensional profile system

### Previous Major Updates
- **2025.08.31**: Multi-PG payment system and product consolidation
- **2025.08.24**: Admin-photographer system separation
- **2025.01.18**: RBAC simplification to 2-tier structure

## Development Guidelines

### Code Quality Standards (Updated 2025-10-05)

#### 1. Logging System (MANDATORY)
**NEVER use console.log/error/warn directly in production code.**

Use context-specific loggers from `/lib/logger.ts`:
```typescript
import { adminLogger, paymentLogger, matchingLogger } from '@/lib/logger'

// Good
adminLogger.info('User approved', { userId, approvedBy })
paymentLogger.error('Payment failed', { orderId, error })

// Bad
console.log('User approved', userId)  // ❌ Will fail ESLint
```

**Available Context Loggers:**
- `matchingLogger` - Matching algorithm and results
- `paymentLogger` - Payment processing and settlements
- `authLogger` - Authentication and authorization
- `photographerLogger` - Photographer operations
- `bookingLogger` - Booking and inquiries
- `uploadLogger` - File uploads
- `webhookLogger` - Webhook handlers
- `embeddingLogger` - AI embeddings
- `adminLogger` - Admin operations
- `reviewLogger` - Review system
- `settlementLogger` - Settlement processing

**ESLint Configuration:**
- `no-console` rule is set to `error` level
- Build will fail if console.* is used
- Only exception: `/lib/logger.ts` implementation

#### 2. Server Actions Pattern (MANDATORY)
**NEVER use direct Supabase client calls in components.**

**Architecture:**
```
Component (Client)
  ↓ calls
React Query Hook (/lib/hooks/use-*.ts)
  ↓ calls
Server Action (/lib/actions/*.ts)
  ↓ uses
Supabase Client
```

**Example Implementation:**
```typescript
// ✅ GOOD: /lib/actions/products.ts
'use server'

export async function getProducts(): Promise<ApiResponse<Product[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, photographer:photographers(name, email)')
      .order('created_at', { ascending: false })

    if (error) {
      adminLogger.error('Error fetching products:', error)
      return { success: false, error: error.message }
    }
    return { success: true, data: data as unknown as Product[] }
  } catch (error) {
    adminLogger.error('Unexpected error in getProducts:', error)
    return { success: false, error: 'Failed to fetch products' }
  }
}

// ✅ GOOD: /lib/hooks/use-products.ts
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
}

export function useProducts() {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: async () => {
      const result = await getProducts()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch products')
      }
      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// ✅ GOOD: Component
'use client'
import { useProducts } from '@/lib/hooks/use-products'

export function ProductsList() {
  const { data: products, isLoading, error } = useProducts()
  // ...
}

// ❌ BAD: Direct Supabase in component
'use client'
import { createClient } from '@/lib/supabase/client'

export function ProductsList() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    const supabase = createClient()  // ❌ WRONG
    supabase.from('products').select('*')  // ❌ WRONG
  }, [])
}
```

#### 3. React Query Hooks Pattern (MANDATORY)

**Query Key Factory:**
```typescript
// Define query keys for cache management
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...productKeys.lists(), filters] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
}
```

**Mutation Hooks with Optimistic Updates:**
```typescript
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.lists() })

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData(productKeys.lists())

      // Optimistically update
      queryClient.setQueryData(productKeys.lists(), (old: Product[] = []) =>
        old.filter(p => p.id !== id)
      )

      return { previousProducts }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(productKeys.lists(), context.previousProducts)
      }
      toast.error('Failed to delete product')
    },
    onSuccess: () => {
      toast.success('Product deleted successfully')
    },
  })
}
```

**Cache Configuration:**
- `staleTime: 1000 * 60 * 5` (5 minutes) for lists
- `staleTime: 1000 * 60 * 10` (10 minutes) for detail views
- Always use Optimistic Updates for Create/Update/Delete

#### 4. Server/Client Component Boundaries

**Server Components (Default):**
```typescript
// app/admin/products/page.tsx
export default async function ProductsPage() {
  // Fetch data on server
  const [productsResult, photographersResult] = await Promise.all([
    getProducts(),
    getApprovedPhotographers(),
  ])

  const initialProducts = productsResult.success ? productsResult.data || [] : []
  const initialPhotographers = photographersResult.success ? photographersResult.data || [] : []

  // Pass to client component
  return (
    <ProductsManagementClient
      initialProducts={initialProducts}
      initialPhotographers={initialPhotographers}
    />
  )
}
```

**Client Components (Minimal):**
```typescript
// components/admin/products/products-management-client.tsx
'use client'

export function ProductsManagementClient({
  initialProducts,
  initialPhotographers
}: Props) {
  // Client interactions only
  const [selectedProduct, setSelectedProduct] = useState(null)
  const { data: products = initialProducts } = useProducts()

  return (
    // UI with interactions
  )
}
```

**Rules:**
- Pages should be Server Components by default
- Only add 'use client' for components with:
  - `useState`, `useEffect`, event handlers
  - Browser APIs (localStorage, window, etc.)
  - Third-party client-only libraries
- Extract minimal client components from large pages
- Keep business logic in Server Actions

#### 5. TypeScript Type Safety

**NEVER use 'any' type unless absolutely necessary.**

**Use Database Types:**
```typescript
import { Database } from '@/types/database.types'

// Good - Use generated types
type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

// Good - Create domain-specific types
type MatchingResultUpdate = {
  viewed_at?: string | null
  clicked_at?: string | null
  contacted_at?: string | null
}

// Good - Union types with type guards
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Usage with type guard
const result = await getProducts()
if (result.success) {
  // TypeScript knows result.data exists
  console.log(result.data)
} else {
  // TypeScript knows result.error exists
  console.log(result.error)
}

// Bad
function doSomething(data: any) { }  // ❌ Avoid
```

**Supabase Client Typing:**
```typescript
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

async function updateDescendantPaths(
  supabase: SupabaseClient<Database>,  // ✅ Typed client
  categories: Category[],
  categoryId: string
) {
  // ...
}
```

#### 6. Component Size Limits

**Maximum Lines:**
- Page Components: 50 lines (Server Component wrapper)
- Feature Components: 300 lines
- Utility Components: 200 lines

**If component exceeds limit:**
1. Extract sub-components
2. Move business logic to custom hooks
3. Move data fetching to Server Actions
4. Split into domain-specific files

**Example Refactoring:**
```typescript
// Before: 977 lines ❌
'use client'
export default function ProductsPage() {
  // All logic, UI, data fetching in one file
}

// After: 24 lines ✅
export default async function ProductsPage() {
  const data = await getProducts()
  return <ProductsManagementClient initialProducts={data} />
}

// + products-management-client.tsx (200 lines)
// + product-create-dialog.tsx (100 lines)
// + product-edit-dialog.tsx (100 lines)
```

#### 7. Error Handling Standards

**Server Actions:**
```typescript
export async function createProduct(data: ProductInsert): Promise<ApiResponse<Product>> {
  try {
    const supabase = await createClient()

    const { data: product, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single()

    if (error) {
      adminLogger.error('Error creating product:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Product created', { productId: product.id })
    return { success: true, data: product }
  } catch (error) {
    adminLogger.error('Unexpected error in createProduct:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

**React Query Error Handling:**
```typescript
export function useProducts() {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: async () => {
      const result = await getProducts()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch products')
      }
      return result.data
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// Component usage
const { data, isLoading, error } = useProducts()

if (error) {
  return <ErrorBoundary error={error} />
}
```

#### 8. File Naming Conventions

**Consistency Rules:**
- Server Actions: `/lib/actions/[domain-plural].ts` (e.g., `products.ts`, `photographers.ts`)
- React Query Hooks: `/lib/hooks/use-[domain-plural].ts` (e.g., `use-products.ts`)
- Components: `kebab-case.tsx` (e.g., `product-create-dialog.tsx`)
- Client Components: `[name]-client.tsx` suffix for clarity
- Types: `[domain].types.ts` (e.g., `product.types.ts`)

**Examples:**
```
✅ Good:
/lib/actions/products.ts
/lib/hooks/use-products.ts
/components/admin/products/product-create-dialog.tsx
/components/admin/products/products-management-client.tsx

❌ Bad:
/lib/actions/product.ts  (singular)
/lib/hooks/products.ts  (missing 'use-' prefix)
/components/admin/ProductCreateDialog.tsx  (PascalCase file name)
```

#### 9. Database Query Optimization

**NEVER use loops to fetch related data (N+1 queries).**

**Use Supabase JOIN queries:**
```typescript
// ❌ BAD: N+1 Query Pattern
const { data: results } = await supabase
  .from('matching_results')
  .select('*')
  .eq('session_id', sessionId)

for (const result of results) {
  const { data: profile } = await supabase
    .from('photographer_profiles')
    .select('*')
    .eq('photographer_id', result.photographer_id)
    .single()
  // Process profile...
}
// Result: 1 + N queries (11 queries for 10 results)

// ✅ GOOD: Single Query with JOINs
const { data: results } = await supabase
  .from('matching_results')
  .select(`
    *,
    photographer:photographers!inner(
      id,
      name,
      email,
      specialty
    ),
    photographer_profile:photographer_profiles!inner(
      style_emotion_description,
      communication_psychology_description,
      purpose_story_description,
      companion_description
    )
  `)
  .eq('session_id', sessionId)
  .order('rank_position')
// Result: 1 query for all data
```

**Performance Impact:**
- N+1 pattern: 11 queries for 10 results (1 + 10)
- JOIN pattern: 1 query for all results
- **11x performance improvement**

**Additional Optimization Tips:**
- Use `!inner` for required relationships (prevents null results)
- Use `!left` for optional relationships
- Select only needed columns to reduce payload size
- Add `.limit()` for pagination
- Use database indexes on frequently joined columns

### Matching System Development
- Use `lib/actions/matching.ts` for core matching logic
- Embedding generation in `lib/embedding/` utilities
- Admin matching controls in `components/admin/matching/`
- Anonymous user flow in `app/matching/` routes

### Database Schema Changes
- Always regenerate TypeScript types after schema changes
- Use migrations for pgvector index updates
- Test RLS policies with anonymous session tokens
- Monitor embedding job queue for async operations

## Tools and Workflow Notes

- **Database Management**: Use Supabase MCP tools for schema modifications
- **Embedding Operations**: OpenAI API integration for text-embedding-3-small
- **Performance Monitoring**: pgvector query performance and matching analytics

## Key Database Changes (2025.09.16)

### Matching System Tables
```sql
-- Core matching infrastructure
survey_questions (id, question_key, weight_category, base_weight)
survey_choices (id, question_id, choice_key, choice_embedding)
survey_images (id, question_id, image_key, image_embedding)
matching_sessions (id, session_token, responses, final_user_embedding)

-- 4D photographer profiles
photographer_profiles (
  photographer_id,
  style_emotion_embedding,
  communication_psychology_embedding, 
  purpose_story_embedding,
  companion_embedding
)

-- Results and analytics
matching_results (id, session_id, photographer_id, 4d_scores, total_score)
weight_experiments (id, weight_config, performance_metrics)
```

### Performance Indexes
```sql
-- pgvector similarity search optimization
CREATE INDEX USING ivfflat ON survey_choices (choice_embedding vector_cosine_ops);
CREATE INDEX USING ivfflat ON photographer_profiles (style_emotion_embedding vector_cosine_ops);
-- Additional indexes for all embedding dimensions
```