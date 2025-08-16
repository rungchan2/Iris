'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Json } from '@/types/database.type'
import OpenAI from 'openai'

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 성격유형별 프롬프트 매핑
const PERSONALITY_PROMPTS = {
  'A1': '고요하고 자연스러운 분위기로 편집해주세요. 부드러운 조명과 차분한 색조를 사용하여 관찰자의 내성적인 매력을 부각시켜주세요.',
  'A2': '따뜻하고 친근한 느낌으로 편집해주세요. 밝은 표정과 자연스러운 포즈를 강조하여 동행자의 따뜻함을 표현해주세요.',
  'B1': '감성적이고 로맨틱한 무드로 편집해주세요. 따뜻한 필터와 부드러운 톤을 적용하여 감정 기록자의 세심함을 드러내주세요.',
  'C1': '영화 같은 드라마틱한 분위기로 편집해주세요. 시네마틱한 조명과 구도를 사용하여 몽상가의 꿈꾸는 듯한 느낌을 연출해주세요.',
  'D1': '활기차고 역동적인 느낌으로 편집해주세요. 밝고 생동감 있는 색상과 자신감 넘치는 포즈로 리더의 에너지를 표현해주세요.',
  'E1': '모던하고 세련된 도시적 분위기로 편집해주세요. 깔끔한 스타일과 트렌디한 배경으로 도시 드리머의 감각을 보여주세요.',
  'E2': '미니멀하고 아티스틱한 느낌으로 편집해주세요. 절제된 색감과 독특한 구도로 예술가의 무심한 매력을 연출해주세요.',
  'F1': '자유롭고 모험적인 분위기로 편집해주세요. 자연스럽고 생동감 있는 배경과 역동적인 포즈로 탐험가의 자유로움을 표현해주세요.',
  'F2': '감각적이고 실험적인 느낌으로 편집해주세요. 독창적인 색감과 창의적인 구성으로 실험가의 감각적 매력을 부각시켜주세요.'
} as const

export interface AIImageGeneration {
  id: string
  quiz_session_id: string | null
  personality_code: string
  user_uploaded_image_url: string
  generated_prompt: string
  api_provider: string
  api_request_payload: Json | null
  api_response_data: Json | null
  generated_image_url: string | null
  generation_status: string
  error_message: string | null
  processing_time_seconds: number | null
  user_rating: number | null
  is_shared: boolean | null
  created_at: string | null
  updated_at: string | null
}

/**
 * 사용자 이미지를 업로드하고 성격유형에 맞는 AI 이미지 생성
 */
export async function generatePersonalityImage(
  sessionId: string | null,
  personalityCode: keyof typeof PERSONALITY_PROMPTS,
  userImageBase64: string,
  additionalPrompt?: string
): Promise<{ success: boolean; generation?: AIImageGeneration; error?: string }> {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    
    // 성격유형 프롬프트 가져오기
    const personalityPrompt = PERSONALITY_PROMPTS[personalityCode]
    if (!personalityPrompt) {
      return { success: false, error: '유효하지 않은 성격유형입니다' }
    }
    
    // 데이터베이스에 생성 기록 생성
    const { data: generation, error: dbError } = await supabase
      .from('ai_image_generations')
      .insert({
        quiz_session_id: sessionId,
        personality_code: personalityCode,
        user_uploaded_image_url: `data:image/jpeg;base64,${userImageBase64}`,
        generated_prompt: `${personalityPrompt} ${additionalPrompt || ''}`.trim(),
        api_provider: 'openai_gpt_image_1',
        generation_status: 'processing'
      })
      .select()
      .single()
    
    if (dbError) {
      return { success: false, error: `데이터베이스 오류: ${dbError.message}` }
    }
    
    // OpenAI DALL-E API로 이미지 생성 (임시로 text-only 프롬프트 사용)
    const combinedPrompt = `Based on this personality type ${personalityCode}, ${personalityPrompt} ${additionalPrompt || ''}`.trim()
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: combinedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "b64_json"
    })
    
    // 생성된 이미지 추출
    if (!response.data || response.data.length === 0) {
      throw new Error('이미지 생성에 실패했습니다')
    }
    
    const generatedImageBase64 = response.data[0].b64_json
    const revisedPrompt = response.data[0].revised_prompt || combinedPrompt
    const processingTime = Math.round((Date.now() - startTime) / 1000)
    
    if (!generatedImageBase64) {
      throw new Error('이미지 데이터를 받지 못했습니다')
    }
    
    // Supabase Storage에 이미지 업로드
    const fileName = `ai-generated/${generation.id}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, Buffer.from(generatedImageBase64, 'base64'), {
        contentType: 'image/png',
        cacheControl: '3600'
      })
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // 업로드 실패해도 Base64로 계속 진행
    }
    
    const generatedImageUrl = uploadData 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${fileName}`
      : `data:image/png;base64,${generatedImageBase64}`
    
    // 데이터베이스 업데이트
    const { data: updatedGeneration, error: updateError } = await supabase
      .from('ai_image_generations')
      .update({
        generated_image_url: generatedImageUrl,
        generation_status: 'completed',
        processing_time_seconds: processingTime,
        api_request_payload: {
          model: "dall-e-3",
          prompt: combinedPrompt,
          size: "1024x1024",
          quality: "hd"
        },
        api_response_data: {
          revised_prompt: revisedPrompt,
          processing_time: processingTime
        }
      })
      .eq('id', generation.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Database update error:', updateError)
      return { success: false, error: '결과 저장 중 오류가 발생했습니다' }
    }
    
    return { success: true, generation: updatedGeneration }
    
  } catch (error: any) {
    console.error('AI image generation error:', error)
    
    // 에러 상태로 데이터베이스 업데이트
    try {
      const supabase = await createClient()
      const updateQuery = supabase
        .from('ai_image_generations')
        .update({
          generation_status: 'failed',
          error_message: error.message || '알 수 없는 오류',
          processing_time_seconds: Math.round((Date.now() - startTime) / 1000)
        })
        .eq('generation_status', 'processing')
      
      if (sessionId) {
        updateQuery.eq('quiz_session_id', sessionId)
      }
      
      await updateQuery
    } catch (dbError) {
      console.error('Error updating failed status:', dbError)
    }
    
    return { 
      success: false, 
      error: error.message || 'AI 이미지 생성 중 오류가 발생했습니다' 
    }
  }
}

/**
 * 기존 생성된 이미지를 기반으로 반복 편집
 */
export async function editGeneratedImage(
  originalGenerationId: string,
  editPrompt: string
): Promise<{ success: boolean; generation?: AIImageGeneration; error?: string }> {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    
    // 원본 생성 기록 조회
    const { data: originalGeneration, error: fetchError } = await supabase
      .from('ai_image_generations')
      .select('*')
      .eq('id', originalGenerationId)
      .single()
    
    if (fetchError || !originalGeneration) {
      return { success: false, error: '원본 이미지를 찾을 수 없습니다' }
    }
    
    // 새로운 편집 기록 생성
    const { data: newGeneration, error: dbError } = await supabase
      .from('ai_image_generations')
      .insert({
        quiz_session_id: originalGeneration.quiz_session_id,
        personality_code: originalGeneration.personality_code,
        user_uploaded_image_url: originalGeneration.user_uploaded_image_url,
        generated_prompt: `${originalGeneration.generated_prompt} ${editPrompt}`.trim(),
        api_provider: 'openai_gpt_image_1',
        generation_status: 'processing'
      })
      .select()
      .single()
    
    if (dbError) {
      return { success: false, error: `데이터베이스 오류: ${dbError.message}` }
    }
    
    // OpenAI DALL-E API로 이미지 편집 (새로운 프롬프트로 재생성)
    const editedPrompt = `${originalGeneration.generated_prompt} ${editPrompt}`.trim()
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: editedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "b64_json"
    })
    
    // 생성된 이미지 추출
    if (!response.data || response.data.length === 0) {
      throw new Error('이미지 편집에 실패했습니다')
    }
    
    const generatedImageBase64 = response.data[0].b64_json
    const revisedPrompt = response.data[0].revised_prompt || editedPrompt
    const processingTime = Math.round((Date.now() - startTime) / 1000)
    
    if (!generatedImageBase64) {
      throw new Error('이미지 데이터를 받지 못했습니다')
    }
    
    // Supabase Storage에 이미지 업로드
    const fileName = `ai-generated/${newGeneration.id}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, Buffer.from(generatedImageBase64, 'base64'), {
        contentType: 'image/png',
        cacheControl: '3600'
      })
    
    const generatedImageUrl = uploadData 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${fileName}`
      : `data:image/png;base64,${generatedImageBase64}`
    
    // 데이터베이스 업데이트
    const { data: updatedGeneration, error: updateError } = await supabase
      .from('ai_image_generations')
      .update({
        generated_image_url: generatedImageUrl,
        generation_status: 'completed',
        processing_time_seconds: processingTime,
        api_request_payload: {
          model: "dall-e-3",
          prompt: editedPrompt,
          edit_prompt: editPrompt,
          size: "1024x1024",
          quality: "hd"
        },
        api_response_data: {
          revised_prompt: revisedPrompt,
          processing_time: processingTime
        }
      })
      .eq('id', newGeneration.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Database update error:', updateError)
      return { success: false, error: '결과 저장 중 오류가 발생했습니다' }
    }
    
    return { success: true, generation: updatedGeneration }
    
  } catch (error: any) {
    console.error('AI image edit error:', error)
    return { 
      success: false, 
      error: error.message || 'AI 이미지 편집 중 오류가 발생했습니다' 
    }
  }
}

/**
 * 파일을 Base64로 변환하는 유틸리티
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // data:image/jpeg;base64, 부분을 제거하고 Base64 문자열만 반환
      resolve(result.split(',')[1])
    }
    reader.onerror = error => reject(error)
  })
}

/**
 * Get AI generation status
 */
export async function getAIGenerationStatus(
  generationId: string
): Promise<{ success: boolean; generation?: AIImageGeneration; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('ai_image_generations')
      .select('*')
      .eq('id', generationId)
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, generation: data }
  } catch (error) {
    console.error('Error fetching AI generation status:', error)
    return { success: false, error: 'Failed to fetch generation status' }
  }
}

/**
 * Rate AI generation result
 */
export async function rateAIGeneration(
  generationId: string,
  rating: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' }
    }
    
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('ai_image_generations')
      .update({
        user_rating: rating,
        updated_at: new Date().toISOString()
      })
      .eq('id', generationId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error rating AI generation:', error)
    return { success: false, error: 'Failed to rate generation' }
  }
}

/**
 * Mark AI generation as shared
 */
export async function markAIGenerationShared(
  generationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('ai_image_generations')
      .update({
        is_shared: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', generationId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error marking generation as shared:', error)
    return { success: false, error: 'Failed to mark as shared' }
  }
}

/**
 * Get AI generations for a session
 */
export async function getSessionAIGenerations(
  sessionId: string
): Promise<{ success: boolean; generations?: AIImageGeneration[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('ai_image_generations')
      .select('*')
      .eq('quiz_session_id', sessionId)
      .order('created_at', { ascending: false })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, generations: data }
  } catch (error) {
    console.error('Error fetching session AI generations:', error)
    return { success: false, error: 'Failed to fetch generations' }
  }
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImageToStorage(
  file: File,
  bucket: string = 'user-uploads'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `ai-generations/${fileName}`
    
    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { success: false, error: uploadError.message }
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    if (!publicUrlData.publicUrl) {
      return { success: false, error: 'Failed to get public URL' }
    }
    
    return { success: true, url: publicUrlData.publicUrl }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

/**
 * Get AI generation statistics (for admin)
 */
export async function getAIGenerationStats(): Promise<{
  success: boolean
  stats?: {
    total_generations: number
    completed_generations: number
    failed_generations: number
    average_rating: number
    average_processing_time: number
  }
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('ai_image_generations')
      .select('generation_status, user_rating, processing_time_seconds')
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    const stats = {
      total_generations: data.length,
      completed_generations: data.filter(g => g.generation_status === 'completed').length,
      failed_generations: data.filter(g => g.generation_status === 'failed').length,
      average_rating: data
        .filter(g => g.user_rating !== null)
        .reduce((sum, g) => sum + (g.user_rating || 0), 0) / 
        data.filter(g => g.user_rating !== null).length || 0,
      average_processing_time: data
        .filter(g => g.processing_time_seconds !== null)
        .reduce((sum, g) => sum + (g.processing_time_seconds || 0), 0) / 
        data.filter(g => g.processing_time_seconds !== null).length || 0
    }
    
    return { success: true, stats }
  } catch (error) {
    console.error('Error fetching AI generation stats:', error)
    return { success: false, error: 'Failed to fetch stats' }
  }
}