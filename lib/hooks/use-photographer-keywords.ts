'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getKeywords,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  bulkUpsertKeywords,
  type CreateKeywordData,
  type UpdateKeywordData
} from '@/lib/actions/photographer-keywords'
import { toast } from 'sonner'

/**
 * Hook to fetch photographer keywords
 */
export function usePhotographerKeywords(photographerId: string) {
  return useQuery({
    queryKey: ['photographer-keywords', photographerId],
    queryFn: async () => {
      const { data, error } = await getKeywords(photographerId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!photographerId
  })
}

/**
 * Hook for keyword mutations
 */
export function useKeywordMutations(photographerId: string) {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (keywordData: CreateKeywordData) =>
      createKeyword(photographerId, keywordData),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error('키워드 추가에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['photographer-keywords', photographerId] })
      toast.success('키워드가 추가되었습니다')
    },
    onError: (error) => {
      console.error('Error creating keyword:', error)
      toast.error('키워드 추가 중 오류가 발생했습니다')
    }
  })

  const update = useMutation({
    mutationFn: ({ keyword, data }: { keyword: string; data: UpdateKeywordData }) =>
      updateKeyword(photographerId, keyword, data),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error('키워드 수정에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['photographer-keywords', photographerId] })
      toast.success('키워드가 수정되었습니다')
    },
    onError: (error) => {
      console.error('Error updating keyword:', error)
      toast.error('키워드 수정 중 오류가 발생했습니다')
    }
  })

  const remove = useMutation({
    mutationFn: (keyword: string) =>
      deleteKeyword(photographerId, keyword),
    onSuccess: ({ error }) => {
      if (error) {
        toast.error('키워드 삭제에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['photographer-keywords', photographerId] })
      toast.success('키워드가 삭제되었습니다')
    },
    onError: (error) => {
      console.error('Error deleting keyword:', error)
      toast.error('키워드 삭제 중 오류가 발생했습니다')
    }
  })

  const bulkUpsert = useMutation({
    mutationFn: (keywords: CreateKeywordData[]) =>
      bulkUpsertKeywords(photographerId, keywords),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error('키워드 일괄 업데이트에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['photographer-keywords', photographerId] })
      toast.success('키워드가 일괄 업데이트되었습니다')
    },
    onError: (error) => {
      console.error('Error bulk upserting keywords:', error)
      toast.error('키워드 일괄 업데이트 중 오류가 발생했습니다')
    }
  })

  return {
    create,
    update,
    remove,
    bulkUpsert
  }
}
