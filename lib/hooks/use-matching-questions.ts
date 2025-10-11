/**
 * Matching Questions React Query Hooks
 * 매칭 질문 관리 관련 커스텀 훅
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getSurveyQuestionsWithDetails,
  getEmbeddingStatus,
  updateSurveyQuestion,
} from '@/lib/actions/matching-questions'
import type { TablesUpdate } from '@/types/database.types'

/**
 * Query Keys Factory
 */
export const matchingQuestionsKeys = {
  all: ['matching-questions'] as const,
  questions: () => [...matchingQuestionsKeys.all, 'questions'] as const,
  embeddingStatus: () => [...matchingQuestionsKeys.all, 'embedding-status'] as const,
}

/**
 * Survey Questions Query Hook
 */
export function useSurveyQuestions() {
  return useQuery({
    queryKey: matchingQuestionsKeys.questions(),
    queryFn: async () => {
      const result = await getSurveyQuestionsWithDetails()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch survey questions')
      }
      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Embedding Status Query Hook
 */
export function useEmbeddingStatus() {
  return useQuery({
    queryKey: matchingQuestionsKeys.embeddingStatus(),
    queryFn: async () => {
      const result = await getEmbeddingStatus()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch embedding status')
      }
      return result.data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (more frequent updates for status)
    refetchInterval: 1000 * 30, // Auto-refetch every 30 seconds
  })
}

/**
 * Update Survey Question Mutation Hook
 */
export function useUpdateSurveyQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      questionId,
      updates,
    }: {
      questionId: string
      updates: TablesUpdate<'survey_questions'>
    }) => updateSurveyQuestion(questionId, updates),
    onSuccess: () => {
      toast.success('질문이 업데이트되었습니다')
      queryClient.invalidateQueries({ queryKey: matchingQuestionsKeys.questions() })
    },
    onError: () => {
      toast.error('질문 업데이트 중 오류가 발생했습니다')
    },
  })
}

/**
 * Refresh Embedding Status Hook
 */
export function useRefreshEmbeddingStatus() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: matchingQuestionsKeys.embeddingStatus() })
  }
}
