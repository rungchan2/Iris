'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { PersonalityType } from '@/lib/quiz-data'
import { Json } from '@/types/database.type'

export interface QuizSession {
  id: string
  user_ip: string | null
  user_agent: string | null
  started_at: string | null
  completed_at: string | null
  calculated_personality_code: string | null
  total_score_data: Json | null
  is_completed: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface QuizQuestion {
  id: string
  part: string
  question_text: string
  question_image_url: string | null
  type: string
  display_order: number
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  choices: QuizChoice[]
}

export interface QuizChoice {
  id: string
  question_id: string
  choice_text: string
  choice_image_url: string | null
  display_order: number
  is_active: boolean | null
  created_at: string | null
}

export interface QuizResponse {
  session_id: string
  question_id: string
  choice_id: string
  response_time_ms?: number
}

/**
 * Create a new quiz session
 */
export async function createQuizSession(): Promise<{ success: boolean; session?: QuizSession; error?: string }> {
  try {
    const supabase = await createClient()
    const headersList = await headers()
    
    // Get user IP and User-Agent for tracking
    const userIP = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null
    const userAgent = headersList.get('user-agent') || null
    
    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert({
        user_ip: userIP,
        user_agent: userAgent,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating quiz session:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, session: data }
  } catch (error) {
    console.error('Error creating quiz session:', error)
    return { success: false, error: 'Failed to create quiz session' }
  }
}

/**
 * Get all quiz questions with their choices
 */
export async function getQuizQuestions(): Promise<{ success: boolean; questions?: QuizQuestion[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select(`
        id,
        part,
        question_text,
        question_image_url,
        type,
        display_order,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('display_order')
    
    if (questionsError) {
      return { success: false, error: questionsError.message }
    }
    
    if (!questions || questions.length === 0) {
      return { success: false, error: 'No questions found in database' }
    }
    
    // Get choices for all questions
    const { data: choices, error: choicesError } = await supabase
      .from('quiz_choices')
      .select(`
        id,
        question_id,
        choice_text,
        choice_image_url,
        display_order,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .order('display_order')
    
    if (choicesError) {
      return { success: false, error: choicesError.message }
    }
    
    if (!choices || choices.length === 0) {
      return { success: false, error: 'No choices found in database' }
    }
    
    // Combine questions with their choices
    const questionsWithChoices: QuizQuestion[] = questions.map(question => ({
      ...question,
      choices: choices.filter(choice => choice.question_id === question.id)
    }))
    
    return { success: true, questions: questionsWithChoices }
  } catch (error) {
    console.error('Error fetching quiz questions:', error)
    return { success: false, error: 'Failed to fetch quiz questions' }
  }
}

/**
 * Save a quiz response
 */
export async function saveQuizResponse(
  sessionId: string,
  questionId: string,
  choiceId: string,
  responseTimeMs?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('quiz_responses')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        choice_id: choiceId,
        response_time_ms: responseTimeMs
      }, {
        onConflict: 'session_id,question_id'
      })
    
    if (error) {
      console.error('Error saving quiz response:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error saving quiz response:', error)
    return { success: false, error: 'Failed to save quiz response' }
  }
}

/**
 * Calculate personality type based on responses
 */
export async function calculatePersonalityResult(
  sessionId: string
): Promise<{ success: boolean; personalityType?: PersonalityType; scores?: Record<string, number>; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Get all responses for this session
    const { data: responses, error: responseError } = await supabase
      .from('quiz_responses')
      .select('choice_id')
      .eq('session_id', sessionId)
    
    if (responseError) {
      return { success: false, error: responseError.message }
    }
    
    if (!responses || responses.length === 0) {
      return { success: false, error: 'No responses found for this session' }
    }
    
    // Get choice weights for all selected choices
    const choiceIds = responses.map(r => r.choice_id)
    const { data: weights, error: weightsError } = await supabase
      .from('choice_weights')
      .select('choice_id, personality_code, weight')
      .in('choice_id', choiceIds)
    
    if (weightsError) {
      return { success: false, error: weightsError.message }
    }
    
    // Calculate scores for each personality type
    const scores: Record<string, number> = {}
    
    weights?.forEach(weight => {
      const personalityCode = weight.personality_code
      if (!scores[personalityCode]) {
        scores[personalityCode] = 0
      }
      scores[personalityCode] += weight.weight
    })
    
    // Find the personality type with the highest score
    let maxScore = 0
    let personalityType: PersonalityType = 'A1'
    
    Object.entries(scores).forEach(([code, score]) => {
      if (score > maxScore) {
        maxScore = score
        personalityType = code as PersonalityType
      }
    })
    
    // Update session with results
    const { error: updateError } = await supabase
      .from('quiz_sessions')
      .update({
        calculated_personality_code: personalityType,
        total_score_data: scores,
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
    
    if (updateError) {
      console.error('Error updating session with results:', updateError)
      // Continue anyway, we have the results
    }
    
    return { success: true, personalityType, scores }
  } catch (error) {
    console.error('Error calculating personality result:', error)
    return { success: false, error: 'Failed to calculate personality result' }
  }
}

/**
 * Get quiz session by ID
 */
export async function getQuizSession(sessionId: string): Promise<{ success: boolean; session?: QuizSession; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, session: data }
  } catch (error) {
    console.error('Error fetching quiz session:', error)
    return { success: false, error: 'Failed to fetch quiz session' }
  }
}

/**
 * Get personality type information
 */
export async function getPersonalityType(code: string): Promise<{ success: boolean; personalityType?: any; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('personality_types')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, personalityType: data }
  } catch (error) {
    console.error('Error fetching personality type:', error)
    return { success: false, error: 'Failed to fetch personality type' }
  }
}

/**
 * Get all personality types
 */
export async function getAllPersonalityTypes(): Promise<{ success: boolean; personalityTypes?: any[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('personality_types')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, personalityTypes: data }
  } catch (error) {
    console.error('Error fetching personality types:', error)
    return { success: false, error: 'Failed to fetch personality types' }
  }
}