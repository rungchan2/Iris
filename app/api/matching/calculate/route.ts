import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('matching_sessions')
      .select('id, responses, final_user_embedding, completed_at')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    // Check if already processed
    if (session.completed_at) {
      // Return existing results
      const { data: existingResults, error: resultsError } = await supabase
        .from('matching_results')
        .select(`
          *,
          photographer:photographers!inner(id, name, email, bio)
        `)
        .eq('session_id', sessionId)
        .order('rank_position')
      
      if (!resultsError && existingResults) {
        return NextResponse.json({ 
          success: true, 
          results: existingResults,
          count: existingResults.length,
          message: 'Using cached results'
        })
      }
    }
    
    // Use the SQL function for matching calculation
    const { data: matchingResults, error: matchingError } = await (supabase as any)
      .rpc('save_matching_results', {
        session_id_param: sessionId
      })
    
    if (matchingError) {
      console.error('Error in matching function:', matchingError)
      return NextResponse.json(
        { error: 'Failed to calculate matching results', details: matchingError.message },
        { status: 500 }
      )
    }
    
    const result = (matchingResults as any)?.[0]
    
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Matching calculation failed' },
        { status: 500 }
      )
    }
    
    // Fetch the actual results for return
    const { data: finalResults, error: fetchError } = await supabase
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
    
    if (fetchError) {
      console.error('Error fetching final results:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch matching results' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      results: finalResults || [],
      count: result.results_count,
      message: 'Matching completed successfully'
    })
    
  } catch (error) {
    console.error('Matching calculation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}