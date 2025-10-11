import { z } from 'zod'
import type { Tables, TablesInsert, TablesUpdate } from './database.types'
import { DOCUMENT_TYPE_VALUES } from './enums'

// Database types
export type Terms = Tables<'terms'>
export type TermsInsert = TablesInsert<'terms'>
export type TermsUpdate = TablesUpdate<'terms'>

export type TermsSection = Tables<'terms_sections'>
export type TermsSectionInsert = TablesInsert<'terms_sections'>
export type TermsSectionUpdate = TablesUpdate<'terms_sections'>

// Zod schemas for forms
export const termsSectionSchema = z.object({
  article_number: z.number().int().positive(),
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  content: z.string().min(1, '내용을 입력해주세요'),
  display_order: z.number().int().min(0),
})

export type TermsSectionFormData = z.infer<typeof termsSectionSchema>

export const termsCreateSchema = z.object({
  document_type: z.enum(DOCUMENT_TYPE_VALUES as [string, ...string[]]),
  version: z.string().min(1, '버전을 입력해주세요').max(50),
  effective_date: z.date(),
  is_active: z.boolean(),
  sections: z.array(termsSectionSchema).min(1, '최소 1개 이상의 조항이 필요합니다'),
})

export type TermsCreateFormData = z.infer<typeof termsCreateSchema>

export const termsUpdateSchema = z.object({
  version: z.string().min(1).max(50).optional(),
  effective_date: z.date().optional(),
  is_active: z.boolean().optional(),
})

export type TermsUpdateFormData = z.infer<typeof termsUpdateSchema>

// Extended type with sections
export type TermsWithSections = Terms & {
  sections: TermsSection[]
}

// ============================================================================
// Build-time Type Checks (Database와 Form 타입 일치 검증)
// ============================================================================

// 1. Terms Section Form Check
type _TermsSectionFormDataCheck = {
  article_number: TermsSectionFormData['article_number'] extends NonNullable<TermsSectionInsert['article_number']>
    ? true
    : 'article_number type mismatch - check terms_sections.article_number column type'

  title: TermsSectionFormData['title'] extends NonNullable<TermsSectionInsert['title']>
    ? true
    : 'title type mismatch - check terms_sections.title column type'

  content: TermsSectionFormData['content'] extends NonNullable<TermsSectionInsert['content']>
    ? true
    : 'content type mismatch - check terms_sections.content column type'

  display_order: TermsSectionFormData['display_order'] extends NonNullable<TermsSectionInsert['display_order']>
    ? true
    : 'display_order type mismatch - check terms_sections.display_order column type'
}

// 2. Terms Create Form Check
type _TermsCreateFormDataCheck = {
  document_type: TermsCreateFormData['document_type'] extends NonNullable<TermsInsert['document_type']>
    ? true
    : 'document_type type mismatch - check terms.document_type column type'

  version: TermsCreateFormData['version'] extends NonNullable<TermsInsert['version']>
    ? true
    : 'version type mismatch - check terms.version column type'

  is_active: TermsCreateFormData['is_active'] extends NonNullable<TermsInsert['is_active']>
    ? true
    : 'is_active type mismatch - check terms.is_active column type'

  // effective_date: Date in form, string in DB - handled in conversion layer
  // sections: nested array, validated separately via TermsSectionFormData
}

// 3. Terms Update Form Check
type _TermsUpdateFormDataCheck = {
  version: NonNullable<TermsUpdateFormData['version']> extends NonNullable<TermsUpdate['version']>
    ? true
    : 'version type mismatch - check terms.version column type'

  is_active: NonNullable<TermsUpdateFormData['is_active']> extends NonNullable<TermsUpdate['is_active']>
    ? true
    : 'is_active type mismatch - check terms.is_active column type'

  // effective_date: Date in form, string in DB - handled in conversion layer
}
