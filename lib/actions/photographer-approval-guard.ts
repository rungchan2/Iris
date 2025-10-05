'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * 승인된 작가인지 확인하고, 승인되지 않은 경우 승인 상태 페이지로 리디렉트
 */
export async function requireApprovedPhotographer() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Get photographer data
  const { data: photographer, error } = await supabase
    .from('photographers')
    .select('id, approval_status, name, email')
    .eq('id', authUser.id)
    .single()

  if (error || !photographer) {
    // User is not a photographer
    const userType = authUser.user_metadata?.user_type
    if (userType === 'admin') {
      redirect('/admin')
    } else {
      redirect('/login')
    }
  }

  // Check if photographer is approved
  if (photographer.approval_status !== 'approved') {
    redirect('/photographer/approval-status')
  }

  return photographer
}