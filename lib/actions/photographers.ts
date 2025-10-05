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

export interface FeaturedPhotographer {
  id: string
  name: string
  email: string
  bio: string | null
  specialties: string[] | null
  profile_image_url: string | null
  years_experience: number | null
  rating: number
  review_count: number
  photos: Array<{
    id: string
    storage_url: string
  }>
}

/**
 * Get featured photographers for homepage (approved photographers with photos)
 */
export async function getFeaturedPhotographers(limit: number = 3) {
  try {
    const supabase = await createClient()

    // Get approved photographers with their photos
    const { data: photographers, error } = await supabase
      .from('photographers')
      .select(`
        id,
        name,
        email,
        bio,
        specialties,
        profile_image_url,
        approval_status,
        years_experience,
        photos!uploaded_by (
          id,
          storage_url
        )
      `)
      .eq('approval_status', 'approved')
      .not('photos', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      photographerLogger.error('Error fetching featured photographers:', error)
      return { success: false, error: error.message, data: [] }
    }

    if (!photographers || photographers.length === 0) {
      photographerLogger.warn('No approved photographers found')
      return { success: true, data: [] }
    }

    // Calculate rating and review count for each photographer
    const photographersWithStats = await Promise.all(
      photographers.map(async (photographer) => {
        // Get reviews for this photographer
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('photographer_id', photographer.id)
          .eq('status', 'published')

        const reviewCount = reviews?.length || 0
        const averageRating =
          reviewCount > 0
            ? reviews!.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
            : 0

        return {
          ...photographer,
          rating: Number(averageRating.toFixed(1)),
          review_count: reviewCount,
          photos: photographer.photos || [],
        } as FeaturedPhotographer
      })
    )

    photographerLogger.info(`Fetched ${photographersWithStats.length} featured photographers`)

    return {
      success: true,
      data: photographersWithStats,
    }
  } catch (error) {
    photographerLogger.error('Unexpected error fetching featured photographers:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    }
  }
}

/**
 * Get current photographer's profile with photographer_profiles data
 * @returns Current photographer data with profile or null if not found/authenticated
 */
export async function getCurrentPhotographerProfile() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Get photographer data
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select('*')
      .eq('email', user.email!)
      .single()

    if (photographerError || !photographer) {
      photographerLogger.error('Photographer not found', { email: user.email, error: photographerError })
      return {
        success: false,
        error: 'Photographer not found',
      }
    }

    // Get photographer profile (or create if doesn't exist)
    const profileResult = await supabase
      .from('photographer_profiles')
      .select('*')
      .eq('photographer_id', photographer.id)
      .single()

    let profile = profileResult.data

    // If profile doesn't exist, create it
    if (profileResult.error && profileResult.error.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('photographer_profiles')
        .insert({
          photographer_id: photographer.id,
          service_regions: [],
          price_min: 100000,
          price_max: 500000,
          companion_types: [],
          profile_completed: false
        })
        .select()
        .single()

      if (createError) {
        photographerLogger.error('Error creating profile', createError)
        return {
          success: false,
          error: 'Failed to create profile',
        }
      }

      profile = newProfile
    } else if (profileResult.error) {
      photographerLogger.error('Error loading profile', profileResult.error)
      return {
        success: false,
        error: 'Failed to load profile',
      }
    }

    return {
      success: true,
      data: {
        photographer,
        profile,
        user
      },
    }
  } catch (error) {
    photographerLogger.error('Error in getCurrentPhotographerProfile', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    }
  }
}