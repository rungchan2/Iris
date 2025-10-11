import type { Tables, TablesInsert, TablesUpdate } from './database.types'

// ============================================================================
// Photographer Keyword Types
// ============================================================================

export type PhotographerKeywordDB = Tables<'photographer_keywords'>
export type PhotographerKeywordInsert = TablesInsert<'photographer_keywords'>
export type PhotographerKeywordUpdate = TablesUpdate<'photographer_keywords'>

// ============================================================================
// Keyword Data Transfer Objects
// ============================================================================

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
