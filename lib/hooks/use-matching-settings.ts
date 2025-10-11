/**
 * Matching Settings React Query Hooks
 * Admin 매칭 설정 관리 관련 커스텀 훅
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getSurveyQuestions,
  getSystemSettings,
  updateQuestionTitle,
  updateChoiceLabel,
  toggleQuestionActive,
  updateMatchingWeights,
  saveSystemSettings,
  type SurveyQuestion,
} from '@/lib/actions/matching-settings'

/**
 * Query Keys Factory
 */
export const matchingSettingsKeys = {
  all: ['matching-settings'] as const,
  questions: () => [...matchingSettingsKeys.all, 'questions'] as const,
  systemSettings: () => [...matchingSettingsKeys.all, 'system-settings'] as const,
}

/**
 * Survey Questions Query Hook
 */
export function useMatchingQuestions() {
  return useQuery({
    queryKey: matchingSettingsKeys.questions(),
    queryFn: async () => {
      const result = await getSurveyQuestions()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch survey questions')
      }
      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * System Settings Query Hook
 */
export function useSystemSettings() {
  return useQuery({
    queryKey: matchingSettingsKeys.systemSettings(),
    queryFn: async () => {
      const result = await getSystemSettings()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch system settings')
      }
      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Update Question Title Mutation Hook
 */
export function useUpdateQuestionTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ questionId, newTitle }: { questionId: string; newTitle: string }) =>
      updateQuestionTitle(questionId, newTitle),
    onMutate: async ({ questionId, newTitle }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: matchingSettingsKeys.questions() })

      // Snapshot previous value
      const previousQuestions = queryClient.getQueryData<SurveyQuestion[]>(
        matchingSettingsKeys.questions()
      )

      // Optimistically update
      if (previousQuestions) {
        queryClient.setQueryData<SurveyQuestion[]>(
          matchingSettingsKeys.questions(),
          previousQuestions.map((q) =>
            q.id === questionId ? { ...q, question_title: newTitle } : q
          )
        )
      }

      return { previousQuestions }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousQuestions) {
        queryClient.setQueryData(matchingSettingsKeys.questions(), context.previousQuestions)
      }
      toast.error('질문 제목 수정 실패')
    },
    onSuccess: () => {
      toast.success('질문 제목이 수정되었습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: matchingSettingsKeys.questions() })
    },
  })
}

/**
 * Update Choice Label Mutation Hook
 */
export function useUpdateChoiceLabel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ choiceId, newLabel }: { choiceId: string; newLabel: string }) =>
      updateChoiceLabel(choiceId, newLabel),
    onMutate: async ({ choiceId, newLabel }) => {
      await queryClient.cancelQueries({ queryKey: matchingSettingsKeys.questions() })

      const previousQuestions = queryClient.getQueryData<SurveyQuestion[]>(
        matchingSettingsKeys.questions()
      )

      // Optimistically update
      if (previousQuestions) {
        queryClient.setQueryData<SurveyQuestion[]>(
          matchingSettingsKeys.questions(),
          previousQuestions.map((q) => ({
            ...q,
            survey_choices: q.survey_choices?.map((c) =>
              c.id === choiceId ? { ...c, choice_label: newLabel } : c
            ),
          }))
        )
      }

      return { previousQuestions }
    },
    onError: (err, variables, context) => {
      if (context?.previousQuestions) {
        queryClient.setQueryData(matchingSettingsKeys.questions(), context.previousQuestions)
      }
      toast.error('선택지 레이블 수정 실패')
    },
    onSuccess: () => {
      toast.success('선택지 레이블이 수정되었습니다 (임베딩 재생성 예약됨)')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: matchingSettingsKeys.questions() })
    },
  })
}

/**
 * Toggle Question Active Mutation Hook
 */
export function useToggleQuestionActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ questionId, isActive }: { questionId: string; isActive: boolean }) =>
      toggleQuestionActive(questionId, isActive),
    onMutate: async ({ questionId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: matchingSettingsKeys.questions() })

      const previousQuestions = queryClient.getQueryData<SurveyQuestion[]>(
        matchingSettingsKeys.questions()
      )

      // Optimistically update
      if (previousQuestions) {
        queryClient.setQueryData<SurveyQuestion[]>(
          matchingSettingsKeys.questions(),
          previousQuestions.map((q) =>
            q.id === questionId ? { ...q, is_active: isActive } : q
          )
        )
      }

      return { previousQuestions }
    },
    onError: (err, variables, context) => {
      if (context?.previousQuestions) {
        queryClient.setQueryData(matchingSettingsKeys.questions(), context.previousQuestions)
      }
      toast.error('질문 활성화 상태 변경 실패')
    },
    onSuccess: (data, { isActive }) => {
      toast.success(isActive ? '질문이 활성화되었습니다' : '질문이 비활성화되었습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: matchingSettingsKeys.questions() })
    },
  })
}

/**
 * Update Matching Weights Mutation Hook
 */
export function useUpdateMatchingWeights() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      weights,
      questions,
    }: {
      weights: { styleEmotion: number; communicationPsychology: number; purposeStory: number; companion: number }
      questions: SurveyQuestion[]
    }) => updateMatchingWeights(weights, questions),
    onSuccess: () => {
      toast.success('매칭 가중치가 업데이트되었습니다')
      queryClient.invalidateQueries({ queryKey: matchingSettingsKeys.questions() })
    },
    onError: () => {
      toast.error('매칭 가중치 업데이트 실패')
    },
  })
}

/**
 * Save System Settings Mutation Hook
 */
export function useSaveSystemSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Record<string, string | number | boolean>) =>
      saveSystemSettings(settings),
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: matchingSettingsKeys.systemSettings() })

      const previousSettings = queryClient.getQueryData<Record<string, string | number | boolean>>(
        matchingSettingsKeys.systemSettings()
      )

      // Optimistically update
      queryClient.setQueryData(matchingSettingsKeys.systemSettings(), newSettings)

      return { previousSettings }
    },
    onError: (err, variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(matchingSettingsKeys.systemSettings(), context.previousSettings)
      }
      toast.error('시스템 설정 저장 실패')
    },
    onSuccess: () => {
      toast.success('시스템 설정이 저장되었습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: matchingSettingsKeys.systemSettings() })
    },
  })
}
