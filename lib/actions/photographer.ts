'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
 * 작가 프로필 정보 생성 (회원가입 후 photographers 테이블에 정보 저장)
 */
export async function createPhotographerProfile(
  data: PhotographerApplicationData & { userId: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

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
 * 포트폴리오 이미지 업로드 (로그인 후 실행)
 */
export async function uploadPortfolioImages(
  portfolioFiles: File[],
  portfolioDescriptions?: string[]
): Promise<{ success: boolean; error?: string; uploadedCount?: number }> {
  try {
    const supabase = await createClient()
    
    // 현재 로그인한 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: '사용자 인증 실패. 로그인이 필요합니다.' }
    }

    const portfolioUploadResults = []
    
    for (let i = 0; i < portfolioFiles.length; i++) {
      const file = portfolioFiles[i]
      const description = portfolioDescriptions?.[i] || ''

      try {
        // 파일을 Buffer로 변환
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)
        
        // 고유한 파일명 생성
        const fileExt = file.name.split('.').pop() || 'jpg'
        const fileName = `portfolio/${user.id}/${Date.now()}_${i + 1}.${fileExt}`
        
        // Supabase Storage에 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            cacheControl: '3600'
          })

        if (uploadError) {
          console.error('Portfolio upload error:', uploadError)
          throw new Error(`포트폴리오 이미지 ${i + 1} 업로드 실패: ${uploadError.message}`)
        }

        // 공개 URL 생성
        const { data: publicUrlData } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName)

        if (!publicUrlData.publicUrl) {
          throw new Error(`포트폴리오 이미지 ${i + 1} URL 생성 실패`)
        }

        // 썸네일 URL 생성 (Supabase의 이미지 변환 기능 사용)
        const thumbnailUrl = `${publicUrlData.publicUrl}?width=400&height=400&resize=cover&quality=80`

        // photos 테이블에 레코드 생성
        const { data: photo, error: photoError } = await supabase
          .from('photos')
          .insert({
            uploaded_by: user.id,
            filename: `portfolio_${i + 1}_${Date.now()}.jpg`,
            storage_url: publicUrlData.publicUrl,
            thumbnail_url: thumbnailUrl,
            title: `Portfolio ${i + 1}`,
            description: description,
            is_public: false, // 승인 전까지는 비공개
            is_representative: i === 0,
            display_order: i + 1
          })
          .select()
          .single()

        if (photoError) {
          console.error('Photo record creation error:', photoError)
          throw new Error(`포트폴리오 레코드 생성 실패: ${photoError.message}`)
        }

        portfolioUploadResults.push({
          success: true,
          url: publicUrlData.publicUrl,
          photoId: photo.id
        })

      } catch (error: any) {
        console.error(`Portfolio upload ${i + 1} failed:`, error)
        portfolioUploadResults.push({
          success: false,
          error: error.message
        })
      }
    }

    // 업로드 결과 검증
    const successfulUploads = portfolioUploadResults.filter(result => result.success)
    const failedUploads = portfolioUploadResults.filter(result => !result.success)

    if (successfulUploads.length === 0) {
      return { 
        success: false, 
        error: '포트폴리오 이미지 업로드에 모두 실패했습니다. 다시 시도해주세요.' 
      }
    }

    if (failedUploads.length > 0) {
      console.warn(`${failedUploads.length}개의 포트폴리오 이미지 업로드 실패`)
    }

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

/**
 * 작가 지원서 승인
 */
export async function approvePhotographerApplication(
  applicationId: string,
  approverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // 작가 상태를 승인으로 변경
    const { error: approvalError } = await supabase
      .from('photographers')
      .update({
        application_status: 'approved',
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approverId,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)

    if (approvalError) {
      return { success: false, error: `승인 처리 실패: ${approvalError.message}` }
    }

    // 포트폴리오 사진들을 공개로 변경
    const { error: portfolioError } = await supabase
      .from('photos')
      .update({
        is_public: true,
        updated_at: new Date().toISOString()
      })
      .eq('photographer_id', applicationId)

    if (portfolioError) {
      console.warn('Portfolio public status update failed:', portfolioError)
    }

    revalidatePath('/admin')
    return { success: true }

  } catch (error: any) {
    console.error('Photographer approval error:', error)
    return { success: false, error: '승인 처리 중 오류가 발생했습니다.' }
  }
}

/**
 * 작가 지원서 거절
 */
export async function rejectPhotographerApplication(
  applicationId: string,
  reason: string,
  approverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('photographers')
      .update({
        application_status: 'rejected',
        approval_status: 'rejected',
        rejection_reason: reason,
        approved_by: approverId,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)

    if (error) {
      return { success: false, error: `거절 처리 실패: ${error.message}` }
    }

    revalidatePath('/admin')
    return { success: true }

  } catch (error: any) {
    console.error('Photographer rejection error:', error)
    return { success: false, error: '거절 처리 중 오류가 발생했습니다.' }
  }
}

/**
 * 대기 중인 작가 지원서 목록 조회
 */
export async function getPendingApplications(): Promise<{ 
  success: boolean 
  applications?: any[] 
  error?: string 
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('photographers')
      .select(`
        id,
        name,
        email,
        phone,
        years_experience,
        specialties,
        studio_location,
        bio,
        application_status,
        portfolio_submitted_at,
        created_at,
        admin_portfolio_photos(
          id,
          photo_url,
          thumbnail_url,
          title,
          is_representative
        )
      `)
      .eq('application_status', 'pending')
      .order('portfolio_submitted_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, applications: data || [] }

  } catch (error: any) {
    console.error('Error fetching pending applications:', error)
    return { success: false, error: '지원서 목록 조회 중 오류가 발생했습니다.' }
  }
}

export async function getPhotographers(filters: PhotographerFilters = {}) {
  try {
    const supabase = await createClient()
    
    // Base query to get admin users with portfolio count
    let query = supabase
      .from('photographers')
      .select(`
        id,
        name,
        email,
        created_at,
        admin_portfolio_photos(count)
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
      name: photographer.name || '',
      email: photographer.email || '',
      created_at: photographer.created_at || '',
      portfolioCount: photographer.admin_portfolio_photos?.length || 0,
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
    console.error('Error in getPhotographers:', error)
    return { error: 'Failed to fetch photographers' }
  }
}

export async function getPhotographerById(id: string) {
  try {
    const supabase = await createClient()
    
    const { data: photographer, error } = await supabase
      .from('photographers')
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
    // personality_types 테이블이 삭제되었으므로 빈 배열 반환
    // TODO: 새로운 매칭 시스템으로 교체 필요
    return { data: [] }
  } catch (error) {
    console.error('Error in getPersonalityTypes:', error)
    return { error: 'Failed to fetch personality types' }
  }
}