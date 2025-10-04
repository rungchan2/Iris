'use server'

import { createClient } from '@/lib/supabase/server'
import { photographerLogger } from '@/lib/logger'

/**
 * Photographer Collection Operations
 *
 * This file contains functions for querying multiple photographers.
 * For single photographer operations (create, approve, reject), see photographer.ts
 */

export interface PhotographerData {
  id: string
  name: string
  email: string
  created_at: string
  portfolioCount: number
  personality_type?: string | null
  directing_style?: string | null
  photography_approach?: string | null
  youtube_intro_url?: string | null
  profile_image_url?: string | null
  personalityTypes: Array<{
    code: string
    name: string
    compatibility: number
    isPrimary: boolean
    notes?: string
  }>
}

export interface PhotographerFilters {
  search?: string
  personalityCode?: string
  sortBy?: 'name' | 'rating' | 'experience' | 'portfolio' | 'compatibility'
}

/**
 * Get list of photographers with filtering and sorting
 * @param filters - Optional filters for search, personality, and sorting
 * @returns List of photographers with portfolio counts
 */

export async function getPhotographers(filters: PhotographerFilters = {}) {
  try {
    const supabase = await createClient()
    
    // Base query to get photographers with portfolio count and style fields
    // Admin 계정은 제외 (is_admin_account = false인 것만)
    let query = supabase
      .from('photographers')
      .select(`
        id,
        name,
        email,
        created_at,
        personality_type,
        directing_style,
        photography_approach,
        youtube_intro_url,
        profile_image_url,
        photos!uploaded_by(count)
      `)
    
    // Apply search filter
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }
    
    const { data: photographers, error } = await query
    
    if (error) {
      photographerLogger.error('Error fetching photographers', error)
      return { error: error.message }
    }
    
    if (!photographers) {
      return { data: [] }
    }
    
    // Transform data
    const transformedData: PhotographerData[] = photographers.map(photographer => ({
      id: photographer.id,
      name: photographer.name || '',
      email: photographer.email || '',
      created_at: photographer.created_at || '',
      personality_type: photographer.personality_type,
      directing_style: photographer.directing_style,
      photography_approach: photographer.photography_approach,
      youtube_intro_url: photographer.youtube_intro_url,
      profile_image_url: photographer.profile_image_url,
      portfolioCount: photographer.photos?.length || 0,
      personalityTypes: [] // TODO: personality_admin_mapping 테이블 생성 후 활성화
    }))
    
    // Apply personality filter
    // TODO: personality_admin_mapping 테이블 생성 후 활성화
    // if (filters.personalityCode) {
    //   transformedData = transformedData.filter(photographer => 
    //     photographer.personalityTypes.some(pt => pt.code === filters.personalityCode)
    //   )
    // }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'name':
        transformedData.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'portfolio':
        transformedData.sort((a, b) => b.portfolioCount - a.portfolioCount)
        break
      case 'compatibility':
        transformedData.sort((a, b) => {
          const aMaxCompat = Math.max(...a.personalityTypes.map(pt => pt.compatibility), 0)
          const bMaxCompat = Math.max(...b.personalityTypes.map(pt => pt.compatibility), 0)
          return bMaxCompat - aMaxCompat
        })
        break
      case 'experience':
        // For now, sort by created_at (older accounts = more experience)
        transformedData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'rating':
        // For now, sort by portfolio count as a proxy for rating
        transformedData.sort((a, b) => b.portfolioCount - a.portfolioCount)
        break
      default:
        transformedData.sort((a, b) => a.name.localeCompare(b.name))
    }
    
    return { data: transformedData }
  } catch (error) {
    photographerLogger.error('Error in getPhotographers', error)
    return { error: 'Failed to fetch photographers' }
  }
}

export async function getPhotographerById(id: string) {
  try {
    const supabase = await createClient()
    
    const { data: photographer, error } = await supabase
      .from('photographers')
      .select(`
        *,
        photos!uploaded_by(
          id,
          storage_url,
          thumbnail_url,
          title,
          description,
          style_tags,
          display_order,
          is_representative,
          view_count,
          is_public
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      photographerLogger.error('Error fetching photographer', error)
      return { error: error.message }
    }
    
    if (!photographer) {
      return { error: 'Photographer not found' }
    }
    
    return { data: photographer }
  } catch (error) {
    photographerLogger.error('Error in getPhotographerById', error)
    return { error: 'Failed to fetch photographer' }
  }
}

export async function getPersonalityTypes() {
  try {
    // personality_types 테이블이 삭제되었으므로 빈 배열 반환
    // TODO: 새로운 매칭 시스템으로 교체 필요
    return { data: [] }
  } catch (error) {
    photographerLogger.error('Error in getPersonalityTypes', error)
    return { error: 'Failed to fetch personality types' }
  }
}