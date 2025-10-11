import type { Tables, TablesInsert, TablesUpdate } from './database.types'

// ============================================================================
// Story Types
// ============================================================================

export type StoryDB = Tables<'stories'>
export type StoryInsert = TablesInsert<'stories'>
export type StoryUpdate = TablesUpdate<'stories'>

// ============================================================================
// Story Filters
// ============================================================================

export interface StoryFilters {
  moderationStatus?: string
  isSuspicious?: boolean
  isFeatured?: boolean
  visibility?: string
  searchTerm?: string
}
