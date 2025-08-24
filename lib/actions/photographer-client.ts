'use client'

import { createClient } from '@/lib/supabase/client'

export interface PhotographerApplicationData {
  email: string
  name: string
  phone: string
  gender?: 'male' | 'female' | 'other'
  ageRange?: string
  instagramHandle?: string
  websiteUrl?: string
  yearsExperience: number
  specialties: string[]
  studioLocation: string
  equipmentInfo?: string
  bio: string
  priceRangeMin?: number
  priceRangeMax?: number
  priceDescription?: string
}

/**
 * 세션이 완전히 설정될 때까지 기다리는 함수
 */
async function waitForSession(maxRetries = 10, delay = 500): Promise<boolean> {
  const supabase = createClient()
  
  for (let i = 0; i < maxRetries; i++) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      console.log(`Session found after ${i + 1} attempts`)
      return true
    }
    
    console.log(`Waiting for session, attempt ${i + 1}/${maxRetries}`)
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  console.error('Session not found after maximum retries')
  return false
}

/**
 * 작가 프로필 정보 생성 (클라이언트 사이드에서 실행)
 */
export async function createPhotographerProfile(
  data: PhotographerApplicationData & { userId: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // 세션이 완전히 설정될 때까지 기다림
    const sessionReady = await waitForSession()
    if (!sessionReady) {
      return { success: false, error: '세션 설정 대기 시간 초과' }
    }

    // 현재 세션 다시 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user || session.user.id !== data.userId) {
      return { success: false, error: '사용자 인증 실패' }
    }

    console.log('Creating photographer profile for user:', data.userId)

    // photographers 테이블에 작가 정보 생성
    const { error: userError } = await supabase
      .from('photographers')
      .insert({
        id: data.userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        age_range: data.ageRange,
        instagram_handle: data.instagramHandle,
        website_url: data.websiteUrl,
        years_experience: data.yearsExperience,
        specialties: data.specialties,
        studio_location: data.studioLocation,
        equipment_info: data.equipmentInfo,
        bio: data.bio,
        price_range_min: data.priceRangeMin,
        price_range_max: data.priceRangeMax,
        price_description: data.priceDescription,
        approval_status: 'pending',
        portfolio_submitted_at: new Date().toISOString(),
        profile_completed: true,
      })

    if (userError) {
      console.error('Error creating photographer profile:', userError)
      return { success: false, error: `작가 프로필 생성 실패: ${userError.message}` }
    }

    console.log('Photographer profile created successfully')
    return { success: true }

  } catch (error: any) {
    console.error('Photographer profile creation error:', error)
    return { 
      success: false, 
      error: error.message || '작가 프로필 생성 중 오류가 발생했습니다.' 
    }
  }
}

/**
 * 포트폴리오 이미지 업로드 (기존 PhotoUploader 컴포넌트 재사용을 위한 래퍼)
 */
export async function uploadPortfolioImages(
  portfolioFiles: File[],
  portfolioDescriptions?: string[]
): Promise<{ success: boolean; error?: string; uploadedCount?: number }> {
  try {
    const supabase = createClient()
    
    // 현재 로그인한 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: '사용자 인증 실패. 로그인이 필요합니다.' }
    }

    console.log('Starting portfolio upload for user:', user.id)

    // 기존 uploadMultiplePhotos 함수 사용
    const { uploadMultiplePhotos } = await import('@/lib/upload')
    
    const results = await uploadMultiplePhotos(portfolioFiles, user.id)
    
    // 성공/실패 개수 계산
    const successfulUploads = results.filter(result => result.success)
    const failedUploads = results.filter(result => !result.success)

    if (successfulUploads.length === 0) {
      return { 
        success: false, 
        error: '포트폴리오 이미지 업로드에 모두 실패했습니다. 다시 시도해주세요.' 
      }
    }

    if (failedUploads.length > 0) {
      console.warn(`${failedUploads.length}개의 포트폴리오 이미지 업로드 실패`)
    }

    console.log(`Portfolio upload completed: ${successfulUploads.length}/${portfolioFiles.length} successful`)

    return { 
      success: true, 
      uploadedCount: successfulUploads.length
    }

  } catch (error: any) {
    console.error('Portfolio upload error:', error)
    return { 
      success: false, 
      error: error.message || '포트폴리오 업로드 중 오류가 발생했습니다.' 
    }
  }
}