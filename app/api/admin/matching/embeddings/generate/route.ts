import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { questionId, text, type } = await request.json()
    
    // Handle direct text embedding generation (for user sessions)
    if (text && type) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
          encoding_format: 'float'
        })
        
        const embedding = response.data[0].embedding
        
        return NextResponse.json({ 
          success: true, 
          embedding,
          type,
          message: 'Embedding generated successfully'
        })
      } catch (embeddingError) {
        console.error('Error generating embedding:', embeddingError)
        return NextResponse.json(
          { error: 'Failed to generate embedding' },
          { status: 500 }
        )
      }
    }
    
    // Handle question-based embedding generation (existing logic)
    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID or text is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Get question type to determine what to generate embeddings for
    const { data: question, error: questionError } = await supabase
      .from('survey_questions')
      .select('question_type')
      .eq('id', questionId)
      .single()
    
    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }
    
    let generated = 0
    
    if (question.question_type === 'image_choice') {
      // Generate embeddings for images
      const { data: images, error: imagesError } = await supabase
        .from('survey_images')
        .select('id, image_label')
        .eq('question_id', questionId)
        .eq('is_active', true)
      
      if (imagesError) throw imagesError
      
      for (const image of images || []) {
        try {
          // Generate embedding for image label
          const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: image.image_label,
            encoding_format: 'float'
          })
          
          const embedding = response.data[0].embedding
          
          // Update database with embedding
          const { error: updateError } = await supabase
            .from('survey_images')
            .update({
              image_embedding: JSON.stringify(embedding),
              embedding_generated_at: new Date().toISOString()
            })
            .eq('id', image.id)
          
          if (updateError) {
            console.error('Error updating image embedding:', updateError)
            continue
          }
          
          generated++
        } catch (embeddingError) {
          console.error('Error generating embedding for image:', embeddingError)
          continue
        }
      }
    } else if (question.question_type === 'single_choice') {
      // Generate embeddings for choices
      const { data: choices, error: choicesError } = await supabase
        .from('survey_choices')
        .select('id, choice_label')
        .eq('question_id', questionId)
        .eq('is_active', true)
      
      if (choicesError) throw choicesError
      
      for (const choice of choices || []) {
        try {
          // Generate embedding for choice label
          const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: choice.choice_label,
            encoding_format: 'float'
          })
          
          const embedding = response.data[0].embedding
          
          // Update database with embedding
          const { error: updateError } = await supabase
            .from('survey_choices')
            .update({
              choice_embedding: JSON.stringify(embedding),
              embedding_generated_at: new Date().toISOString()
            })
            .eq('id', choice.id)
          
          if (updateError) {
            console.error('Error updating choice embedding:', updateError)
            continue
          }
          
          generated++
        } catch (embeddingError) {
          console.error('Error generating embedding for choice:', embeddingError)
          continue
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      generated,
      message: `${generated}개의 임베딩이 생성되었습니다`
    })
    
  } catch (error) {
    console.error('Embedding generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}