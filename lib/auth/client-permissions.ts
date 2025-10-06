// lib/auth/client-permissions.ts
'use client'

import type { UserCookie } from './cookie'

export type UserType = 'admin' | 'photographer' | 'user' | null

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

/**
 * Get user permissions from UserCookie (client-side)
 */
export function getUserPermissions(user: UserCookie | null): UserPermissions {
  if (!user) {
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

  const isAdmin = user.role === 'admin'
  const isPhotographer = user.role === 'photographer'

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

  // Regular user
  return {
    userType: 'user',
    canAccessUsers: false,
    canAccessPhotos: false,
    canAccessCategories: false,
    canAccessInquiries: false,
    canAccessSchedule: false,
    canAccessAnalytics: false,
    canAccessMyPage: true,
    canAccessReviews: false,
    canAccessPersonalityMapping: false,
  }
}
