import { z } from 'zod'
import type { Tables, TablesInsert, TablesUpdate } from './database.types'

// ============================================================================
// Zod Schemas for Reviews
// ============================================================================

/**
 * Review submission form schema
 * Used for validating review submissions from customers
 */
export const reviewSchema = z.object({
  reviewer_name: z.string().optional(),
  rating: z.number().min(1, '평점을 선택해주세요').max(5),
  comment: z.string().optional(),
  is_public: z.boolean(),
  is_anonymous: z.boolean(),
})

export type ReviewFormData = z.infer<typeof reviewSchema>

// ============================================================================
// Database Types
// ============================================================================

export type Review = Tables<'reviews'>
export type ReviewInsert = TablesInsert<'reviews'>
export type ReviewUpdate = TablesUpdate<'reviews'>

// ============================================================================
// Type Compatibility Checks
// These will cause build errors if Zod schema doesn't match database schema
// ============================================================================

type _ReviewFormDataCheck = {
  // Ensure ReviewFormData fields are compatible with ReviewInsert
  reviewer_name: ReviewFormData['reviewer_name'] extends ReviewInsert['reviewer_name'] ? true : 'reviewer_name type mismatch'
  rating: ReviewFormData['rating'] extends ReviewInsert['rating'] ? true : 'rating type mismatch'
  comment: ReviewFormData['comment'] extends ReviewInsert['comment'] ? true : 'comment type mismatch'
  is_public: ReviewFormData['is_public'] extends ReviewInsert['is_public'] ? true : 'is_public type mismatch'
  is_anonymous: ReviewFormData['is_anonymous'] extends ReviewInsert['is_anonymous'] ? true : 'is_anonymous type mismatch'
}
