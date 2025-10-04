'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type SurveyQuestion = Database['public']['Tables']['survey_questions']['Row']
type SurveyChoice = Database['public']['Tables']['survey_choices']['Row']
type SurveyChoiceInsert = Database['public']['Tables']['survey_choices']['Insert']
type SurveyChoiceUpdate = Database['public']['Tables']['survey_choices']['Update']
type SurveyImage = Database['public']['Tables']['survey_images']['Row']
type SurveyImageInsert = Database['public']['Tables']['survey_images']['Insert']
type SurveyImageUpdate = Database['public']['Tables']['survey_images']['Update']

export interface QuestionWithChoicesAndImages extends SurveyQuestion {
  choices: SurveyChoice[]
  images: SurveyImage[]
}

export interface CreateChoiceData {
  choice_key: string
  choice_label: string
  choice_description?: string
  choice_order: number
  is_active?: boolean
}

export interface UpdateChoiceData {
  choice_key?: string
  choice_label?: string
  choice_description?: string
  choice_order?: number
  is_active?: boolean
}

export interface CreateSurveyImageData {
  image_key: string
  image_label: string
  image_description?: string
  image_url: string
  image_order: number
  is_active?: boolean
}

export interface UpdateSurveyImageData {
  image_key?: string
  image_label?: string
  image_description?: string
  image_url?: string
  image_order?: number
  is_active?: boolean
}

/**
 * Get all survey questions with choices and images
 */
export async function getSurveyQuestions(): Promise<{
  data: QuestionWithChoicesAndImages[] | null
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    const { data: questions, error: questionsError } = await supabase
      .from('survey_questions')
      .select('*')
      .order('question_order', { ascending: true })

    if (questionsError) throw questionsError
    if (!questions) return { data: [], error: null }

    // Fetch choices and images for each question
    const questionsWithData = await Promise.all(
      questions.map(async (question) => {
        const [choicesResult, imagesResult] = await Promise.all([
          supabase
            .from('survey_choices')
            .select('*')
            .eq('question_id', question.id)
            .order('choice_order', { ascending: true }),
          supabase
            .from('survey_images')
            .select('*')
            .eq('question_id', question.id)
            .order('image_order', { ascending: true })
        ])

        return {
          ...question,
          choices: choicesResult.data || [],
          images: imagesResult.data || []
        }
      })
    )

    return { data: questionsWithData, error: null }
  } catch (error) {
    console.error('Error fetching survey questions:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Get single survey question with choices and images
 */
export async function getSurveyQuestion(
  questionId: string
): Promise<{
  data: QuestionWithChoicesAndImages | null
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    const { data: question, error: questionError } = await supabase
      .from('survey_questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError) throw questionError
    if (!question) throw new Error('Question not found')

    const [choicesResult, imagesResult] = await Promise.all([
      supabase
        .from('survey_choices')
        .select('*')
        .eq('question_id', questionId)
        .order('choice_order', { ascending: true }),
      supabase
        .from('survey_images')
        .select('*')
        .eq('question_id', questionId)
        .order('image_order', { ascending: true })
    ])

    return {
      data: {
        ...question,
        choices: choicesResult.data || [],
        images: imagesResult.data || []
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching survey question:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Update question metadata
 */
export async function updateQuestion(
  questionId: string,
  data: Partial<SurveyQuestion>
): Promise<{ data: SurveyQuestion | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const { data: updated, error } = await supabase
      .from('survey_questions')
      .update(data)
      .eq('id', questionId)
      .select()
      .single()

    if (error) throw error

    return { data: updated, error: null }
  } catch (error) {
    console.error('Error updating question:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Get all choices for a question
 */
export async function getSurveyChoices(
  questionId: string
): Promise<{ data: SurveyChoice[] | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('survey_choices')
      .select('*')
      .eq('question_id', questionId)
      .order('choice_order', { ascending: true })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching survey choices:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Create a new choice (and queue embedding)
 */
export async function createChoice(
  questionId: string,
  choiceData: CreateChoiceData
): Promise<{ data: SurveyChoice | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const insertData: SurveyChoiceInsert = {
      question_id: questionId,
      choice_key: choiceData.choice_key,
      choice_label: choiceData.choice_label,
      choice_description: choiceData.choice_description || null,
      choice_order: choiceData.choice_order,
      is_active: choiceData.is_active ?? true
    }

    const { data, error } = await supabase
      .from('survey_choices')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    // Queue embedding generation
    if (data && choiceData.choice_label) {
      await supabase
        .from('embedding_jobs')
        .insert({
          job_type: 'survey_choice',
          target_id: data.id
        })
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error creating choice:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Update a choice (and queue embedding if text changed)
 */
export async function updateChoice(
  choiceId: string,
  updateData: UpdateChoiceData
): Promise<{ data: SurveyChoice | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const update: SurveyChoiceUpdate = {}
    if (updateData.choice_key !== undefined) update.choice_key = updateData.choice_key
    if (updateData.choice_label !== undefined) update.choice_label = updateData.choice_label
    if (updateData.choice_description !== undefined) update.choice_description = updateData.choice_description
    if (updateData.choice_order !== undefined) update.choice_order = updateData.choice_order
    if (updateData.is_active !== undefined) update.is_active = updateData.is_active

    // If label is being updated, reset embedding timestamp to trigger regeneration
    if (updateData.choice_label !== undefined) {
      update.embedding_generated_at = null
    }

    const { data, error } = await supabase
      .from('survey_choices')
      .update(update)
      .eq('id', choiceId)
      .select()
      .single()

    if (error) throw error

    // Queue embedding regeneration if label changed
    if (data && updateData.choice_label !== undefined) {
      await supabase
        .from('embedding_jobs')
        .insert({
          job_type: 'survey_choice',
          target_id: choiceId
        })
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error updating choice:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Delete a choice
 */
export async function deleteChoice(
  choiceId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('survey_choices')
      .delete()
      .eq('id', choiceId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error deleting choice:', error)
    return {
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Get all images for a question
 */
export async function getSurveyImages(
  questionId: string
): Promise<{ data: SurveyImage[] | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('survey_images')
      .select('*')
      .eq('question_id', questionId)
      .order('image_order', { ascending: true })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching survey images:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Create a new survey image (upload + queue embedding)
 */
export async function createSurveyImage(
  questionId: string,
  imageData: CreateSurveyImageData
): Promise<{ data: SurveyImage | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const insertData: SurveyImageInsert = {
      question_id: questionId,
      image_key: imageData.image_key,
      image_label: imageData.image_label,
      image_description: imageData.image_description || null,
      image_url: imageData.image_url,
      image_order: imageData.image_order,
      is_active: imageData.is_active ?? true
    }

    const { data, error } = await supabase
      .from('survey_images')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    // Queue embedding generation for image
    if (data) {
      const embeddingText = imageData.image_description || imageData.image_label
      await supabase
        .from('embedding_jobs')
        .insert({
          job_type: 'survey_image',
          target_id: data.id
        })
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error creating survey image:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Update a survey image
 */
export async function updateSurveyImage(
  imageId: string,
  updateData: UpdateSurveyImageData
): Promise<{ data: SurveyImage | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    const update: SurveyImageUpdate = {}
    if (updateData.image_key !== undefined) update.image_key = updateData.image_key
    if (updateData.image_label !== undefined) update.image_label = updateData.image_label
    if (updateData.image_description !== undefined) update.image_description = updateData.image_description
    if (updateData.image_url !== undefined) update.image_url = updateData.image_url
    if (updateData.image_order !== undefined) update.image_order = updateData.image_order
    if (updateData.is_active !== undefined) update.is_active = updateData.is_active

    // If description/label changed, reset embedding timestamp
    if (updateData.image_description !== undefined || updateData.image_label !== undefined) {
      update.embedding_generated_at = null
    }

    const { data, error } = await supabase
      .from('survey_images')
      .update(update)
      .eq('id', imageId)
      .select()
      .single()

    if (error) throw error

    // Queue embedding regeneration if needed
    if (data && (updateData.image_description !== undefined || updateData.image_label !== undefined)) {
      const embeddingText = updateData.image_description || data.image_label
      await supabase
        .from('embedding_jobs')
        .insert({
          job_type: 'survey_image',
          target_id: imageId
        })
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error updating survey image:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Delete a survey image
 */
export async function deleteSurveyImage(
  imageId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = await createClient()

    // Get image URL for storage deletion
    const { data: image } = await supabase
      .from('survey_images')
      .select('image_url')
      .eq('id', imageId)
      .single()

    // Delete from database
    const { error } = await supabase
      .from('survey_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error

    // Optionally delete from storage
    if (image?.image_url) {
      try {
        const url = new URL(image.image_url)
        const filePath = url.pathname.split('/survey-images/')[1]
        if (filePath) {
          await supabase.storage
            .from('survey-images')
            .remove([filePath])
        }
      } catch (storageError) {
        console.warn('Could not delete image from storage:', storageError)
      }
    }

    return { error: null }
  } catch (error) {
    console.error('Error deleting survey image:', error)
    return {
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * Upload image file for survey
 */
export async function uploadSurveyImageFile(
  file: File,
  questionId: string
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const supabase = await createClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `q${questionId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('survey-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('survey-images')
      .getPublicUrl(filePath)

    return { data: publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading survey image:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}
