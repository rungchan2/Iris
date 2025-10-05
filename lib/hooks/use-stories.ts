import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getStories,
  getStoryById,
  getStoryStats,
  approveStory,
  rejectStory,
  toggleFeaturedStory,
  updateStoryVisibility,
  deleteStory,
  type StoryFilters,
} from '@/lib/actions/stories'

// Re-export StoryFilters for components
export type { StoryFilters }

/**
 * Query Keys Factory for Stories
 */
export const storyKeys = {
  all: ['stories'] as const,
  lists: () => [...storyKeys.all, 'list'] as const,
  list: (page?: number, filters?: StoryFilters) => [...storyKeys.lists(), page, filters] as const,
  detail: (id: string) => [...storyKeys.all, 'detail', id] as const,
  stats: () => [...storyKeys.all, 'stats'] as const,
}

/**
 * Hook for fetching stories with filters and pagination
 */
export function useStories(page: number = 1, limit: number = 20, filters?: StoryFilters) {
  return useQuery({
    queryKey: storyKeys.list(page, filters),
    queryFn: async () => {
      const result = await getStories({ page, limit, filters })

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Failed to fetch stories')
      }

      if (!result.data) {
        throw new Error('No data returned')
      }

      return {
        data: result.data,
        pagination: result.pagination,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching a single story
 */
export function useStory(id: string) {
  return useQuery({
    queryKey: storyKeys.detail(id),
    queryFn: async () => {
      const result = await getStoryById(id)

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Failed to fetch story')
      }

      if (!result.data) {
        throw new Error('No data returned')
      }

      return result.data
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for fetching story statistics
 */
export function useStoryStats() {
  return useQuery({
    queryKey: storyKeys.stats(),
    queryFn: async () => {
      const result = await getStoryStats()

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Failed to fetch story stats')
      }

      if (!result.data) {
        throw new Error('No data returned')
      }

      return result.data
    },
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

/**
 * Hook for approving a story
 */
export function useApproveStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => approveStory(id, note),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: storyKeys.lists() })
        queryClient.invalidateQueries({ queryKey: storyKeys.stats() })
        toast.success('사연이 승인되었습니다')
      } else {
        toast.error('error' in result ? result.error : '사연 승인에 실패했습니다')
      }
    },
    onError: () => {
      toast.error('사연 승인 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook for rejecting a story
 */
export function useRejectStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => rejectStory(id, note),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: storyKeys.lists() })
        queryClient.invalidateQueries({ queryKey: storyKeys.stats() })
        toast.success('사연이 거절되었습니다')
      } else {
        toast.error('error' in result ? result.error : '사연 거절에 실패했습니다')
      }
    },
    onError: () => {
      toast.error('사연 거절 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook for toggling featured status
 */
export function useToggleFeaturedStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => toggleFeaturedStory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: storyKeys.lists() })
      const previousStories = queryClient.getQueryData(storyKeys.lists())
      return { previousStories }
    },
    onError: (err, id, context) => {
      if (context?.previousStories) {
        queryClient.setQueryData(storyKeys.lists(), context.previousStories)
      }
      toast.error('추천 상태 변경에 실패했습니다')
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: storyKeys.lists() })
        queryClient.invalidateQueries({ queryKey: storyKeys.stats() })
        toast.success('추천 상태가 변경되었습니다')
      } else {
        toast.error('error' in result ? result.error : '추천 상태 변경에 실패했습니다')
      }
    },
  })
}

/**
 * Hook for updating story visibility
 */
export function useUpdateStoryVisibility() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, visibility }: { id: string; visibility: 'public' | 'private' }) =>
      updateStoryVisibility(id, visibility),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: storyKeys.lists() })
        queryClient.invalidateQueries({ queryKey: storyKeys.stats() })
        toast.success('공개 설정이 변경되었습니다')
      } else {
        toast.error('error' in result ? result.error : '공개 설정 변경에 실패했습니다')
      }
    },
    onError: () => {
      toast.error('공개 설정 변경 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook for deleting a story
 */
export function useDeleteStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteStory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: storyKeys.lists() })
      const previousStories = queryClient.getQueryData(storyKeys.lists())
      return { previousStories }
    },
    onError: (err, id, context) => {
      if (context?.previousStories) {
        queryClient.setQueryData(storyKeys.lists(), context.previousStories)
      }
      toast.error('사연 삭제에 실패했습니다')
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: storyKeys.lists() })
        queryClient.invalidateQueries({ queryKey: storyKeys.stats() })
        toast.success('사연이 삭제되었습니다')
      } else {
        toast.error('error' in result ? result.error : '사연 삭제에 실패했습니다')
      }
    },
  })
}
