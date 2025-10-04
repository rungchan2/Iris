'use server'

import { createClient } from '@/lib/supabase/server'
import { matchingLogger } from '@/lib/logger'

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
    
    // TODO: personality_admin_mapping 테이블 생성 후 활성화
    // Get photographer mappings for this personality type
    // const { data: mappings, error: mappingError } = await supabase
    //   .from('personality_admin_mapping')
    //   .select(`
    //     id,
    //     uploaded_by,
    //     compatibility_score,
    //     notes,
    //     is_primary,
    //     photographers!inner (
    //       id,
    //       name,
    //       email
    //     )
    //   `)
    //   .eq('personality_code', personalityCode)
    //   .order('compatibility_score', { ascending: false })
    //   .order('is_primary', { ascending: false })
    //   .limit(3)

    const mappings = null // 임시로 비활성화
    const mappingError = null
    
    // if (mappingError) {
    //   console.error('Error fetching photographer mappings:', mappingError)
    //   return { success: false, error: mappingError.message, photographers: [] }
    // }
    
    // if (!mappings || mappings.length === 0) {
    //   return { success: true, photographers: [] }
    // }
    
    // 임시로 빈 배열 반환 (personality_admin_mapping 테이블이 생성되기 전까지)
    return { success: true, photographers: [] }
    
    // TODO: 아래 코드는 personality_admin_mapping 테이블이 생성된 후 활성화
    // // Get portfolio photos for each photographer
    // const photographerIds = mappings.map(m => m.admin_id)
    
    // const { data: portfolioPhotos, error: portfolioError } = await supabase
    //   .from('photos')
    //   .select(`
    //     id,
    //     uploaded_by,
    //     storage_url,
    //     thumbnail_url,
    //     title,
    //     style_tags,
    //     is_representative,
    //     is_public
    //   `)
    //   .in('admin_id', photographerIds)
    //   .eq('is_public', true)
    //   .order('is_representative', { ascending: false })
    //   .order('display_order')
    
    // if (portfolioError) {
    //   console.error('Error fetching portfolio photos:', portfolioError)
    //   // Continue without portfolio photos
    // }
    
    // // Combine data
    // const photographers: RecommendedPhotographer[] = mappings.map(mapping => {
    //   const photographer = mapping.photographers
    //   const photos = portfolioPhotos?.filter(p => p.admin_id === mapping.admin_id) || []
      
    //   return {
    //     id: photographer.id,
    //     name: photographer.name,
    //     email: photographer.email,
    //     compatibility_score: mapping.compatibility_score,
    //     notes: mapping.notes,
    //     is_primary: mapping.is_primary,
    //     portfolio_photos: photos.slice(0, 6).map(photo => ({
    //       id: photo.id,
    //       photo_url: photo.photo_url,
    //       thumbnail_url: photo.thumbnail_url || photo.photo_url,
    //       title: photo.title,
    //       style_tags: photo.style_tags || [],
    //       is_representative: photo.is_representative
    //     })),
    //     total_photos: photos.length
    //   }
    // })
    
    // return { success: true, photographers }
  } catch (error) {
    matchingLogger.error('Error fetching recommended photographers', error)
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
      .from('photographers')
      .select(`
        id,
        name,
        email,
        created_at,
        photos!uploaded_by (
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
    matchingLogger.error('Error fetching all photographers', error)
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
      .from('photographers')
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
    
    // TODO: photos 테이블 활용하도록 수정 필요
    // Get portfolio photos
    // const { data: portfolioPhotos, error: portfolioError } = await supabase
    //   .from('photos')
    //   .select(`
    //     id,
    //     storage_url,
    //     thumbnail_url,
    //     title,
    //     description,
    //     style_tags,
    //     is_representative,
    //     display_order,
    //     view_count
    //   `)
    //   .eq('admin_id', photographerId)
    //   .eq('is_public', true)
    //   .order('is_representative', { ascending: false })
    //   .order('display_order')
    
    // if (portfolioError) {
    //   console.error('Error fetching portfolio photos:', portfolioError)
    // }
    
    const portfolioPhotos: any[] = [] // 임시로 빈 배열
    
    // TODO: personality_admin_mapping 테이블 생성 후 활성화
    // Get personality mappings
    // const { data: personalityMappings, error: mappingError } = await supabase
    //   .from('personality_admin_mapping')
    //   .select(`
    //     personality_code,
    //     compatibility_score,
    //     is_primary,
    //     notes,
    //     personality_types!inner (
    //       code,
    //       name,
    //       description
    //     )
    //   `)
    //   .eq('admin_id', photographerId)
    //   .order('compatibility_score', { ascending: false })
    
    const personalityMappings: any[] = [] // 임시로 빈 배열
    
    // if (mappingError) {
    //   console.error('Error fetching personality mappings:', mappingError)
    // }
    
    return {
      success: true,
      photographer: {
        ...photographer,
        portfolio_photos: portfolioPhotos || [],
        personality_mappings: personalityMappings || []
      }
    }
  } catch (error) {
    matchingLogger.error('Error fetching photographer details', error)
    return { success: false, error: 'Failed to fetch photographer details' }
  }
}