'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPhotographerProfileFull,
  updateBasicProfile,
  update4DProfile,
  uploadProfileImage,
  deleteProfileImage,
  updateProfileImageUrl,
  type BasicProfileUpdateData,
  type FourDimensionProfileUpdateData
} from '@/lib/actions/photographer-profiles'
import { toast } from 'sonner'

/**
 * Hook to fetch full photographer profile
 */
export function usePhotographerProfile(photographerId: string) {
  return useQuery({
    queryKey: ['photographer-profile', photographerId],
    queryFn: async () => {
      const { data, error } = await getPhotographerProfileFull(photographerId)
      if (error) throw error
      return data
    },
    enabled: !!photographerId
  })
}

/**
 * Hook for profile mutations
 */
export function useProfileMutations(photographerId: string) {
  const queryClient = useQueryClient()

  const updateBasic = useMutation({
    mutationFn: (data: BasicProfileUpdateData) =>
      updateBasicProfile(photographerId, data),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error('기본 정보 저장에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['photographer-profile', photographerId] })
      toast.success('기본 정보가 저장되었습니다')
    },
    onError: (error) => {
      console.error('Error updating basic profile:', error)
      toast.error('기본 정보 저장 중 오류가 발생했습니다')
    }
  })

  const update4D = useMutation({
    mutationFn: (data: FourDimensionProfileUpdateData) =>
      update4DProfile(photographerId, data),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error('4차원 프로필 저장에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['photographer-profile', photographerId] })
      toast.success('4차원 프로필이 저장되었습니다. 임베딩 생성 작업이 시작됩니다.')
    },
    onError: (error) => {
      console.error('Error updating 4D profile:', error)
      toast.error('4차원 프로필 저장 중 오류가 발생했습니다')
    }
  })

  return {
    updateBasic,
    update4D
  }
}

/**
 * Hook for profile image operations
 */
export function useProfileImage(photographerId: string) {
  const queryClient = useQueryClient()

  const upload = useMutation({
    mutationFn: (file: File) => uploadProfileImage(file, photographerId),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error('프로필 이미지 업로드에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['photographer-profile', photographerId] })
      toast.success('프로필 이미지가 업로드되었습니다')
    },
    onError: (error) => {
      console.error('Error uploading profile image:', error)
      toast.error('프로필 이미지 업로드 중 오류가 발생했습니다')
    }
  })

  const deleteImage = useMutation({
    mutationFn: () => deleteProfileImage(photographerId),
    onSuccess: ({ error }) => {
      if (error) {
        toast.error('프로필 이미지 삭제에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['photographer-profile', photographerId] })
      toast.success('프로필 이미지가 삭제되었습니다')
    },
    onError: (error) => {
      console.error('Error deleting profile image:', error)
      toast.error('프로필 이미지 삭제 중 오류가 발생했습니다')
    }
  })

  const updateImageUrl = useMutation({
    mutationFn: (imageUrl: string) => updateProfileImageUrl(photographerId, imageUrl),
    onSuccess: ({ error }) => {
      if (error) {
        toast.error('프로필 이미지 URL 저장에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['photographer-profile', photographerId] })
      toast.success('프로필 이미지 URL이 저장되었습니다')
    },
    onError: (error) => {
      console.error('Error updating profile image URL:', error)
      toast.error('프로필 이미지 URL 저장 중 오류가 발생했습니다')
    }
  })

  return {
    upload,
    deleteImage,
    updateImageUrl
  }
}
