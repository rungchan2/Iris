'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function checkPhotographerApprovalStatus() {
  try {
    const supabase = await createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    
    console.log('Checking photographer approval status for user:', session?.user?.id)
    
    if (!session) {
      console.log('No session found')
      return { error: 'Not authenticated' }
    }

    // Get photographer data including approval status
    const { data: photographer, error } = await supabase
      .from('photographers')
      .select(`
        id,
        name,
        email,
        approval_status,
        approved_at,
        application_status,
        rejection_reason,
        profile_completed
      `)
      .eq('id', session.user.id)
      .single()

    console.log('Photographer query result:', { photographer, error })

    if (error || !photographer) {
      console.log('Photographer not found or error:', error)
      return { error: 'Photographer not found' }
    }

    console.log('Photographer status:', photographer.approval_status)
    return { data: photographer }
  } catch (error) {
    console.error('Error checking photographer approval status:', error)
    return { error: 'Failed to check approval status' }
  }
}

export async function requireApprovedPhotographer() {
  const result = await checkPhotographerApprovalStatus()
  
  if (result.error) {
    redirect('/login')
  }

  const photographer = result.data
  
  if (!photographer) {
    redirect('/login')
  }
  
  if (photographer.approval_status !== 'approved') {
    return {
      photographer,
      needsRedirect: true,
      redirectTo: '/photographer-admin/approval-status'
    }
  }

  return {
    photographer,
    needsRedirect: false
  }
}