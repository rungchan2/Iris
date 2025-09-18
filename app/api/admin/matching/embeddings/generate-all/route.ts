import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    let created = 0
    
    // Get all active choices that need embeddings
    const { data: choices, error: choicesError } = await supabase
      .from('survey_choices')
      .select('id')
      .eq('is_active', true)
      .is('choice_embedding', null)
    
    if (choicesError) throw choicesError
    
    // Get all active images that need embeddings  
    const { data: images, error: imagesError } = await supabase
      .from('survey_images')
      .select('id')
      .eq('is_active', true)
      .is('image_embedding', null)
    
    if (imagesError) throw imagesError
    
    // Get all photographer profiles that need embeddings
    const { data: profiles, error: profilesError } = await supabase
      .from('photographer_profiles')
      .select('photographer_id')
      .eq('profile_completed', true)
      .is('embeddings_generated_at', null)
    
    if (profilesError) throw profilesError
    
    // Create jobs for choices
    for (const choice of choices || []) {
      const { error } = await supabase
        .from('embedding_jobs')
        .upsert({
          job_type: 'choice_embedding',
          target_id: choice.id,
          job_status: 'pending'
        }, {
          onConflict: 'job_type,target_id',
          ignoreDuplicates: false
        })
      
      if (!error) created++
    }
    
    // Create jobs for images
    for (const image of images || []) {
      const { error } = await supabase
        .from('embedding_jobs')
        .upsert({
          job_type: 'image_embedding',
          target_id: image.id,
          job_status: 'pending'
        }, {
          onConflict: 'job_type,target_id',
          ignoreDuplicates: false
        })
      
      if (!error) created++
    }
    
    // Create jobs for photographer profiles
    for (const profile of profiles || []) {
      const { error } = await supabase
        .from('embedding_jobs')
        .upsert({
          job_type: 'photographer_profile',
          target_id: profile.photographer_id,
          job_status: 'pending'
        }, {
          onConflict: 'job_type,target_id',
          ignoreDuplicates: false
        })
      
      if (!error) created++
    }
    
    return NextResponse.json({ 
      success: true,
      created,
      total: {
        choices: choices?.length || 0,
        images: images?.length || 0,
        profiles: profiles?.length || 0
      }
    })
    
  } catch (error) {
    console.error('Error generating all embedding jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}