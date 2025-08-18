'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Get recommended photos for a personality type
 */
export async function getPersonalityPhotos(personalityCode: string) {
  try {
    const supabase = await createClient()
    
    // TODO: personality_photos 테이블 생성 후 활성화
    // 임시로 일반 갤러리 사진들을 반환
    const { data: randomPhotos, error: randomError } = await supabase
      .from('photos')
      .select(`
        id,
        storage_url,
        thumbnail_url,
        filename
      `)
      .eq('is_active', true)
      .limit(9)
    
    if (randomError) {
      return { success: false, error: randomError.message, photos: [] }
    }
    
    // Transform random photos to match expected format
    const photos = randomPhotos?.map((photo, index) => ({
      id: photo.id,
      photo_url: photo.storage_url,
      thumbnail_url: photo.thumbnail_url || photo.storage_url,
      title: `갤러리 사진 ${index + 1}`,
      description: photo.filename,
      style_tags: [],
      display_order: index + 1
    })) || []
    
    return { success: true, photos }

    // TODO: 아래 코드는 personality_photos 테이블이 생성된 후 활성화
    // // First, get the personality photos mapping
    // const { data: mappings, error: mappingError } = await supabase
    //   .from('personality_photos')
    //   .select(`
    //     id,
    //     photo_id,
    //     is_representative,
    //     display_order
    //   `)
    //   .eq('personality_code', personalityCode)
    //   .order('display_order')
    //   .limit(9)
    
    // if (mappingError) {
    //   console.error('Error fetching personality photo mappings:', mappingError)
    //   return { success: false, error: mappingError.message, photos: [] }
    // }
    
    // if (!mappings || mappings.length === 0) {
    //   // If no specific photos are mapped, try to get random photos from gallery
    //   const { data: randomPhotos, error: randomError } = await supabase
    //     .from('photos')
    //     .select(`
    //       id,
    //       storage_url,
    //       thumbnail_url,
    //       filename
    //     `)
    //     .eq('is_active', true)
    //     .limit(9)
      
    //   if (randomError) {
    //     return { success: false, error: randomError.message, photos: [] }
    //   }
      
    //   // Transform random photos to match expected format
    //   const photos = randomPhotos?.map((photo, index) => ({
    //     id: photo.id,
    //     photo_url: photo.storage_url,
    //     thumbnail_url: photo.thumbnail_url || photo.storage_url,
    //     title: `갤러리 사진 ${index + 1}`,
    //     description: photo.filename,
    //     style_tags: [],
    //     display_order: index + 1
    //   })) || []
      
    //   return { success: true, photos }
    // }
    
    // // Get the actual photo data for the mapped photos
    // const photoIds = mappings.map(m => m.photo_id).filter(Boolean)
    
    // if (photoIds.length === 0) {
    //   return { success: true, photos: [] }
    // }
    
    // const { data: photos, error: photosError } = await supabase
    //   .from('photos')
    //   .select(`
    //     id,
    //     storage_url,
    //     thumbnail_url,
    //     filename
    //   `)
    //   .in('id', photoIds)
    
    // if (photosError) {
    //   return { success: false, error: photosError.message, photos: [] }
    // }
    
    // // Combine the mapping data with photo data
    // const combinedPhotos = mappings.map(mapping => {
    //   const photo = photos?.find(p => p.id === mapping.photo_id)
    //   if (!photo) return null
      
    //   return {
    //     id: photo.id,
    //     photo_url: photo.storage_url,
    //     thumbnail_url: photo.thumbnail_url || photo.storage_url,
    //     title: `추천 스타일 ${mapping.display_order}`,
    //     description: `${personalityCode} 성향에 어울리는 사진`,
    //     style_tags: [],
    //     display_order: mapping.display_order || 1
    //   }
    // }).filter(Boolean)
    
    // return { success: true, photos: combinedPhotos }
  } catch (error) {
    console.error('Error fetching personality photos:', error)
    return { success: false, error: 'Failed to fetch personality photos', photos: [] }
  }
}

/**
 * Get all personality types with their details
 */
export async function getAllPersonalityDetails() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('personality_types')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, personalityTypes: data }
  } catch (error) {
    console.error('Error fetching personality types:', error)
    return { success: false, error: 'Failed to fetch personality types' }
  }
}