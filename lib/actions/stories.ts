'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { adminLogger } from '@/lib/logger'
import { Database } from '@/types/database.types'

type Story = Database['public']['Tables']['stories']['Row']
type StoryUpdate = Database['public']['Tables']['stories']['Update']

export interface StoryFilters {
  moderationStatus?: string
  isSuspicious?: boolean
  isFeatured?: boolean
  visibility?: string
  searchTerm?: string
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Get stories with filters and pagination
 */
export async function getStories(params: {
  page?: number
  limit?: number
  filters?: StoryFilters
} = {}) {
  try {
    const supabase = await createClient()
    const { page = 1, limit = 20, filters } = params

    let query = supabase
      .from('stories')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters?.moderationStatus && filters.moderationStatus !== 'all') {
      query = query.eq('moderation_status', filters.moderationStatus)
    }

    if (filters?.isSuspicious !== undefined) {
      query = query.eq('is_suspicious', filters.isSuspicious)
    }

    if (filters?.isFeatured !== undefined) {
      query = query.eq('is_featured', filters.isFeatured)
    }

    if (filters?.visibility && filters.visibility !== 'all') {
      query = query.eq('visibility', filters.visibility)
    }

    if (filters?.searchTerm) {
      query = query.or(`body.ilike.%${filters.searchTerm}%,contact_name.ilike.%${filters.searchTerm}%`)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      adminLogger.error('Error fetching stories', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data as Story[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    }
  } catch (error) {
    adminLogger.error('Unexpected error in getStories', error)
    return {
      success: false,
      error: 'Failed to fetch stories',
    }
  }
}

/**
 * Get story by ID
 */
export async function getStoryById(id: string): Promise<ApiResponse<Story>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      adminLogger.error('Error fetching story', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data as Story,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in getStoryById', error)
    return {
      success: false,
      error: 'Failed to fetch story',
    }
  }
}

/**
 * Get story statistics
 */
export async function getStoryStats() {
  try {
    const supabase = await createClient()

    const { data: stories, error } = await supabase
      .from('stories')
      .select('moderation_status, is_suspicious, is_featured, visibility')

    if (error) {
      adminLogger.error('Error fetching story stats', error)
      return {
        success: false,
        error: error.message,
      }
    }

    const stats = {
      total: stories.length,
      pending: stories.filter(s => s.moderation_status === 'pending').length,
      approved: stories.filter(s => s.moderation_status === 'approved').length,
      rejected: stories.filter(s => s.moderation_status === 'rejected').length,
      suspicious: stories.filter(s => s.is_suspicious).length,
      featured: stories.filter(s => s.is_featured).length,
      public: stories.filter(s => s.visibility === 'public').length,
      private: stories.filter(s => s.visibility === 'private').length,
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in getStoryStats', error)
    return {
      success: false,
      error: 'Failed to fetch story statistics',
    }
  }
}

/**
 * Approve a story
 */
export async function approveStory(id: string, note?: string): Promise<ApiResponse<Story>> {
  try {
    const supabase = await createClient()

    // Get admin user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const updateData: StoryUpdate = {
      moderation_status: 'approved',
      moderated_at: new Date().toISOString(),
      moderated_by: user.id,
      moderation_note: note || null,
    }

    const { data, error } = await supabase
      .from('stories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      adminLogger.error('Error approving story', error)
      return {
        success: false,
        error: error.message,
      }
    }

    adminLogger.info('Story approved', { storyId: id, moderatedBy: user.id })
    revalidatePath('/admin/stories')

    return {
      success: true,
      data: data as Story,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in approveStory', error)
    return {
      success: false,
      error: 'Failed to approve story',
    }
  }
}

/**
 * Reject a story
 */
export async function rejectStory(id: string, note: string): Promise<ApiResponse<Story>> {
  try {
    const supabase = await createClient()

    // Get admin user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const updateData: StoryUpdate = {
      moderation_status: 'rejected',
      moderated_at: new Date().toISOString(),
      moderated_by: user.id,
      moderation_note: note,
    }

    const { data, error } = await supabase
      .from('stories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      adminLogger.error('Error rejecting story', error)
      return {
        success: false,
        error: error.message,
      }
    }

    adminLogger.info('Story rejected', { storyId: id, moderatedBy: user.id })
    revalidatePath('/admin/stories')

    return {
      success: true,
      data: data as Story,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in rejectStory', error)
    return {
      success: false,
      error: 'Failed to reject story',
    }
  }
}

/**
 * Toggle featured status
 */
export async function toggleFeaturedStory(id: string): Promise<ApiResponse<Story>> {
  try {
    const supabase = await createClient()

    // Get current featured status
    const { data: story } = await supabase
      .from('stories')
      .select('is_featured')
      .eq('id', id)
      .single()

    if (!story) {
      return {
        success: false,
        error: 'Story not found',
      }
    }

    const { data, error } = await supabase
      .from('stories')
      .update({ is_featured: !story.is_featured })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      adminLogger.error('Error toggling featured status', error)
      return {
        success: false,
        error: error.message,
      }
    }

    adminLogger.info('Story featured status toggled', { storyId: id, isFeatured: !story.is_featured })
    revalidatePath('/admin/stories')

    return {
      success: true,
      data: data as Story,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in toggleFeaturedStory', error)
    return {
      success: false,
      error: 'Failed to toggle featured status',
    }
  }
}

/**
 * Update story visibility
 */
export async function updateStoryVisibility(
  id: string,
  visibility: 'public' | 'private'
): Promise<ApiResponse<Story>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('stories')
      .update({ visibility })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      adminLogger.error('Error updating story visibility', error)
      return {
        success: false,
        error: error.message,
      }
    }

    adminLogger.info('Story visibility updated', { storyId: id, visibility })
    revalidatePath('/admin/stories')

    return {
      success: true,
      data: data as Story,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in updateStoryVisibility', error)
    return {
      success: false,
      error: 'Failed to update story visibility',
    }
  }
}

/**
 * Delete a story
 */
export async function deleteStory(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id)

    if (error) {
      adminLogger.error('Error deleting story', error)
      return {
        success: false,
        error: error.message,
      }
    }

    adminLogger.info('Story deleted', { storyId: id })
    revalidatePath('/admin/stories')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in deleteStory', error)
    return {
      success: false,
      error: 'Failed to delete story',
    }
  }
}
