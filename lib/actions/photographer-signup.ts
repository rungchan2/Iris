'use server'

import { createClient } from '@/lib/supabase/server'
import { photographerLogger, uploadLogger } from '@/lib/logger'
import type { PhotographerInsertData } from '@/types'

// API Response Type
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * 작가 프로필 생성 (Server Action)
 *
 * @param data - 작가 프로필 데이터
 * @returns 성공/실패 결과
 */
export async function createPhotographerProfileAction(
  data: PhotographerInsertData
): Promise<ApiResponse<{ photographerId: string }>> {
  try {
    const supabase = await createClient()

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      photographerLogger.error('Authentication failed in createPhotographerProfile', { error: authError })
      return {
        success: false,
        error: '사용자 인증에 실패했습니다. 다시 로그인해주세요.',
      }
    }

    // userId 검증
    if (user.id !== data.userId) {
      photographerLogger.error('User ID mismatch', {
        authenticatedUserId: user.id,
        requestedUserId: data.userId,
      })
      return {
        success: false,
        error: '사용자 정보가 일치하지 않습니다.',
      }
    }

    photographerLogger.info('Creating photographer profile', { userId: data.userId })

    // photographers 테이블에 작가 정보 생성
    const { error: insertError } = await supabase
      .from('photographers')
      .insert({
        id: data.userId,
        email: data.email,
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        age_range: data.age_range,
        instagram_handle: data.instagram_handle,
        website_url: data.website_url,
        years_experience: data.years_experience,
        specialties: data.specialties,
        studio_location: data.studio_location,
        equipment_info: data.equipment_info,
        bio: data.bio,
        price_range_min: data.price_range_min,
        price_range_max: data.price_range_max,
        price_description: data.price_description,
        approval_status: 'pending',
        portfolio_submitted_at: new Date().toISOString(),
        profile_completed: true,
      })

    if (insertError) {
      photographerLogger.error('Failed to create photographer profile', {
        userId: data.userId,
        error: insertError,
      })
      return {
        success: false,
        error: `작가 프로필 생성에 실패했습니다: ${insertError.message}`,
      }
    }

    photographerLogger.info('Photographer profile created successfully', { userId: data.userId })

    return {
      success: true,
      data: { photographerId: data.userId },
    }
  } catch (error) {
    photographerLogger.error('Unexpected error in createPhotographerProfile', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : '작가 프로필 생성 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 포트폴리오 이미지 업로드 (Server Action)
 *
 * @param formData - FormData containing files
 * @returns 업로드 결과
 */
export async function uploadPortfolioImagesAction(
  formData: FormData
): Promise<ApiResponse<{ uploadedCount: number; failedCount: number }>> {
  try {
    const supabase = await createClient()

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      uploadLogger.error('Authentication failed in uploadPortfolioImages', { error: authError })
      return {
        success: false,
        error: '사용자 인증에 실패했습니다. 다시 로그인해주세요.',
      }
    }

    uploadLogger.info('Starting portfolio upload', { userId: user.id })

    // FormData에서 파일들 추출
    const files: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return {
        success: false,
        error: '업로드할 파일이 없습니다.',
      }
    }

    uploadLogger.info(`Uploading ${files.length} files`, { userId: user.id })

    // 파일 업로드 처리
    const uploadResults = await Promise.all(
      files.map(async (file, index) => {
        try {
          // 파일명 생성 (중복 방지)
          const timestamp = Date.now()
          const randomString = Math.random().toString(36).substring(7)
          const fileExt = file.name.split('.').pop()
          const fileName = `${user.id}/${timestamp}_${randomString}.${fileExt}`

          // Storage에 업로드 (photos 버킷 사용)
          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) {
            uploadLogger.error('File upload failed', {
              userId: user.id,
              fileName,
              error: uploadError,
            })
            return { success: false, error: uploadError.message }
          }

          // Public URL 생성
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName)

          // photos 테이블에 레코드 생성
          const { error: photoError } = await supabase
            .from('photos')
            .insert({
              uploaded_by: user.id,
              filename: file.name,
              storage_url: publicUrl,
              size_kb: Math.round(file.size / 1024),
              is_public: true,
              display_order: index,
            })

          if (photoError) {
            uploadLogger.error('Failed to create photo record', {
              userId: user.id,
              fileName,
              error: photoError,
            })
            return { success: false, error: photoError.message }
          }

          uploadLogger.info('File uploaded successfully', {
            userId: user.id,
            fileName,
          })

          return { success: true }
        } catch (error) {
          uploadLogger.error('Unexpected error during file upload', {
            userId: user.id,
            error,
          })
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })
    )

    const successfulUploads = uploadResults.filter(r => r.success).length
    const failedUploads = uploadResults.filter(r => !r.success).length

    if (successfulUploads === 0) {
      return {
        success: false,
        error: '모든 파일 업로드에 실패했습니다. 다시 시도해주세요.',
      }
    }

    uploadLogger.info('Portfolio upload completed', {
      userId: user.id,
      successfulUploads,
      failedUploads,
    })

    return {
      success: true,
      data: {
        uploadedCount: successfulUploads,
        failedCount: failedUploads,
      },
    }
  } catch (error) {
    uploadLogger.error('Unexpected error in uploadPortfolioImages', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : '포트폴리오 업로드 중 오류가 발생했습니다.',
    }
  }
}
