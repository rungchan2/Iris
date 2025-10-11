'use server'

import { createClient } from '@/lib/supabase/server'
import type { PhotographerProfile, PhotographerDB } from '@/types'

type Photographer = PhotographerDB

export interface PhotographerProfileFull {
  photographer: Photographer
  profile: PhotographerProfile
}

export interface BasicProfileUpdateData {
  // Basic info
  name?: string
  bio?: string

  // Style fields
  personality_type?: string
  directing_style?: string
  photography_approach?: string
  youtube_intro_url?: string

  // Contact info
  phone?: string
  website_url?: string
  instagram_handle?: string

  // Personal info
  gender?: string
  birth_year?: number
  age_range?: string
  years_experience?: number

  // Professional info
  specialties?: string[]
  studio_location?: string
  equipment_info?: string

  // Pricing
  price_range_min?: number
  price_range_max?: number
  price_description?: string

  // Profile-specific fields
  service_regions?: string[]
  price_min?: number
  price_max?: number
  companion_types?: string[]
}

export interface FourDimensionProfileUpdateData {
  style_emotion_description?: string
  communication_psychology_description?: string
  purpose_story_description?: string
  companion_description?: string
}

/**
 * Get full photographer profile with all 4D dimensions
 */
export async function getPhotographerProfileFull(
  photographerId: string
): Promise<{ data: PhotographerProfileFull | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    // Get photographer
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select('*')
      .eq('id', photographerId)
      .single()

    if (photographerError) throw photographerError
    if (!photographer) throw new Error('Photographer not found')

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('photographer_profiles')
      .select('*')
      .eq('photographer_id', photographerId)
      .single()

    if (profileError) throw profileError
    if (!profile) throw new Error('Photographer profile not found')

    return {
      data: {
        photographer,
        profile
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching photographer profile:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Update basic profile information (all photographer fields)
 */
export async function updateBasicProfile(
  photographerId: string,
  data: BasicProfileUpdateData
): Promise<{ data: PhotographerProfile | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    // Build photographer update object
    const photographerUpdate: Partial<Photographer> = {}
    if (data.name !== undefined) photographerUpdate.name = data.name
    if (data.bio !== undefined) photographerUpdate.bio = data.bio
    if (data.personality_type !== undefined) photographerUpdate.personality_type = data.personality_type
    if (data.directing_style !== undefined) photographerUpdate.directing_style = data.directing_style
    if (data.photography_approach !== undefined) photographerUpdate.photography_approach = data.photography_approach
    if (data.youtube_intro_url !== undefined) photographerUpdate.youtube_intro_url = data.youtube_intro_url
    if (data.phone !== undefined) photographerUpdate.phone = data.phone
    if (data.website_url !== undefined) photographerUpdate.website_url = data.website_url
    if (data.instagram_handle !== undefined) photographerUpdate.instagram_handle = data.instagram_handle
    if (data.gender !== undefined) photographerUpdate.gender = data.gender
    if (data.birth_year !== undefined) photographerUpdate.birth_year = data.birth_year
    if (data.age_range !== undefined) photographerUpdate.age_range = data.age_range
    if (data.years_experience !== undefined) photographerUpdate.years_experience = data.years_experience
    if (data.specialties !== undefined) photographerUpdate.specialties = data.specialties
    if (data.studio_location !== undefined) photographerUpdate.studio_location = data.studio_location
    if (data.equipment_info !== undefined) photographerUpdate.equipment_info = data.equipment_info
    if (data.price_range_min !== undefined) photographerUpdate.price_range_min = data.price_range_min
    if (data.price_range_max !== undefined) photographerUpdate.price_range_max = data.price_range_max
    if (data.price_description !== undefined) photographerUpdate.price_description = data.price_description

    // Update photographer table if there are fields to update
    if (Object.keys(photographerUpdate).length > 0) {
      photographerUpdate.updated_at = new Date().toISOString()

      const { error: photographerError } = await supabase
        .from('photographers')
        .update(photographerUpdate)
        .eq('id', photographerId)

      if (photographerError) throw photographerError
    }

    // Update profile fields
    const profileUpdate: Partial<PhotographerProfile> = {}
    if (data.service_regions !== undefined) profileUpdate.service_regions = data.service_regions
    if (data.price_min !== undefined) profileUpdate.price_min = data.price_min
    if (data.price_max !== undefined) profileUpdate.price_max = data.price_max
    if (data.companion_types !== undefined) profileUpdate.companion_types = data.companion_types

    // Only update profile if there are fields to update
    if (Object.keys(profileUpdate).length > 0) {
      const { data: updatedProfile, error: profileError } = await supabase
        .from('photographer_profiles')
        .update(profileUpdate)
        .eq('photographer_id', photographerId)
        .select()
        .single()

      if (profileError) throw profileError
      return { data: updatedProfile, error: null }
    }

    // If only photographer fields were updated, fetch and return profile
    const { data: profile, error: profileError } = await supabase
      .from('photographer_profiles')
      .select('*')
      .eq('photographer_id', photographerId)
      .single()

    if (profileError) throw profileError
    return { data: profile, error: null }
  } catch (error) {
    console.error('Error updating basic profile:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Update 4D profile descriptions (triggers embedding queue)
 */
export async function update4DProfile(
  photographerId: string,
  data: FourDimensionProfileUpdateData
): Promise<{ data: PhotographerProfile | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    // Update 4D descriptions
    const profileUpdate: Partial<PhotographerProfile> = {}
    if (data.style_emotion_description !== undefined) {
      profileUpdate.style_emotion_description = data.style_emotion_description
    }
    if (data.communication_psychology_description !== undefined) {
      profileUpdate.communication_psychology_description = data.communication_psychology_description
    }
    if (data.purpose_story_description !== undefined) {
      profileUpdate.purpose_story_description = data.purpose_story_description
    }
    if (data.companion_description !== undefined) {
      profileUpdate.companion_description = data.companion_description
    }

    const { data: updatedProfile, error: profileError } = await supabase
      .from('photographer_profiles')
      .update(profileUpdate)
      .eq('photographer_id', photographerId)
      .select()
      .single()

    if (profileError) throw profileError

    // Queue embedding generation for updated dimensions
    // Note: This should trigger a database function or background job
    // For now, we just update the descriptions and let the embedding job queue handle it
    const descriptionsToEmbed = []
    if (data.style_emotion_description) {
      descriptionsToEmbed.push({
        dimension: 'style_emotion',
        text: data.style_emotion_description
      })
    }
    if (data.communication_psychology_description) {
      descriptionsToEmbed.push({
        dimension: 'communication_psychology',
        text: data.communication_psychology_description
      })
    }
    if (data.purpose_story_description) {
      descriptionsToEmbed.push({
        dimension: 'purpose_story',
        text: data.purpose_story_description
      })
    }
    if (data.companion_description) {
      descriptionsToEmbed.push({
        dimension: 'companion',
        text: data.companion_description
      })
    }

    // TODO: Queue embedding jobs for each dimension
    // This would typically insert into an embedding_jobs table
    if (descriptionsToEmbed.length > 0) {
      for (const item of descriptionsToEmbed) {
        await supabase
          .from('embedding_jobs')
          .insert({
            job_type: `photographer_profile_${item.dimension}`,
            target_id: photographerId
          })
      }
    }

    return { data: updatedProfile, error: null }
  } catch (error) {
    console.error('Error updating 4D profile:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Upload and set profile image
 */
export async function uploadProfileImage(
  file: File,
  photographerId: string
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${photographerId}-${Date.now()}.${fileExt}`
    const filePath = `profile-images/${fileName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('photographer-profiles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('photographer-profiles')
      .getPublicUrl(filePath)

    // Update photographer record
    const { error: updateError } = await supabase
      .from('photographers')
      .update({ profile_image_url: publicUrl })
      .eq('id', photographerId)

    if (updateError) throw updateError

    return { data: publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading profile image:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Delete profile image
 */
export async function deleteProfileImage(
  photographerId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()

    // Get current image URL
    const { data: photographer, error: fetchError } = await supabase
      .from('photographers')
      .select('profile_image_url')
      .eq('id', photographerId)
      .single()

    if (fetchError) throw fetchError
    if (!photographer?.profile_image_url) {
      return { error: null } // Nothing to delete
    }

    // Extract file path from URL
    const url = new URL(photographer.profile_image_url)
    const filePath = url.pathname.split('/photographer-profiles/')[1]

    if (filePath) {
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('photographer-profiles')
        .remove([`profile-images/${filePath}`])

      if (deleteError) console.error('Storage delete error:', deleteError)
    }

    // Update photographer record
    const { error: updateError } = await supabase
      .from('photographers')
      .update({ profile_image_url: null })
      .eq('id', photographerId)

    if (updateError) throw updateError

    return { error: null }
  } catch (error) {
    console.error('Error deleting profile image:', error)
    return {
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Update profile image URL directly (for manual URL input)
 */
export async function updateProfileImageUrl(
  photographerId: string,
  imageUrl: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()

    const { error: updateError } = await supabase
      .from('photographers')
      .update({
        profile_image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', photographerId)

    if (updateError) throw updateError

    return { error: null }
  } catch (error) {
    console.error('Error updating profile image URL:', error)
    return {
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}
