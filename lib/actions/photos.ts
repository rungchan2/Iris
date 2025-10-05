'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

export interface PhotoFilters {
  search?: string
  page?: number
  pageSize?: number
  isActive?: boolean
  photographerId?: string
  categoryId?: string
}

export interface PhotoMetadata {
  title?: string
  description?: string
  categoryIds?: string[]
  isPublic?: boolean
  displayOrder?: number
}

/**
 * Get photos with filtering and pagination
 */
export async function getPhotos(filters: PhotoFilters = {}) {
  try {
    const supabase = await createClient()
    const {
      search,
      page = 1,
      pageSize = 20,
      isActive,
      photographerId,
      categoryId
    } = filters

    let query = supabase
      .from('photos')
      .select(`
        *,
        photo_categories(
          category_id,
          categories(id, name, path)
        )
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`filename.ilike.%${search}%,title.ilike.%${search}%`)
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive)
    }

    if (photographerId) {
      query = query.eq('uploaded_by', photographerId)
    }

    if (categoryId) {
      query = query.contains('photo_categories.category_id', [categoryId])
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    // Order
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching photos', error, 'Photos')
      return { error: error.message }
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  } catch (error) {
    logger.error('Error in getPhotos', error, 'Photos')
    return { error: 'Failed to fetch photos' }
  }
}

/**
 * Get single photo by ID
 */
export async function getPhotoById(id: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('photos')
      .select(`
        *,
        photo_categories(
          category_id,
          categories(id, name, path)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Error fetching photo', error, 'Photos')
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    logger.error('Error in getPhotoById', error, 'Photos')
    return { error: 'Failed to fetch photo' }
  }
}

/**
 * Delete photo (storage + database + relations)
 */
export async function deletePhoto(id: string) {
  try {
    const supabase = await createClient()

    // Get photo details first
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('storage_url, uploaded_by')
      .eq('id', id)
      .single()

    if (fetchError || !photo) {
      return { success: false, error: 'Photo not found' }
    }

    // Extract storage path from URL
    const url = new URL(photo.storage_url)
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)

    if (pathMatch) {
      const storagePath = pathMatch[1]

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([storagePath])

      if (storageError) {
        logger.warn('Storage deletion failed, continuing with DB delete', storageError, 'Photos')
      }
    }

    // Delete photo_categories relations (cascade should handle this, but being explicit)
    await supabase
      .from('photo_categories')
      .delete()
      .eq('photo_id', id)

    // Delete photo record
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('Error deleting photo', deleteError, 'Photos')
      return { success: false, error: deleteError.message }
    }

    // Revalidate relevant paths
    revalidatePath('/admin/photos')
    revalidatePath(`/photographers/${photo.uploaded_by}`)

    return { success: true }
  } catch (error) {
    logger.error('Error in deletePhoto', error, 'Photos')
    return { success: false, error: 'Failed to delete photo' }
  }
}

/**
 * Update photo metadata
 */
export async function updatePhoto(id: string, metadata: PhotoMetadata) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('photos')
      .update({
        title: metadata.title,
        description: metadata.description,
        is_public: metadata.isPublic,
        display_order: metadata.displayOrder,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      logger.error('Error updating photo', error, 'Photos')
      return { success: false, error: error.message }
    }

    // Update categories if provided
    if (metadata.categoryIds) {
      // Delete existing categories
      await supabase
        .from('photo_categories')
        .delete()
        .eq('photo_id', id)

      // Insert new categories
      if (metadata.categoryIds.length > 0) {
        const categoryInserts = metadata.categoryIds.map(categoryId => ({
          photo_id: id,
          category_id: categoryId
        }))

        await supabase
          .from('photo_categories')
          .insert(categoryInserts)
      }
    }

    revalidatePath('/admin/photos')
    return { success: true }
  } catch (error) {
    logger.error('Error in updatePhoto', error, 'Photos')
    return { success: false, error: 'Failed to update photo' }
  }
}

/**
 * Assign categories to photos
 */
export async function assignCategories(photoIds: string[], categoryIds: string[]) {
  try {
    const supabase = await createClient()

    // Delete existing assignments for these photos
    await supabase.from('photo_categories').delete().in('photo_id', photoIds)

    // Insert new assignments
    if (categoryIds.length > 0) {
      const assignments = photoIds.flatMap((photoId) =>
        categoryIds.map((categoryId) => ({
          photo_id: photoId,
          category_id: categoryId,
        }))
      )

      const { error } = await supabase.from('photo_categories').insert(assignments)

      if (error) {
        logger.error('Failed to assign categories', { error })
        return { success: false, error: 'Failed to assign categories' }
      }
    }

    revalidatePath('/admin/photos')
    return { success: true }
  } catch (error) {
    logger.error('Unexpected error assigning categories', { error })
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete multiple photos at once
 */
export async function bulkDeletePhotos(photoIds: string[]) {
  try {
    const supabase = await createClient()

    // Get photo info for storage deletion
    const { data: photos } = await supabase.from('photos').select('storage_url').in('id', photoIds)

    // Extract storage paths from URLs
    const paths = photos
      ?.map((photo: any) => {
        const url = new URL(photo.storage_url)
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/photos\/(.+)/)
        return pathMatch ? pathMatch[1] : null
      })
      .filter((path: string | null): path is string => path !== null) || []

    // Delete from storage
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from('photos').remove(paths)
      if (storageError) {
        logger.error('Failed to delete photos from storage', { error: storageError })
      }
    }

    // Delete photo categories first (foreign key constraint)
    await supabase.from('photo_categories').delete().in('photo_id', photoIds)

    // Delete from database
    const { error: dbError } = await supabase.from('photos').delete().in('id', photoIds)

    if (dbError) {
      logger.error('Failed to delete photos from database', { error: dbError })
      return { success: false, error: 'Failed to delete photos' }
    }

    revalidatePath('/admin/photos')
    return { success: true }
  } catch (error) {
    logger.error('Unexpected error deleting photos', { error })
    return { success: false, error: 'An unexpected error occurred' }
  }
}
