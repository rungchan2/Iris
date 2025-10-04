'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type PhotographerKeyword = Database['public']['Tables']['photographer_keywords']['Row']
type PhotographerKeywordInsert = Database['public']['Tables']['photographer_keywords']['Insert']
type PhotographerKeywordUpdate = Database['public']['Tables']['photographer_keywords']['Update']

export interface CreateKeywordData {
  keyword: string
  proficiency_level?: number
  portfolio_count?: number
}

export interface UpdateKeywordData {
  keyword?: string
  proficiency_level?: number
  portfolio_count?: number
}

/**
 * Get all keywords for a photographer
 */
export async function getKeywords(
  photographerId: string
): Promise<{ data: PhotographerKeyword[] | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('photographer_keywords')
      .select('*')
      .eq('photographer_id', photographerId)
      .order('proficiency_level', { ascending: false })
      .order('keyword', { ascending: true })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching keywords:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Create a new keyword for a photographer
 */
export async function createKeyword(
  photographerId: string,
  keywordData: CreateKeywordData
): Promise<{ data: PhotographerKeyword | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const insertData: PhotographerKeywordInsert = {
      photographer_id: photographerId,
      keyword: keywordData.keyword,
      proficiency_level: keywordData.proficiency_level ?? 3,
      portfolio_count: keywordData.portfolio_count ?? 0
    }

    const { data, error } = await supabase
      .from('photographer_keywords')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating keyword:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Update an existing keyword
 */
export async function updateKeyword(
  photographerId: string,
  keyword: string,
  updateData: UpdateKeywordData
): Promise<{ data: PhotographerKeyword | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const update: PhotographerKeywordUpdate = {}
    if (updateData.keyword !== undefined) update.keyword = updateData.keyword
    if (updateData.proficiency_level !== undefined) update.proficiency_level = updateData.proficiency_level
    if (updateData.portfolio_count !== undefined) update.portfolio_count = updateData.portfolio_count

    const { data, error } = await supabase
      .from('photographer_keywords')
      .update(update)
      .eq('photographer_id', photographerId)
      .eq('keyword', keyword)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating keyword:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Delete a keyword
 */
export async function deleteKeyword(
  photographerId: string,
  keyword: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('photographer_keywords')
      .delete()
      .eq('photographer_id', photographerId)
      .eq('keyword', keyword)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error deleting keyword:', error)
    return {
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Bulk upsert keywords (useful for batch operations)
 */
export async function bulkUpsertKeywords(
  photographerId: string,
  keywords: CreateKeywordData[]
): Promise<{ data: PhotographerKeyword[] | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const insertData: PhotographerKeywordInsert[] = keywords.map(k => ({
      photographer_id: photographerId,
      keyword: k.keyword,
      proficiency_level: k.proficiency_level ?? 3,
      portfolio_count: k.portfolio_count ?? 0
    }))

    const { data, error } = await supabase
      .from('photographer_keywords')
      .upsert(insertData, {
        onConflict: 'photographer_id,keyword'
      })
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error bulk upserting keywords:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}
