'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPhotos, getPhotoById, deletePhoto, updatePhoto, type PhotoFilters, type PhotoMetadata } from '@/lib/actions/photos'
import { toast } from 'sonner'

/**
 * Query key factory for photos
 */
export const photoKeys = {
  all: ['photos'] as const,
  lists: () => [...photoKeys.all, 'list'] as const,
  list: (filters: PhotoFilters) => [...photoKeys.lists(), filters] as const,
  details: () => [...photoKeys.all, 'detail'] as const,
  detail: (id: string) => [...photoKeys.details(), id] as const,
}

/**
 * Hook to fetch photos with filtering and pagination
 */
export function usePhotos(filters: PhotoFilters & { enabled?: boolean } = {}) {
  const { enabled, ...photoFilters } = filters
  return useQuery({
    queryKey: photoKeys.list(photoFilters),
    queryFn: async () => {
      const result = await getPhotos(photoFilters)
      if (result.error) {
        throw new Error(result.error)
      }
      return result
    },
    enabled: enabled !== undefined ? enabled : true,
  })
}

/**
 * Hook to fetch single photo
 */
export function usePhoto(id: string | undefined) {
  return useQuery({
    queryKey: photoKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Photo ID is required')
      const result = await getPhotoById(id)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: !!id,
  })
}

/**
 * Hook for photo mutations (delete, update)
 */
export function usePhotoMutations() {
  const queryClient = useQueryClient()

  const deletePhotoMutation = useMutation({
    mutationFn: deletePhoto,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('사진이 삭제되었습니다')
        queryClient.invalidateQueries({ queryKey: photoKeys.lists() })
      } else {
        toast.error(result.error || '사진 삭제에 실패했습니다')
      }
    },
    onError: () => {
      toast.error('사진 삭제 중 오류가 발생했습니다')
    },
  })

  const updatePhotoMutation = useMutation({
    mutationFn: ({ id, metadata }: { id: string; metadata: PhotoMetadata }) =>
      updatePhoto(id, metadata),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('사진이 업데이트되었습니다')
        queryClient.invalidateQueries({ queryKey: photoKeys.lists() })
      } else {
        toast.error(result.error || '사진 업데이트에 실패했습니다')
      }
    },
    onError: () => {
      toast.error('사진 업데이트 중 오류가 발생했습니다')
    },
  })

  return {
    deletePhoto: deletePhotoMutation.mutate,
    updatePhoto: updatePhotoMutation.mutate,
    isDeleting: deletePhotoMutation.isPending,
    isUpdating: updatePhotoMutation.isPending,
  }
}
