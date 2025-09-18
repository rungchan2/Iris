import { createClient } from '@/lib/supabase/client'
import { 
  SurveyQuestion, 
  MatchingSession, 
  MatchingResult,
  SurveyResponses,
  generateSessionToken,
  MatchingFilters
} from '@/types/matching.types'

// Survey Questions & Choices
export async function getSurveyQuestions() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('survey_questions')
    .select(`
      *,
      survey_choices(*)
    `)
    .eq('is_active', true)
    .order('question_order')
  
  // Fetch images separately for image-type questions
  if (data) {
    const imageQuestions = data.filter((q: any) => q.question_type === 'image_choice')
    
    for (const question of imageQuestions) {
      const { data: images } = await supabase
        .from('survey_images')
        .select('*')
        .eq('question_id', question.id)
        .eq('is_active', true)
        .order('image_order')
      
      ;(question as any).survey_images = images || []
    }
  }
  
  return { data: data as SurveyQuestion[], error }
}

// Create Matching Session with embedding generation
export async function createMatchingSession(
  responses: SurveyResponses,
  subjective_text?: string | null
) {
  const supabase = createClient()
  const sessionToken = generateSessionToken()
  
  // Get user agent and IP (if available)
  const userAgent = typeof window !== 'undefined' ? navigator.userAgent : null
  
  try {
    // Generate embedding for subjective text if provided
    let subjectiveEmbedding = null
    let finalUserEmbedding = null
    
    if (subjective_text && subjective_text.trim()) {
      // Call embedding API for subjective text
      const embeddingResponse = await fetch('/api/admin/matching/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: subjective_text,
          type: 'subjective_text'
        })
      })
      
      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json()
        subjectiveEmbedding = embeddingData.embedding
        finalUserEmbedding = embeddingData.embedding // Use subjective as final for now
      }
    }
    
    // If no subjective text, generate a combined embedding from responses
    if (!finalUserEmbedding) {
      // Create a combined text from responses for embedding
      const combinedText = Object.entries(responses)
        .filter(([key, value]) => value && typeof value === 'string')
        .map(([key, value]) => `${key}: ${value}`)
        .join(' ')
      
      if (combinedText) {
        const embeddingResponse = await fetch('/api/admin/matching/embeddings/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: combinedText,
            type: 'combined_responses'
          })
        })
        
        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json()
          finalUserEmbedding = embeddingData.embedding
        }
      }
    }
    
    const { data, error } = await supabase
      .from('matching_sessions')
      .insert({
        session_token: sessionToken,
        responses,
        subjective_text,
        subjective_embedding: subjectiveEmbedding,
        final_user_embedding: finalUserEmbedding,
        user_agent: userAgent
        // Note: completed_at is set by the matching calculation API
      })
      .select()
      .single()
    
    if (data) {
      // Store session token in localStorage for anonymous users
      if (typeof window !== 'undefined') {
        localStorage.setItem('matching_session_token', sessionToken)
        localStorage.setItem('matching_session_id', data.id)
      }
    }
    
    return { data: data as MatchingSession, error }
  } catch (embeddingError) {
    console.error('Error generating embeddings:', embeddingError)
    
    // Fallback: create session without embeddings
    const { data, error } = await supabase
      .from('matching_sessions')
      .insert({
        session_token: sessionToken,
        responses,
        subjective_text,
        user_agent: userAgent
      })
      .select()
      .single()
    
    if (data) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('matching_session_token', sessionToken)
        localStorage.setItem('matching_session_id', data.id)
      }
    }
    
    return { data: data as MatchingSession, error }
  }
}

// Get Matching Session by Token
export async function getMatchingSessionByToken(token: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('matching_sessions')
    .select('*')
    .eq('session_token', token)
    .single()
  
  return { data: data as MatchingSession | null, error }
}

// Get Matching Results
export async function getMatchingResults(sessionId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('matching_results')
    .select(`
      *,
      photographer:photographers!inner(
        id,
        name,
        email,
        bio,
        price_range_min,
        price_range_max
      )
    `)
    .eq('session_id', sessionId)
    .order('rank_position')
  
  // Fetch photographer profiles with 4D descriptions
  if (data) {
    for (const result of data) {
      const { data: profile } = await supabase
        .from('photographer_profiles')
        .select(`
          *,
          photographer_keywords(*)
        `)
        .eq('photographer_id', result.photographer_id)
        .single()
      
      ;(result as any).photographer_profile = profile
    }
  }
  
  return { data: data as MatchingResult[], error }
}

// Get Filtered Photographers (for hard filtering)
export async function getFilteredPhotographers(filters: MatchingFilters) {
  const supabase = createClient()
  
  let query = supabase
    .from('photographer_profiles')
    .select(`
      *,
      photographer:photographers!inner(
        id,
        name,
        email,
        bio,
        price_range_min,
        price_range_max,
        approval_status
      )
    `)
    .eq('profile_completed', true)
    .eq('photographer.approval_status', 'approved')
  
  // Apply filters
  if (filters.regions && filters.regions.length > 0) {
    query = query.contains('service_regions', filters.regions)
  }
  
  if (filters.price_min !== undefined) {
    query = query.gte('price_max', filters.price_min)
  }
  
  if (filters.price_max !== undefined) {
    query = query.lte('price_min', filters.price_max)
  }
  
  if (filters.companion_types && filters.companion_types.length > 0) {
    query = query.contains('companion_types', filters.companion_types)
  }
  
  const { data, error } = await query
  
  return { data, error }
}

// Track User Interaction
export async function trackMatchingInteraction(
  sessionId: string,
  photographerId: string,
  interactionType: 'viewed' | 'clicked' | 'contacted'
) {
  const supabase = createClient()
  
  const updateData: any = {}
  const timestamp = new Date().toISOString()
  
  switch (interactionType) {
    case 'viewed':
      updateData.viewed_at = timestamp
      break
    case 'clicked':
      updateData.clicked_at = timestamp
      break
    case 'contacted':
      updateData.contacted_at = timestamp
      break
  }
  
  const { error } = await supabase
    .from('matching_results')
    .update(updateData)
    .eq('session_id', sessionId)
    .eq('photographer_id', photographerId)
  
  return { error }
}

// Submit User Feedback
export async function submitMatchingFeedback(
  sessionId: string,
  photographerId: string | null,
  rating: number,
  feedbackText?: string
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_feedback')
    .insert({
      session_id: sessionId,
      photographer_id: photographerId,
      rating,
      feedback_text: feedbackText,
      feedback_type: 'matching_result'
    })
    .select()
    .single()
  
  return { data, error }
}

// Get Photographer Keywords
export async function getPhotographerKeywords(photographerId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('photographer_keywords')
    .select('*')
    .eq('photographer_id', photographerId)
    .order('proficiency_level', { ascending: false })
  
  return { data, error }
}

// Helper: Extract filters from survey responses
export function extractFiltersFromResponses(responses: SurveyResponses): MatchingFilters {
  const filters: MatchingFilters = {}
  
  // Extract region (if exists in responses)
  if (responses.region) {
    filters.regions = Array.isArray(responses.region) 
      ? responses.region as string[]
      : [responses.region as string]
  }
  
  // Extract price range (if exists in responses)
  if (responses.budget) {
    const budget = responses.budget as string
    // Parse budget string to min/max values
    // Example: "100000-300000" -> price_min: 100000, price_max: 300000
    const [min, max] = budget.split('-').map(Number)
    if (min) filters.price_min = min
    if (max) filters.price_max = max
  }
  
  // Extract companion types (Q2)
  if (responses.companion) {
    filters.companion_types = Array.isArray(responses.companion)
      ? responses.companion as string[]
      : [responses.companion as string]
  }
  
  // Extract keywords (Q6)
  if (responses.keywords) {
    filters.keywords = Array.isArray(responses.keywords)
      ? responses.keywords as string[]
      : [responses.keywords as string]
  }
  
  return filters
}