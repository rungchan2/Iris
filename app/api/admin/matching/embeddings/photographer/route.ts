import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { photographerId } = await request.json()
    
    if (!photographerId) {
      return NextResponse.json(
        { error: 'Photographer ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Get photographer profile
    const { data: profile, error: profileError } = await supabase
      .from('photographer_profiles')
      .select(`
        style_emotion_description,
        communication_psychology_description,
        purpose_story_description,
        companion_description,
        profile_completed
      `)
      .eq('photographer_id', photographerId)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Photographer profile not found' },
        { status: 404 }
      )
    }

    if (!profile.profile_completed) {
      return NextResponse.json(
        { error: '4차원 프로필이 완성되지 않았습니다' },
        { status: 400 }
      )
    }
    
    // Generate embeddings for each dimension
    const dimensions = [
      { field: 'style_emotion_description', column: 'style_emotion_embedding' },
      { field: 'communication_psychology_description', column: 'communication_psychology_embedding' },
      { field: 'purpose_story_description', column: 'purpose_story_embedding' },
      { field: 'companion_description', column: 'companion_embedding' }
    ]
    
    let generated = 0
    const embeddings: Record<string, number[]> = {}
    
    for (const dim of dimensions) {
      const text = profile[dim.field as keyof typeof profile]
      if (text && typeof text === 'string' && text.trim()) {
        try {
          const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
            encoding_format: 'float'
          })
          
          embeddings[dim.column] = response.data[0].embedding
          generated++
        } catch (embeddingError) {
          console.error(`Error generating embedding for ${dim.field}:`, embeddingError)
        }
      }
    }
    
    if (generated === 0) {
      return NextResponse.json(
        { error: '생성할 수 있는 임베딩이 없습니다' },
        { status: 400 }
      )
    }
    
    // Update photographer profile with embeddings
    const updateData = {
      ...embeddings,
      embeddings_generated_at: new Date().toISOString()
    }
    
    const { error: updateError } = await supabase
      .from('photographer_profiles')
      .update(updateData)
      .eq('photographer_id', photographerId)
    
    if (updateError) {
      console.error('Error updating photographer profile:', updateError)
      return NextResponse.json(
        { error: '임베딩 저장에 실패했습니다' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      generated,
      message: `${generated}개의 4차원 임베딩이 생성되었습니다`
    })
    
  } catch (error) {
    console.error('Photographer embedding generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}