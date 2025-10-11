'use server'

import { createClient } from '@/lib/supabase/server'
import { adminLogger } from '@/lib/logger'
import type {
  Terms,
  TermsInsert,
  TermsUpdate,
  TermsSection,
  TermsSectionInsert,
  TermsSectionUpdate,
  TermsWithSections,
  TermsCreateFormData,
  DocumentType,
} from '@/types'
import { DOCUMENT_TYPE } from '@/types'

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Get active terms by document type
 */
export async function getActiveTerms(
  documentType: DocumentType = DOCUMENT_TYPE.TERMS_OF_SERVICE
): Promise<ApiResponse<TermsWithSections | null>> {
  try {
    const supabase = await createClient()

    const { data: terms, error: termsError } = await supabase
      .from('terms')
      .select(`
        *,
        sections:terms_sections(*)
      `)
      .eq('is_active', true)
      .eq('document_type', documentType)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()

    if (termsError) {
      if (termsError.code === 'PGRST116') {
        // No active terms found
        return { success: true, data: null }
      }
      adminLogger.error('Error fetching active terms:', termsError)
      return { success: false, error: termsError.message }
    }

    // Sort sections by display_order
    if (terms && terms.sections) {
      terms.sections.sort((a, b) => a.display_order - b.display_order)
    }

    return { success: true, data: terms as unknown as TermsWithSections }
  } catch (error) {
    adminLogger.error('Unexpected error in getActiveTerms:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch active terms',
    }
  }
}

/**
 * Get all terms by document type (admin only)
 */
export async function getAllTerms(
  documentType?: DocumentType
): Promise<ApiResponse<TermsWithSections[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('terms')
      .select(`
        *,
        sections:terms_sections(*)
      `)

    // Filter by document type if provided
    if (documentType) {
      query = query.eq('document_type', documentType)
    }

    const { data: terms, error } = await query
      .order('effective_date', { ascending: false })

    if (error) {
      adminLogger.error('Error fetching all terms:', error)
      return { success: false, error: error.message }
    }

    // Sort sections by display_order for each term
    const sortedTerms = terms.map((term) => {
      if (term.sections) {
        term.sections.sort((a, b) => a.display_order - b.display_order)
      }
      return term
    })

    return { success: true, data: sortedTerms as unknown as TermsWithSections[] }
  } catch (error) {
    adminLogger.error('Unexpected error in getAllTerms:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch terms',
    }
  }
}

/**
 * Get terms by ID
 */
export async function getTermsById(id: string): Promise<ApiResponse<TermsWithSections>> {
  try {
    const supabase = await createClient()

    const { data: terms, error } = await supabase
      .from('terms')
      .select(`
        *,
        sections:terms_sections(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      adminLogger.error('Error fetching terms by ID:', error)
      return { success: false, error: error.message }
    }

    // Sort sections by display_order
    if (terms && terms.sections) {
      terms.sections.sort((a, b) => a.display_order - b.display_order)
    }

    return { success: true, data: terms as unknown as TermsWithSections }
  } catch (error) {
    adminLogger.error('Unexpected error in getTermsById:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch terms',
    }
  }
}

/**
 * Create new terms with sections (admin only)
 */
export async function createTerms(
  data: TermsCreateFormData
): Promise<ApiResponse<TermsWithSections>> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // If this is set to active, deactivate all other terms of the same document type first
    if (data.is_active) {
      const { error: deactivateError } = await supabase
        .from('terms')
        .update({ is_active: false })
        .eq('is_active', true)
        .eq('document_type', data.document_type)

      if (deactivateError) {
        adminLogger.error('Error deactivating other terms:', deactivateError)
        return { success: false, error: deactivateError.message }
      }
    }

    // Create terms
    const termsInsert: TermsInsert = {
      document_type: data.document_type,
      version: data.version,
      effective_date: data.effective_date.toISOString(),
      is_active: data.is_active,
      created_by: user.id,
      updated_by: user.id,
    }

    const { data: newTerms, error: termsError } = await supabase
      .from('terms')
      .insert(termsInsert)
      .select()
      .single()

    if (termsError) {
      adminLogger.error('Error creating terms:', termsError)
      return { success: false, error: termsError.message }
    }

    // Create sections
    const sectionsInsert: TermsSectionInsert[] = data.sections.map((section) => ({
      terms_id: newTerms.id,
      article_number: section.article_number,
      title: section.title,
      content: section.content,
      display_order: section.display_order,
    }))

    const { data: newSections, error: sectionsError } = await supabase
      .from('terms_sections')
      .insert(sectionsInsert)
      .select()

    if (sectionsError) {
      adminLogger.error('Error creating terms sections:', sectionsError)
      // Rollback: delete the terms
      await supabase.from('terms').delete().eq('id', newTerms.id)
      return { success: false, error: sectionsError.message }
    }

    adminLogger.info('Terms created', { termsId: newTerms.id, userId: user.id })

    return {
      success: true,
      data: {
        ...newTerms,
        sections: newSections.sort((a, b) => a.display_order - b.display_order),
      } as unknown as TermsWithSections,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in createTerms:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create terms',
    }
  }
}

/**
 * Update terms (admin only)
 */
export async function updateTerms(
  id: string,
  data: TermsUpdate
): Promise<ApiResponse<Terms>> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // If setting to active, deactivate all other terms of the same document type first
    if (data.is_active) {
      // First, get the document type of the current terms
      const { data: currentTerms } = await supabase
        .from('terms')
        .select('document_type')
        .eq('id', id)
        .single()

      if (currentTerms) {
        const { error: deactivateError } = await supabase
          .from('terms')
          .update({ is_active: false })
          .eq('is_active', true)
          .eq('document_type', currentTerms.document_type)
          .neq('id', id)

        if (deactivateError) {
          adminLogger.error('Error deactivating other terms:', deactivateError)
          return { success: false, error: deactivateError.message }
        }
      }
    }

    const { data: updatedTerms, error } = await supabase
      .from('terms')
      .update({
        ...data,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      adminLogger.error('Error updating terms:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Terms updated', { termsId: id, userId: user.id })
    return { success: true, data: updatedTerms }
  } catch (error) {
    adminLogger.error('Unexpected error in updateTerms:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update terms',
    }
  }
}

/**
 * Delete terms (admin only)
 */
export async function deleteTerms(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('terms').delete().eq('id', id)

    if (error) {
      adminLogger.error('Error deleting terms:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Terms deleted', { termsId: id })
    return { success: true, data: undefined }
  } catch (error) {
    adminLogger.error('Unexpected error in deleteTerms:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete terms',
    }
  }
}

/**
 * Update term section (admin only)
 */
export async function updateTermsSection(
  id: string,
  data: TermsSectionUpdate
): Promise<ApiResponse<TermsSection>> {
  try {
    const supabase = await createClient()

    const { data: updatedSection, error } = await supabase
      .from('terms_sections')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      adminLogger.error('Error updating terms section:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Terms section updated', { sectionId: id })
    return { success: true, data: updatedSection }
  } catch (error) {
    adminLogger.error('Unexpected error in updateTermsSection:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update section',
    }
  }
}

/**
 * Activate specific terms version (admin only)
 */
export async function activateTerms(id: string): Promise<ApiResponse<Terms>> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get the document type of the terms to activate
    const { data: termsToActivate } = await supabase
      .from('terms')
      .select('document_type')
      .eq('id', id)
      .single()

    if (!termsToActivate) {
      return { success: false, error: 'Terms not found' }
    }

    // Deactivate all other terms of the same document type
    const { error: deactivateError } = await supabase
      .from('terms')
      .update({ is_active: false })
      .eq('is_active', true)
      .eq('document_type', termsToActivate.document_type)
      .neq('id', id)

    if (deactivateError) {
      adminLogger.error('Error deactivating other terms:', deactivateError)
      return { success: false, error: deactivateError.message }
    }

    // Activate the specified terms
    const { data: activatedTerms, error } = await supabase
      .from('terms')
      .update({
        is_active: true,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      adminLogger.error('Error activating terms:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Terms activated', { termsId: id, userId: user.id })
    return { success: true, data: activatedTerms }
  } catch (error) {
    adminLogger.error('Unexpected error in activateTerms:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to activate terms',
    }
  }
}
