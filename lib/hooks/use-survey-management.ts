'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSurveyQuestions,
  getSurveyQuestion,
  updateQuestion,
  getSurveyChoices,
  createChoice,
  updateChoice,
  deleteChoice,
  getSurveyImages,
  createSurveyImage,
  updateSurveyImage,
  deleteSurveyImage,
  uploadSurveyImageFile,
  type CreateChoiceData,
  type UpdateChoiceData,
  type CreateSurveyImageData,
  type UpdateSurveyImageData
} from '@/lib/actions/survey-management'
import { toast } from 'sonner'

/**
 * Hook to fetch all survey questions
 */
export function useSurveyQuestions() {
  return useQuery({
    queryKey: ['survey-questions'],
    queryFn: async () => {
      const { data, error } = await getSurveyQuestions()
      if (error) throw error
      return data ?? []
    }
  })
}

/**
 * Hook to fetch single survey question
 */
export function useSurveyQuestion(questionId: string) {
  return useQuery({
    queryKey: ['survey-question', questionId],
    queryFn: async () => {
      const { data, error } = await getSurveyQuestion(questionId)
      if (error) throw error
      return data
    },
    enabled: !!questionId
  })
}

/**
 * Hook to fetch choices for a question
 */
export function useSurveyChoices(questionId: string) {
  return useQuery({
    queryKey: ['survey-choices', questionId],
    queryFn: async () => {
      const { data, error } = await getSurveyChoices(questionId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!questionId
  })
}

/**
 * Hook for choice mutations
 */
export function useChoiceMutations(questionId: string) {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (choiceData: CreateChoiceData) =>
      createChoice(questionId, choiceData),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error('선택지 추가에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['survey-choices', questionId] })
      queryClient.invalidateQueries({ queryKey: ['survey-question', questionId] })
      queryClient.invalidateQueries({ queryKey: ['survey-questions'] })
      toast.success('선택지가 추가되었습니다')
    },
    onError: (error) => {
      console.error('Error creating choice:', error)
      toast.error('선택지 추가 중 오류가 발생했습니다')
    }
  })

  const update = useMutation({
    mutationFn: ({ choiceId, data }: { choiceId: string; data: UpdateChoiceData }) =>
      updateChoice(choiceId, data),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error('선택지 수정에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['survey-choices', questionId] })
      queryClient.invalidateQueries({ queryKey: ['survey-question', questionId] })
      queryClient.invalidateQueries({ queryKey: ['survey-questions'] })
      toast.success('선택지가 수정되었습니다. 임베딩 생성 작업이 시작됩니다.')
    },
    onError: (error) => {
      console.error('Error updating choice:', error)
      toast.error('선택지 수정 중 오류가 발생했습니다')
    }
  })

  const remove = useMutation({
    mutationFn: (choiceId: string) => deleteChoice(choiceId),
    onSuccess: ({ error }) => {
      if (error) {
        toast.error('선택지 삭제에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['survey-choices', questionId] })
      queryClient.invalidateQueries({ queryKey: ['survey-question', questionId] })
      queryClient.invalidateQueries({ queryKey: ['survey-questions'] })
      toast.success('선택지가 삭제되었습니다')
    },
    onError: (error) => {
      console.error('Error deleting choice:', error)
      toast.error('선택지 삭제 중 오류가 발생했습니다')
    }
  })

  return {
    create,
    update,
    remove
  }
}

/**
 * Hook to fetch images for a question
 */
export function useSurveyImages(questionId: string) {
  return useQuery({
    queryKey: ['survey-images', questionId],
    queryFn: async () => {
      const { data, error } = await getSurveyImages(questionId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!questionId
  })
}

/**
 * Hook for image mutations
 */
export function useImageMutations(questionId: string) {
  const queryClient = useQueryClient()

  const uploadFile = useMutation({
    mutationFn: (file: File) => uploadSurveyImageFile(file, questionId),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error('이미지 업로드에 실패했습니다')
        throw error
      }
    },
    onError: (error) => {
      console.error('Error uploading image:', error)
      toast.error('이미지 업로드 중 오류가 발생했습니다')
    }
  })

  const create = useMutation({
    mutationFn: (imageData: CreateSurveyImageData) =>
      createSurveyImage(questionId, imageData),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error('이미지 추가에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['survey-images', questionId] })
      queryClient.invalidateQueries({ queryKey: ['survey-question', questionId] })
      queryClient.invalidateQueries({ queryKey: ['survey-questions'] })
      toast.success('이미지가 추가되었습니다. 임베딩 생성 작업이 시작됩니다.')
    },
    onError: (error) => {
      console.error('Error creating image:', error)
      toast.error('이미지 추가 중 오류가 발생했습니다')
    }
  })

  const update = useMutation({
    mutationFn: ({ imageId, data }: { imageId: string; data: UpdateSurveyImageData }) =>
      updateSurveyImage(imageId, data),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error('이미지 수정에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['survey-images', questionId] })
      queryClient.invalidateQueries({ queryKey: ['survey-question', questionId] })
      queryClient.invalidateQueries({ queryKey: ['survey-questions'] })
      toast.success('이미지가 수정되었습니다')
    },
    onError: (error) => {
      console.error('Error updating image:', error)
      toast.error('이미지 수정 중 오류가 발생했습니다')
    }
  })

  const remove = useMutation({
    mutationFn: (imageId: string) => deleteSurveyImage(imageId),
    onSuccess: ({ error }) => {
      if (error) {
        toast.error('이미지 삭제에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['survey-images', questionId] })
      queryClient.invalidateQueries({ queryKey: ['survey-question', questionId] })
      queryClient.invalidateQueries({ queryKey: ['survey-questions'] })
      toast.success('이미지가 삭제되었습니다')
    },
    onError: (error) => {
      console.error('Error deleting image:', error)
      toast.error('이미지 삭제 중 오류가 발생했습니다')
    }
  })

  return {
    uploadFile,
    create,
    update,
    remove
  }
}

/**
 * Hook for question mutations
 */
export function useQuestionMutations() {
  const queryClient = useQueryClient()

  const update = useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: any }) =>
      updateQuestion(questionId, data),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error('질문 수정에 실패했습니다')
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['survey-question', data?.id] })
      queryClient.invalidateQueries({ queryKey: ['survey-questions'] })
      toast.success('질문이 수정되었습니다')
    },
    onError: (error) => {
      console.error('Error updating question:', error)
      toast.error('질문 수정 중 오류가 발생했습니다')
    }
  })

  return {
    update
  }
}
