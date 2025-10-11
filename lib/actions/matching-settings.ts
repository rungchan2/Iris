/**
 * Matching Settings Server Actions
 * 매칭 설정 관련 서버 액션
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { adminLogger } from '@/lib/logger'

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface SurveyQuestion {
  id: string
  question_order: number
  question_key: string
  question_title: string
  question_type: string
  weight_category: string
  base_weight: number
  is_hard_filter: boolean
  is_active: boolean
  survey_choices?: Array<{
    id: string
    choice_key: string
    choice_label: string
    choice_order: number
    is_active: boolean
  }>
  survey_images?: Array<{
    id: string
    image_key: string
    image_label: string
    image_url: string
    image_order: number
    is_active: boolean
  }>
}

export interface SystemSetting {
  setting_key: string
  setting_value: string | number | boolean
}

/**
 * Load all survey questions with choices and images
 */
export async function getSurveyQuestions(): Promise<ApiResponse<SurveyQuestion[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('survey_questions')
      .select(`
        *,
        survey_choices (*),
        survey_images (*)
      `)
      .order('question_order')

    if (error) {
      adminLogger.error('Error fetching survey questions:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as SurveyQuestion[] }
  } catch (error) {
    adminLogger.error('Unexpected error in getSurveyQuestions:', error)
    return { success: false, error: 'Failed to fetch survey questions' }
  }
}

/**
 * Load all system settings
 */
export async function getSystemSettings(): Promise<ApiResponse<Record<string, string | number | boolean>>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')

    if (error) {
      adminLogger.error('Error fetching system settings:', error)
      return { success: false, error: error.message }
    }

    const settingsMap: Record<string, string | number | boolean> = {}
    data?.forEach(setting => {
      if (setting.setting_value !== null) {
        settingsMap[setting.setting_key] = setting.setting_value as string | number | boolean
      }
    })

    return { success: true, data: settingsMap }
  } catch (error) {
    adminLogger.error('Unexpected error in getSystemSettings:', error)
    return { success: false, error: 'Failed to fetch system settings' }
  }
}

/**
 * Update question title
 */
export async function updateQuestionTitle(
  questionId: string,
  newTitle: string
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('survey_questions')
      .update({ question_title: newTitle })
      .eq('id', questionId)

    if (error) {
      adminLogger.error('Error updating question title:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Question title updated', { questionId })
    return { success: true, data: undefined }
  } catch (error) {
    adminLogger.error('Unexpected error in updateQuestionTitle:', error)
    return { success: false, error: 'Failed to update question title' }
  }
}

/**
 * Update choice label
 */
export async function updateChoiceLabel(
  choiceId: string,
  newLabel: string
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('survey_choices')
      .update({ choice_label: newLabel })
      .eq('id', choiceId)

    if (error) {
      adminLogger.error('Error updating choice label:', error)
      return { success: false, error: error.message }
    }

    // Add to embedding job queue
    await supabase
      .from('embedding_jobs')
      .insert({
        job_type: 'choice_embedding',
        target_id: choiceId,
        job_status: 'pending'
      })

    adminLogger.info('Choice label updated', { choiceId })
    return { success: true, data: undefined }
  } catch (error) {
    adminLogger.error('Unexpected error in updateChoiceLabel:', error)
    return { success: false, error: 'Failed to update choice label' }
  }
}

/**
 * Toggle question active status
 */
export async function toggleQuestionActive(
  questionId: string,
  isActive: boolean
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('survey_questions')
      .update({ is_active: isActive })
      .eq('id', questionId)

    if (error) {
      adminLogger.error('Error toggling question active:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Question active status toggled', { questionId, isActive })
    return { success: true, data: undefined }
  } catch (error) {
    adminLogger.error('Unexpected error in toggleQuestionActive:', error)
    return { success: false, error: 'Failed to toggle question active' }
  }
}

/**
 * Update matching weights
 */
export async function updateMatchingWeights(
  weights: { styleEmotion: number; communicationPsychology: number; purposeStory: number; companion: number },
  questions: SurveyQuestion[]
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const total = Object.values(weights).reduce((sum, value) => sum + value, 0)
    const styleRatio = weights.styleEmotion / total
    const commRatio = weights.communicationPsychology / total
    const purposeRatio = weights.purposeStory / total
    const companionRatio = weights.companion / total

    for (const question of questions) {
      let newWeight = question.base_weight

      switch (question.weight_category) {
        case 'style_emotion':
          newWeight = styleRatio / questions.filter(q => q.weight_category === 'style_emotion').length
          break
        case 'communication_psychology':
          newWeight = commRatio / questions.filter(q => q.weight_category === 'communication_psychology').length
          break
        case 'purpose_story':
          newWeight = purposeRatio / questions.filter(q => q.weight_category === 'purpose_story').length
          break
        case 'companion':
          newWeight = companionRatio / questions.filter(q => q.weight_category === 'companion').length
          break
      }

      if (Math.abs(newWeight - question.base_weight) > 0.001) {
        await supabase
          .from('survey_questions')
          .update({ base_weight: newWeight })
          .eq('id', question.id)
      }
    }

    adminLogger.info('Matching weights updated', { weights })
    return { success: true, data: undefined }
  } catch (error) {
    adminLogger.error('Unexpected error in updateMatchingWeights:', error)
    return { success: false, error: 'Failed to update matching weights' }
  }
}

/**
 * Save system settings
 */
export async function saveSystemSettings(
  settings: Record<string, string | number | boolean>
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const getSettingDescription = (key: string): string => {
      const descriptions: Record<string, string> = {
        max_results: '최대 매칭 결과 수',
        min_similarity_score: '최소 유사도 점수',
        enable_keyword_bonus: '키워드 보너스 활성화',
        enable_region_filter: '지역 필터링 활성화',
        enable_budget_filter: '예산 필터링 활성화',
        cache_results: '결과 캐싱 활성화',
        auto_refresh_embeddings: '자동 임베딩 갱신'
      }
      return descriptions[key] || key
    }

    for (const [key, value] of Object.entries(settings)) {
      await supabase
        .from('system_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          setting_description: getSettingDescription(key)
        })
    }

    adminLogger.info('System settings saved')
    return { success: true, data: undefined }
  } catch (error) {
    adminLogger.error('Unexpected error in saveSystemSettings:', error)
    return { success: false, error: 'Failed to save system settings' }
  }
}
