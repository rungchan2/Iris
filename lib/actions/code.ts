"use server"

import { createClient } from '@/lib/supabase/server'

export async function validateInvitationCode(inputCode: string): Promise<boolean> {
  const validCode = process.env.INVITATION_CODE;

  if (!validCode || validCode.trim() === '') {
    return false;
  }
  
  // 대소문자를 구분하지 않고 비교
  return inputCode.trim().toUpperCase() === validCode.trim().toUpperCase();
}

// 특정 inquiry 조회
export async function getInquiryById(inquiryId: string): Promise<{
  success: boolean
  inquiry?: {
    id: string
    name: string
    phone: string
    status: string
    admin_notes?: string
    created_at: string
    updated_at: string
    assigned_admin_id?: string
    selected_category_id?: string
    selected_slot_id?: string
    special_request?: string
    gender?: string
    people_count?: number
    relationship?: string
    desired_date?: string
    current_mood_keywords?: string[]
    desired_mood_keywords?: string[]
    assigned_admin?: {
      name: string
      email: string
    }
  }
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // inquiry와 assigned admin 정보를 함께 조회
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select(`
        *,
        assigned_admin:photographers!matched_admin_id(name, email)
      `)
      .eq('id', inquiryId)
      .single()
    
    if (inquiryError) {
      return { success: false, error: inquiryError.message }
    }

    if (!inquiry) {
      return { success: false, error: 'Inquiry not found' }
    }

    return {
      success: true,
      inquiry: {
        id: inquiry.id,
        name: inquiry.name,
        phone: inquiry.phone,
        status: inquiry.status || 'pending',
        admin_notes: inquiry.admin_note || '',
        created_at: inquiry.created_at || new Date().toISOString(),
        updated_at: inquiry.updated_at || new Date().toISOString(),
        assigned_admin_id: inquiry.matched_admin_id || '',
        selected_category_id: inquiry.selected_category_id || '',
        selected_slot_id: inquiry.selected_slot_id || '',
        special_request: inquiry.special_request || '',
        gender: inquiry.gender || 'other',
        people_count: inquiry.people_count || 1,
        relationship: inquiry.relationship || '',
        desired_date: inquiry.desired_date || '',
        current_mood_keywords: inquiry.current_mood_keywords || [],
        desired_mood_keywords: inquiry.desired_mood_keywords || [],
        assigned_admin: inquiry.assigned_admin ? {
          name: inquiry.assigned_admin.name || '',
          email: inquiry.assigned_admin.email || ''
        } : undefined
      }
    }
  } catch (error) {
    console.error('Error fetching inquiry:', error)
    return {
      success: false,
      error: 'Failed to fetch inquiry'
    }
  }
} 