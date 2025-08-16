'use server'

import { createClient } from '@/lib/supabase/server'

export interface PhotographerData {
  id: string
  name: string
  email: string
  created_at: string
  portfolioCount: number
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

export async function getPhotographers(filters: PhotographerFilters = {}) {
  try {
    const supabase = await createClient()
    
    // Base query to get admin users with portfolio count
    let query = supabase
      .from('admin_users')
      .select(`
        id,
        name,
        email,
        created_at,
        admin_portfolio_photos(count),
        personality_admin_mapping(
          personality_code,
          compatibility_score,
          is_primary,
          notes,
          personality_types(
            code,
            name
          )
        )
      `)
    
    // Apply search filter
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }
    
    const { data: photographers, error } = await query
    
    if (error) {
      console.error('Error fetching photographers:', error.message)
      return { error: error.message }
    }
    
    if (!photographers) {
      return { data: [] }
    }
    
    // Transform data
    let transformedData: PhotographerData[] = photographers.map(photographer => ({
      id: photographer.id,
      name: photographer.name,
      email: photographer.email,
      created_at: photographer.created_at || '',
      portfolioCount: photographer.admin_portfolio_photos?.length || 0,
      personalityTypes: (photographer.personality_admin_mapping || []).map((mapping: any) => ({
        code: mapping.personality_types?.code || mapping.personality_code,
        name: mapping.personality_types?.name || '',
        compatibility: mapping.compatibility_score || 0,
        isPrimary: mapping.is_primary || false,
        notes: mapping.notes
      }))
    }))
    
    // Apply personality filter
    if (filters.personalityCode) {
      transformedData = transformedData.filter(photographer => 
        photographer.personalityTypes.some(pt => pt.code === filters.personalityCode)
      )
    }
    
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
    console.error('Error in getPhotographers:', error)
    return { error: 'Failed to fetch photographers' }
  }
}

export async function getPhotographerById(id: string) {
  try {
    const supabase = await createClient()
    
    const { data: photographer, error } = await supabase
      .from('admin_users')
      .select(`
        id,
        name,
        email,
        created_at,
        admin_portfolio_photos(
          id,
          photo_url,
          thumbnail_url,
          title,
          description,
          style_tags,
          display_order,
          is_representative,
          view_count
        ),
        personality_admin_mapping(
          personality_code,
          compatibility_score,
          is_primary,
          notes,
          personality_types(
            code,
            name,
            description,
            style_keywords,
            recommended_locations,
            recommended_props
          )
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching photographer:', error.message)
      return { error: error.message }
    }
    
    if (!photographer) {
      return { error: 'Photographer not found' }
    }
    
    return { data: photographer }
  } catch (error) {
    console.error('Error in getPhotographerById:', error)
    return { error: 'Failed to fetch photographer' }
  }
}

export async function getPersonalityTypes() {
  try {
    const supabase = await createClient()
    
    const { data: personalityTypes, error } = await supabase
      .from('personality_types')
      .select('code, name, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching personality types:', error.message)
      return { error: error.message }
    }
    
    return { data: personalityTypes || [] }
  } catch (error) {
    console.error('Error in getPersonalityTypes:', error)
    return { error: 'Failed to fetch personality types' }
  }
}