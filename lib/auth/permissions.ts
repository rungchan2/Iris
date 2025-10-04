'use server'

import { createClient } from '@/lib/supabase/server'

export type UserType = 'admin' | 'photographer' | null

export interface UserPermissions {
  userType: UserType
  canAccessUsers: boolean
  canAccessPhotos: boolean
  canAccessCategories: boolean
  canAccessInquiries: boolean
  canAccessSchedule: boolean
  canAccessAnalytics: boolean
  canAccessMyPage: boolean
  canAccessReviews: boolean
  canAccessPersonalityMapping: boolean
}

export async function getCurrentUserPermissions(): Promise<UserPermissions> {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return {
      userType: null,
      canAccessUsers: false,
      canAccessPhotos: false,
      canAccessCategories: false,
      canAccessInquiries: false,
      canAccessSchedule: false,
      canAccessAnalytics: false,
      canAccessMyPage: false,
      canAccessReviews: false,
      canAccessPersonalityMapping: false,
    }
  }

  // Check if user is admin (stored in auth.users metadata)
  const isAdmin = session.user.user_metadata?.user_type === 'admin'
  
  // Check if user is photographer (exists in photographers table)
  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('id', session.user.id)
    .single()

  const isPhotographer = !!photographer

  // Admin has access to everything
  if (isAdmin) {
    return {
      userType: 'admin',
      canAccessUsers: true,
      canAccessPhotos: true,
      canAccessCategories: true,
      canAccessInquiries: true,
      canAccessSchedule: true,
      canAccessAnalytics: true,
      canAccessMyPage: true,
      canAccessReviews: true,
      canAccessPersonalityMapping: true,
    }
  }

  // Photographer has limited access
  if (isPhotographer) {
    return {
      userType: 'photographer',
      canAccessUsers: false,
      canAccessPhotos: true,
      canAccessCategories: false,
      canAccessInquiries: true,
      canAccessSchedule: true,
      canAccessAnalytics: false,
      canAccessMyPage: true,
      canAccessReviews: true,
      canAccessPersonalityMapping: true,
    }
  }

  // No access if neither admin nor photographer
  return {
    userType: null,
    canAccessUsers: false,
    canAccessPhotos: false,
    canAccessCategories: false,
    canAccessInquiries: false,
    canAccessSchedule: false,
    canAccessAnalytics: false,
    canAccessMyPage: false,
    canAccessReviews: false,
    canAccessPersonalityMapping: false,
  }
}

export async function checkPagePermission(page: string): Promise<boolean> {
  const permissions = await getCurrentUserPermissions()
  
  switch (page) {
    case 'users':
      return permissions.canAccessUsers
    case 'photos':
      return permissions.canAccessPhotos
    case 'category':
      return permissions.canAccessCategories
    case 'inquiries':
    case '': // dashboard
      return permissions.canAccessInquiries
    case 'schedule':
      return permissions.canAccessSchedule
    case 'analytics':
      return permissions.canAccessAnalytics
    case 'my-page':
      return permissions.canAccessMyPage
    case 'reviews':
      return permissions.canAccessReviews
    case 'personality-mapping':
      return permissions.canAccessPersonalityMapping
    default:
      return false
  }
}