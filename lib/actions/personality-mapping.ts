'use server'

import { createClient } from '@/lib/supabase/server'

export interface PersonalityType {
  code: string
  name: string
  description: string
  style_keywords: string[]
  ai_preview_prompt: string
  example_person?: string
  recommended_locations?: string[]
  recommended_props?: string[]
}

export interface PersonalityMapping {
  id: string
  admin_id: string
  admin_name: string
  personality_type_code: string
  compatibility_score: number
  is_primary: boolean
  notes?: string
  created_at: string
  updated_at: string
}

// 모든 성격유형 조회
export async function getPersonalityTypes(): Promise<{
  success: boolean
  personalityTypes?: PersonalityType[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data: personalityTypes, error } = await supabase
      .from('personality_types')
      .select('*')
      .order('code')
    
    if (error) {
      return { success: false, error: error.message }
    }

    // Transform database results to match interface
    const transformedTypes: PersonalityType[] = (personalityTypes || []).map(type => ({
      code: type.code,
      name: type.name,
      description: type.description,
      style_keywords: type.style_keywords || [],
      ai_preview_prompt: type.ai_preview_prompt || '',
      example_person: type.example_person || undefined,
      recommended_locations: type.recommended_locations || undefined,
      recommended_props: type.recommended_props || undefined
    }))

    return {
      success: true,
      personalityTypes: transformedTypes
    }
  } catch (error) {
    console.error('Error fetching personality types:', error)
    return {
      success: false,
      error: 'Failed to fetch personality types'
    }
  }
}

// 모든 관리자의 성격유형 매칭 조회
export async function getAdminPersonalityMappings(): Promise<{
  success: boolean
  mappings?: PersonalityMapping[]
  error?: string
}> {
  try {
    // TODO: personality_admin_mapping 테이블 생성 후 활성화
    return { success: true, mappings: [] }
    
    // const supabase = await createClient()
    
    // const { data: mappings, error } = await supabase
    //   .from('personality_admin_mapping')
    //   .select(`
    //     *,
    //     admin:photographers(name)
    //   `)
    //   .order('admin_id')
    
    // if (error) {
    //   return { success: false, error: error.message }
    // }

    // const formattedMappings: PersonalityMapping[] = (mappings || []).map(mapping => ({
    //   id: mapping.id,
    //   admin_id: mapping.admin_id,
    //   admin_name: mapping.admin?.name || 'Unknown',
    //   personality_type_code: mapping.personality_type_code,
    //   compatibility_score: mapping.compatibility_score,
    //   is_primary: mapping.is_primary,
    //   notes: mapping.notes,
    //   created_at: mapping.created_at,
    //   updated_at: mapping.updated_at
    // }))

    // return {
    //   success: true,
    //   mappings: formattedMappings
    // }
  } catch (error) {
    console.error('Error fetching admin personality mappings:', error)
    return {
      success: false,
      error: 'Failed to fetch personality mappings'
    }
  }
}

// 특정 관리자의 성격유형 매칭 조회
export async function getAdminPersonalityMapping(adminId: string): Promise<{
  success: boolean
  mappings?: PersonalityMapping[]
  error?: string
}> {
  try {
    // TODO: personality_admin_mapping 테이블 생성 후 활성화
    return { success: true, mappings: [] }

    // const supabase = await createClient()
    
    // const { data: mappings, error } = await supabase
    //   .from('personality_admin_mapping')
    //   .select(`
    //     *,
    //     admin:photographers(name)
    //   `)
    //   .eq('admin_id', adminId)
    //   .order('personality_type_code')
    
    // if (error) {
    //   return { success: false, error: error.message }
    // }

    // const formattedMappings: PersonalityMapping[] = (mappings || []).map(mapping => ({
    //   id: mapping.id,
    //   admin_id: mapping.admin_id,
    //   admin_name: mapping.admin?.name || 'Unknown',
    //   personality_type_code: mapping.personality_type_code,
    //   compatibility_score: mapping.compatibility_score,
    //   is_primary: mapping.is_primary,
    //   notes: mapping.notes,
    //   created_at: mapping.created_at,
    //   updated_at: mapping.updated_at
    // }))

    // return {
    //   success: true,
    //   mappings: formattedMappings
    // }
  } catch (error) {
    console.error('Error fetching admin personality mapping:', error)
    return {
      success: false,
      error: 'Failed to fetch personality mapping'
    }
  }
}

// 성격유형 매칭 생성
export async function createPersonalityMapping(mapping: {
  admin_id: string
  personality_type_code: string
  compatibility_score: number
  is_primary: boolean
  notes?: string
}): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // TODO: personality_admin_mapping 테이블 생성 후 활성화
    return { success: true }

    // const supabase = await createClient()
    
    // // 중복 매칭 확인
    // const { data: existing } = await supabase
    //   .from('personality_admin_mapping')
    //   .select('id')
    //   .eq('admin_id', mapping.admin_id)
    //   .eq('personality_type_code', mapping.personality_type_code)
    //   .single()

    // if (existing) {
    //   return { success: false, error: '이미 설정된 성격유형입니다.' }
    // }

    // const { error } = await supabase
    //   .from('personality_admin_mapping')
    //   .insert({
    //     admin_id: mapping.admin_id,
    //     personality_type_code: mapping.personality_type_code,
    //     compatibility_score: mapping.compatibility_score,
    //     is_primary: mapping.is_primary,
    //     notes: mapping.notes
    //   })
    
    // if (error) {
    //   return { success: false, error: error.message }
    // }

    // return { success: true }
  } catch (error) {
    console.error('Error creating personality mapping:', error)
    return {
      success: false,
      error: 'Failed to create personality mapping'
    }
  }
}

// 성격유형 매칭 업데이트
export async function updatePersonalityMapping(mappingId: string, updates: {
  compatibility_score?: number
  is_primary?: boolean
  notes?: string
}): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // TODO: personality_admin_mapping 테이블 생성 후 활성화
    return { success: true }

    // const supabase = await createClient()
    
    // const { error } = await supabase
    //   .from('personality_admin_mapping')
    //   .update({
    //     ...updates,
    //     updated_at: new Date().toISOString()
    //   })
    //   .eq('id', mappingId)
    
    // if (error) {
    //   return { success: false, error: error.message }
    // }

    // return { success: true }
  } catch (error) {
    console.error('Error updating personality mapping:', error)
    return {
      success: false,
      error: 'Failed to update personality mapping'
    }
  }
}

// 성격유형 매칭 삭제
export async function deletePersonalityMapping(mappingId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // TODO: personality_admin_mapping 테이블 생성 후 활성화
    return { success: true }

    // const supabase = await createClient()
    
    // const { error } = await supabase
    //   .from('personality_admin_mapping')
    //   .delete()
    //   .eq('id', mappingId)
    
    // if (error) {
    //   return { success: false, error: error.message }
    // }

    // return { success: true }
  } catch (error) {
    console.error('Error deleting personality mapping:', error)
    return {
      success: false,
      error: 'Failed to delete personality mapping'
    }
  }
}

// 성격유형별 추천 작가 조회 (고객용)
export async function getRecommendedAdminsForPersonality(personalityTypeCode: string): Promise<{
  success: boolean
  admins?: {
    id: string
    name: string
    email: string
    compatibility_score: number
    is_primary: boolean
    notes?: string
  }[]
  error?: string
}> {
  try {
    // TODO: personality_admin_mapping 테이블 생성 후 활성화
    return { success: true, admins: [] }

    // const supabase = await createClient()
    
    // const { data: mappings, error } = await supabase
    //   .from('personality_admin_mapping')
    //   .select(`
    //     *,
    //     admin:photographers(id, name, email)
    //   `)
    //   .eq('personality_type_code', personalityTypeCode)
    //   .gte('compatibility_score', 50) // 최소 50% 이상 호환성
    //   .order('compatibility_score', { ascending: false })
    
    // if (error) {
    //   return { success: false, error: error.message }
    // }

    // const admins = (mappings || []).map(mapping => ({
    //   id: mapping.admin.id,
    //   name: mapping.admin.name,
    //   email: mapping.admin.email,
    //   compatibility_score: mapping.compatibility_score,
    //   is_primary: mapping.is_primary,
    //   notes: mapping.notes
    // }))

    // return {
    //   success: true,
    //   admins
    // }
  } catch (error) {
    console.error('Error fetching recommended admins:', error)
    return {
      success: false,
      error: 'Failed to fetch recommended admins'
    }
  }
}