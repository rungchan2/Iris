import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { type, targetId } = await request.json()
    
    if (!type || !targetId) {
      return NextResponse.json(
        { error: 'Type and targetId are required' },
        { status: 400 }
      )
    }
    
    // Validate job type
    const validTypes = ['choice_embedding', 'image_embedding', 'photographer_profile']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid job type' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Check if job already exists and is pending
    const { data: existingJob } = await supabase
      .from('embedding_jobs')
      .select('id')
      .eq('job_type', type)
      .eq('target_id', targetId)
      .eq('job_status', 'pending')
      .single()
    
    if (existingJob) {
      return NextResponse.json({ 
        success: true,
        message: 'Job already queued',
        jobId: existingJob.id
      })
    }
    
    // Create new embedding job
    const { data: job, error } = await supabase
      .from('embedding_jobs')
      .insert({
        job_type: type,
        target_id: targetId,
        job_status: 'pending'
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true,
      message: 'Job queued successfully',
      jobId: job.id
    })
    
  } catch (error) {
    console.error('Error queueing embedding job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}