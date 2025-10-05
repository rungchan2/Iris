import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getAdminUsers,
  getPhotographerUsers,
  createAdminUser,
  createPhotographerUser,
  deleteUser,
} from '@/lib/actions/user-management'
import type { CreateAdminFormData, CreatePhotographerFormData } from '@/types/user-management.types'

/**
 * Query Keys Factory for User Management
 */
export const userManagementKeys = {
  all: ['user-management'] as const,
  admins: () => [...userManagementKeys.all, 'admins'] as const,
  photographers: () => [...userManagementKeys.all, 'photographers'] as const,
}

/**
 * Hook for fetching admin users
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: userManagementKeys.admins(),
    queryFn: async () => {
      const result = await getAdminUsers()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch admin users')
      }

      return result.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching photographer users
 */
export function usePhotographerUsers() {
  return useQuery({
    queryKey: userManagementKeys.photographers(),
    queryFn: async () => {
      const result = await getPhotographerUsers()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch photographer users')
      }

      return result.data.map((user: any) => ({
        id: user.id,
        email: user.email || '',
        name: user.name || '',
        phone: user.phone,
        website_url: user.photographers?.[0]?.website_url || null,
        instagram_handle: user.photographers?.[0]?.instagram_handle || null,
        bio: user.photographers?.[0]?.bio || null,
        created_at: user.created_at || new Date().toISOString(),
        approval_status: user.photographers?.[0]?.approval_status || 'pending'
      }))
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for creating an admin user
 */
export function useCreateAdminUser(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAdminFormData) => createAdminUser(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: userManagementKeys.admins() })
        toast.success(result.message || '관리자가 생성되었습니다')
        onSuccess?.()
      } else {
        toast.error(result.error || '관리자 생성에 실패했습니다')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || '관리자 생성 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook for creating a photographer user
 */
export function useCreatePhotographerUser(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePhotographerFormData) => createPhotographerUser(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: userManagementKeys.photographers() })
        toast.success(result.message || '작가가 생성되었습니다')
        onSuccess?.()
      } else {
        toast.error(result.error || '작가 생성에 실패했습니다')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || '작가 생성 중 오류가 발생했습니다')
    },
  })
}

/**
 * Hook for deleting a user
 */
export function useDeleteUser(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, userType }: { userId: string; userType: 'admin' | 'photographer' }) =>
      deleteUser(userId, userType),
    onSuccess: (result, variables) => {
      if (result.success) {
        const queryKey =
          variables.userType === 'admin'
            ? userManagementKeys.admins()
            : userManagementKeys.photographers()

        queryClient.invalidateQueries({ queryKey })
        toast.success(result.message || '사용자가 삭제되었습니다')
        onSuccess?.()
      } else {
        toast.error(result.error || '사용자 삭제에 실패했습니다')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || '사용자 삭제 중 오류가 발생했습니다')
    },
  })
}
