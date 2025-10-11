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

// Type checks
type _TermsSectionFormDataCheck = {
  article_number: TermsSectionFormData['article_number'] extends number ? true : 'article_number type mismatch'
  title: TermsSectionFormData['title'] extends string ? true : 'title type mismatch'
  content: TermsSectionFormData['content'] extends string ? true : 'content type mismatch'
  display_order: TermsSectionFormData['display_order'] extends number ? true : 'display_order type mismatch'
}

type _TermsCreateFormDataCheck = {
  version: TermsCreateFormData['version'] extends string ? true : 'version type mismatch'
  // effective_date: Date in form, string in DB - handled in conversion layer
}
