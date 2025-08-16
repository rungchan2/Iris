'use server'

import { createClient } from '@/lib/supabase/server'

export interface RecommendedPhotographer {
  id: string;
  name: string;
  email: string;
  compatibility_score: number;
  notes?: string;
  is_primary: boolean;
  portfolio_photos: {
    id: string;
    photo_url: string;
    thumbnail_url: string;
    title?: string;
    style_tags: string[];
    is_representative: boolean;
  }[];
  total_photos: number;
}

/**
 * Get recommended photographers for a personality type
 */
export async function getRecommendedPhotographers(personalityCode: string) {
  try {
    const supabase = await createClient()
    
    // Get photographer mappings for this personality type
    const { data: mappings, error: mappingError } = await supabase
      .from('personality_admin_mapping')
      .select(`
        id,
        admin_id,
        compatibility_score,
        notes,
        is_primary,
        admin_users!inner (
          id,
          name,
          email
        )
      `)
      .eq('personality_code', personalityCode)
      .order('compatibility_score', { ascending: false })
      .order('is_primary', { ascending: false })
      .limit(3)
    
    if (mappingError) {
      console.error('Error fetching photographer mappings:', mappingError)
      return { success: false, error: mappingError.message, photographers: [] }
    }
    
    if (!mappings || mappings.length === 0) {
      return { success: true, photographers: [] }
    }
    
    // Get portfolio photos for each photographer
    const photographerIds = mappings.map(m => m.admin_id)
    
    const { data: portfolioPhotos, error: portfolioError } = await supabase
      .from('admin_portfolio_photos')
      .select(`
        id,
        admin_id,
        photo_url,
        thumbnail_url,
        title,
        style_tags,
        is_representative,
        is_public
      `)
      .in('admin_id', photographerIds)
      .eq('is_public', true)
      .order('is_representative', { ascending: false })
      .order('display_order')
    
    if (portfolioError) {
      console.error('Error fetching portfolio photos:', portfolioError)
      // Continue without portfolio photos
    }
    
    // Combine data
    const photographers: RecommendedPhotographer[] = mappings.map(mapping => {
      const adminUser = mapping.admin_users
      const photos = portfolioPhotos?.filter(p => p.admin_id === mapping.admin_id) || []
      
      return {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        compatibility_score: mapping.compatibility_score,
        notes: mapping.notes,
        is_primary: mapping.is_primary,
        portfolio_photos: photos.slice(0, 6).map(photo => ({
          id: photo.id,
          photo_url: photo.photo_url,
          thumbnail_url: photo.thumbnail_url || photo.photo_url,
          title: photo.title,
          style_tags: photo.style_tags || [],
          is_representative: photo.is_representative
        })),
        total_photos: photos.length
      }
    })
    
    return { success: true, photographers }
  } catch (error) {
    console.error('Error fetching recommended photographers:', error)
    return { success: false, error: 'Failed to fetch recommended photographers', photographers: [] }
  }
}

/**
 * Get all photographers with their portfolio stats
 */
export async function getAllPhotographers() {
  try {
    const supabase = await createClient()
    
    const { data: photographers, error } = await supabase
      .from('admin_users')
      .select(`
        id,
        name,
        email,
        created_at,
        admin_portfolio_photos!inner (
          id,
          is_representative,
          is_public
        )
      `)
      .order('name')
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, photographers }
  } catch (error) {
    console.error('Error fetching all photographers:', error)
    return { success: false, error: 'Failed to fetch photographers' }
  }
}

/**
 * Get photographer details with full portfolio
 */
export async function getPhotographerDetails(photographerId: string) {
  try {
    const supabase = await createClient()
    
    // Get photographer basic info
    const { data: photographer, error: photographerError } = await supabase
      .from('admin_users')
      .select(`
        id,
        name,
        email,
        created_at
      `)
      .eq('id', photographerId)
      .single()
    
    if (photographerError) {
      return { success: false, error: photographerError.message }
    }
    
    // Get portfolio photos
    const { data: portfolioPhotos, error: portfolioError } = await supabase
      .from('admin_portfolio_photos')
      .select(`
        id,
        photo_url,
        thumbnail_url,
        title,
        description,
        style_tags,
        is_representative,
        display_order,
        view_count
      `)
      .eq('admin_id', photographerId)
      .eq('is_public', true)
      .order('is_representative', { ascending: false })
      .order('display_order')
    
    if (portfolioError) {
      console.error('Error fetching portfolio photos:', portfolioError)
    }
    
    // Get personality mappings
    const { data: personalityMappings, error: mappingError } = await supabase
      .from('personality_admin_mapping')
      .select(`
        personality_code,
        compatibility_score,
        is_primary,
        notes,
        personality_types!inner (
          code,
          name,
          description
        )
      `)
      .eq('admin_id', photographerId)
      .order('compatibility_score', { ascending: false })
    
    if (mappingError) {
      console.error('Error fetching personality mappings:', mappingError)
    }
    
    return {
      success: true,
      photographer: {
        ...photographer,
        portfolio_photos: portfolioPhotos || [],
        personality_mappings: personalityMappings || []
      }
    }
  } catch (error) {
    console.error('Error fetching photographer details:', error)
    return { success: false, error: 'Failed to fetch photographer details' }
  }
}