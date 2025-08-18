'use server'

import { createClient } from '@/lib/supabase/server'
import { Json } from '@/types/database.types'
import OpenAI from 'openai'

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 성격유형별 프롬프트 매핑 (상세한 구도와 색감 포함)
const PERSONALITY_PROMPTS = {
  'A1': {
    style: '고요하고 자연스러운 분위기',
    composition: '부드러운 자연광 조명, 약간 측면에서 들어오는 빛, 1/3 법칙을 활용한 구도, 차분한 배경',
    colors: '따뜻한 베이지, 소프트 그레이, 연한 브라운 톤, 채도가 낮은 자연색',
    mood: '내성적이고 관찰적인 매력, 평온함과 사색적인 분위기'
  },
  'A2': {
    style: '따뜻하고 친근한 느낌',
    composition: '정면 또는 약간 대각선 각도, 자연스러운 미소 강조, 아이레벨 촬영',
    colors: '따뜻한 오렌지, 골든 아워 톤, 크림색, 부드러운 옐로우',
    mood: '친근하고 다가가기 쉬운 분위기, 따뜻함과 편안함'
  },
  'B1': {
    style: '감성적이고 로맨틱한 무드',
    composition: '부드러운 보케 효과, 꿈같은 분위기의 백라이팅, 로우앵글 또는 하이앵글',
    colors: '파스텔 핑크, 라벤더, 소프트 퍼플, 로즈골드 톤',
    mood: '감성적이고 세심한 감정 표현, 로맨틱하고 몽환적'
  },
  'C1': {
    style: '영화 같은 드라마틱한 분위기',
    composition: '시네마스코프 비율, 강한 명암 대비, 드라마틱한 조명, 깊이감 있는 구도',
    colors: '깊은 블루, 앰버 라이팅, 리치 골드, 시네마틱 그레이딩',
    mood: '몽상가의 꿈꾸는 듯한 느낌, 영화적 서사성'
  },
  'D1': {
    style: '활기차고 역동적인 느낌',
    composition: '역동적인 포즈와 각도, 밝고 균등한 조명, 에너지를 표현하는 구성',
    colors: '비비드한 블루, 에너지틱 오렌지, 브라이트 화이트, 생동감 있는 원색',
    mood: '자신감 넘치고 리더십 있는 에너지, 활력과 추진력'
  },
  'E1': {
    style: '모던하고 세련된 도시적 분위기',
    composition: '깔끔한 라인과 미니멀한 구성, 도시적 배경, 세련된 포즈',
    colors: '모던 그레이, 쿨 톤 블루, 미니멀 화이트, 도시적 네이비',
    mood: '트렌디하고 세련된 감각, 도시적 세련미'
  },
  'E2': {
    style: '미니멀하고 아티스틱한 느낌',
    composition: '독특한 프레이밍, 네거티브 스페이스 활용, 아트적인 구도',
    colors: '모노크롬 베이스, 절제된 컬러 포인트, 블랙&화이트, 미니멀 톤',
    mood: '무심하지만 깊이 있는 예술적 매력, 독창성'
  },
  'F1': {
    style: '자유롭고 모험적인 분위기',
    composition: '자연스럽고 캐주얼한 포즈, 아웃도어 느낌, 자유로운 구성',
    colors: '자연의 그린, 어드벤처 브라운, 스카이 블루, 어스 톤',
    mood: '자유로운 탐험가 정신, 모험심과 개방성'
  },
  'F2': {
    style: '감각적이고 실험적인 느낌',
    composition: '창의적이고 실험적인 앵글, 독특한 라이팅, 감각적인 구도',
    colors: '실험적 컬러 조합, 네온 액센트, 대담한 컬러 블록, 아방가르드 톤',
    mood: '감각적이고 실험적인 매력, 창의성과 독창성'
  }
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
 * 사용자 이미지를 업로드하고 성격유형에 맞는 AI 이미지 생성 (스트리밍 지원)
 */
export async function generatePersonalityImage(
  sessionId: string | null,
  personalityCode: keyof typeof PERSONALITY_PROMPTS,
  userImageFile: File,
  additionalPrompt?: string
): Promise<{ success: boolean; generation?: AIImageGeneration; error?: string }> {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    
    // 성격유형 프롬프트 가져오기
    const personalityData = PERSONALITY_PROMPTS[personalityCode]
    if (!personalityData) {
      return { success: false, error: '유효하지 않은 성격유형입니다' }
    }

    // 파일을 Buffer로 변환 (서버 환경에서 안전)
    const arrayBuffer = await userImageFile.arrayBuffer()
    const userImageBuffer = Buffer.from(arrayBuffer)
    const userImageBase64 = userImageBuffer.toString('base64')
    
    // 상세한 프롬프트 구성
    const detailedPrompt = `Create a professional portrait photo with the following specifications:

STYLE: ${personalityData.style}
COMPOSITION: ${personalityData.composition}
COLORS: ${personalityData.colors}
MOOD: ${personalityData.mood}

Create a snapshot that captures the essence of personality type ${personalityCode}. Focus on professional photography techniques with attention to lighting, composition, and color grading. The final result should be a high-quality portrait that embodies the personality characteristics.

${additionalPrompt ? `Additional requirements: ${additionalPrompt}` : ''}

Please maintain photorealistic quality with professional studio lighting and post-processing effects.`
    
    // 데이터베이스에 생성 기록 생성
    const { data: generation, error: dbError } = await supabase
      .from('ai_image_generations')
      .insert({
        quiz_session_id: sessionId,
        personality_code: personalityCode,
        user_uploaded_image_url: `data:${userImageFile.type};base64,${userImageBase64}`,
        generated_prompt: detailedPrompt,
        api_provider: 'openai_dalle',
        generation_status: 'processing'
      })
      .select()
      .single()
    
    if (dbError) {
      return { success: false, error: `데이터베이스 오류: ${dbError.message}` }
    }

    // 진행상황 업데이트: 프롬프트 처리 시작
    await updateGenerationProgress(generation.id, 10, 'processing', '프롬프트 분석 중...')
    
    // OpenAI DALL-E 3로 이미지 생성
    await updateGenerationProgress(generation.id, 30, 'processing', 'AI 이미지 생성 시작...')
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: detailedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural",
      response_format: "b64_json"
    })
    
    // 진행상황 업데이트: 이미지 생성 완료
    await updateGenerationProgress(generation.id, 70, 'processing', '이미지 생성 완료, 후처리 중...')
    
    // 생성된 이미지 추출
    if (!response.data || response.data.length === 0) {
      throw new Error('이미지 생성에 실패했습니다')
    }
    
    const generatedImageBase64 = response.data[0].b64_json
    const revisedPrompt = response.data[0].revised_prompt || detailedPrompt
    const processingTime = Math.round((Date.now() - startTime) / 1000)
    
    if (!generatedImageBase64) {
      throw new Error('이미지 데이터를 받지 못했습니다')
    }
    
    // 진행상황 업데이트: 이미지 업로드 시작
    await updateGenerationProgress(generation.id, 85, 'processing', '이미지 저장 중...')
    
    // Supabase Storage에 이미지 업로드
    const fileName = `ai-generated/${generation.id}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, Buffer.from(generatedImageBase64, 'base64'), {
        contentType: 'image/png',
        cacheControl: '3600'
      })
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // 업로드 실패해도 Base64로 계속 진행
    }
    
    const generatedImageUrl = uploadData 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${fileName}`
      : `data:image/png;base64,${generatedImageBase64}`
    
    // 진행상황 업데이트: 최종 완료 준비
    await updateGenerationProgress(generation.id, 95, 'processing', '마무리 작업 중...')
    
    // 데이터베이스 업데이트
    const { data: updatedGeneration, error: updateError } = await supabase
      .from('ai_image_generations')
      .update({
        generated_image_url: generatedImageUrl,
        generation_status: 'completed',
        processing_time_seconds: processingTime,
        api_request_payload: {
          model: "dall-e-3",
          prompt: detailedPrompt,
          size: "1024x1024",
          quality: "hd",
          style: "natural"
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
        api_provider: 'openai_dalle',
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
      .from('photos')
      .upload(fileName, Buffer.from(generatedImageBase64, 'base64'), {
        contentType: 'image/png',
        cacheControl: '3600'
      })
    
    const generatedImageUrl = uploadData 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${fileName}`
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
 * 파일을 Base64로 변환하는 유틸리티 (서버 환경용)
 */
export async function fileToBase64Server(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return buffer.toString('base64')
}

/**
 * 스트리밍을 통한 AI 이미지 생성 상태 업데이트
 */
export async function updateGenerationProgress(
  generationId: string,
  progress: number,
  status: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const updateData: any = {
      generation_status: status,
      updated_at: new Date().toISOString()
    }
    
    if (message) {
      updateData.api_response_data = {
        progress,
        message,
        timestamp: new Date().toISOString()
      }
    }
    
    const { error } = await supabase
      .from('ai_image_generations')
      .update(updateData)
      .eq('id', generationId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    console.error('Error updating generation progress:', error)
    return { success: false, error: 'Failed to update progress' }
  }
}

/**
 * 실시간 생성 상태 조회 (폴링용)
 */
export async function pollGenerationStatus(
  generationId: string
): Promise<{ success: boolean; status?: string; progress?: number; imageUrl?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('ai_image_generations')
      .select('generation_status, generated_image_url, api_response_data')
      .eq('id', generationId)
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    const responseData = data.api_response_data as any
    
    return { 
      success: true, 
      status: data.generation_status,
      progress: responseData?.progress || 0,
      imageUrl: data.generated_image_url || undefined
    }
  } catch (error: any) {
    console.error('Error polling generation status:', error)
    return { success: false, error: 'Failed to poll status' }
  }
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
  bucket: string = 'photos'
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