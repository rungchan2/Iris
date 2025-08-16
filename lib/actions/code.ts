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
    email: string
    phone: string
    selected_date: string
    selected_time: string
    status: string
    notes?: string
    admin_notes?: string
    created_at: string
    updated_at: string
    assigned_admin_id?: string
    selected_categories?: string[]
    selected_moods?: string[]
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
        assigned_admin:admin_users(name, email)
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
        email: inquiry.email,
        phone: inquiry.phone,
        selected_date: inquiry.selected_date,
        selected_time: inquiry.selected_time,
        status: inquiry.status,
        notes: inquiry.notes,
        admin_notes: inquiry.admin_notes,
        created_at: inquiry.created_at,
        updated_at: inquiry.updated_at,
        assigned_admin_id: inquiry.assigned_admin_id,
        selected_categories: inquiry.selected_categories,
        selected_moods: inquiry.selected_moods,
        assigned_admin: inquiry.assigned_admin
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