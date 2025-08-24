'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Inquiry } from '@/types/inquiry.types'

export interface InquiryFilters {
  status: string
  search: string
  sort: string
  sortField?: string
  sortOrder: string
  bookingFrom?: string
  bookingTo?: string
  page: number
}

export const useInquiryManagement = (initialInquiries: Inquiry[] = []) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // State management
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries)
  const [loading, setLoading] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  // Parse current filters from URL
  const currentFilters: InquiryFilters = useMemo(() => ({
    status: searchParams.get('status') || 'all',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
    sortField: searchParams.get('sortField') || undefined,
    sortOrder: searchParams.get('sortOrder') || 'desc',
    bookingFrom: searchParams.get('bookingFrom') || undefined,
    bookingTo: searchParams.get('bookingTo') || undefined,
    page: Number.parseInt(searchParams.get('page') || '1')
  }), [searchParams])

  // Update URL params
  const updateFilters = useCallback((newFilters: Partial<InquiryFilters>) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    
    // Reset to page 1 when filters change (except for page changes)
    if (!('page' in newFilters)) {
      params.delete('page')
    }
    
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  // Status update
  const updateInquiryStatus = useCallback(async (id: string, newStatus: "new" | "contacted" | "completed") => {
    setUpdatingIds(prev => new Set(prev).add(id))
    
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      // Update local state
      setInquiries(prev => 
        prev.map(inquiry => 
          inquiry.id === id ? { ...inquiry, status: newStatus } : inquiry
        )
      )

      return { success: true }
    } catch (error) {
      console.error('Error updating inquiry status:', error)
      return { error: 'Failed to update status' }
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }, [supabase])

  // Delete inquiry
  const deleteInquiry = useCallback(async (id: string) => {
    setUpdatingIds(prev => new Set(prev).add(id))
    
    try {
      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remove from local state
      setInquiries(prev => prev.filter(inquiry => inquiry.id !== id))

      return { success: true }
    } catch (error) {
      console.error('Error deleting inquiry:', error)
      return { error: 'Failed to delete inquiry' }
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }, [supabase])

  // Bulk status update
  const updateMultipleInquiryStatuses = useCallback(async (ids: string[], newStatus: "new" | "contacted" | "completed") => {
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus })
        .in('id', ids)

      if (error) throw error

      // Update local state
      setInquiries(prev => 
        prev.map(inquiry => 
          ids.includes(inquiry.id) ? { ...inquiry, status: newStatus } : inquiry
        )
      )

      return { success: true }
    } catch (error) {
      console.error('Error updating multiple inquiries:', error)
      return { error: 'Failed to update inquiries' }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Search functionality
  const searchInquiries = useCallback((searchTerm: string) => {
    updateFilters({ search: searchTerm, page: 1 })
  }, [updateFilters])

  // Sorting functionality  
  const sortInquiries = useCallback((field: string) => {
    const currentSort = currentFilters.sortField
    const currentOrder = currentFilters.sortOrder
    
    if (currentSort === field) {
      // Toggle order
      updateFilters({ sortOrder: currentOrder === 'desc' ? 'asc' : 'desc' })
    } else {
      // New field, default to desc
      updateFilters({ sortField: field, sortOrder: 'desc' })
    }
  }, [currentFilters, updateFilters])

  // Filtering by status
  const filterByStatus = useCallback((status: string) => {
    updateFilters({ status, page: 1 })
  }, [updateFilters])

  // Date range filtering
  const filterByDateRange = useCallback((bookingFrom?: string, bookingTo?: string) => {
    updateFilters({ bookingFrom, bookingTo, page: 1 })
  }, [updateFilters])

  // Pagination
  const goToPage = useCallback((page: number) => {
    updateFilters({ page })
  }, [updateFilters])

  // Client-side sorting for complex fields like booking_date
  const sortedInquiries = useMemo(() => {
    if (currentFilters.sortField !== 'booking_date') {
      return inquiries
    }
    
    return [...inquiries].sort((a, b) => {
      const aDate = a.selected_slot_id?.date
      const bDate = b.selected_slot_id?.date
      
      // Handle null values - put them at the end
      if (!aDate && !bDate) return 0
      if (!aDate) return 1
      if (!bDate) return -1
      
      const comparison = new Date(aDate).getTime() - new Date(bDate).getTime()
      return currentFilters.sortOrder === 'asc' ? comparison : -comparison
    })
  }, [inquiries, currentFilters.sortField, currentFilters.sortOrder])

  // Utility function to check if an inquiry is being updated
  const isUpdating = useCallback((id: string) => {
    return updatingIds.has(id)
  }, [updatingIds])

  return {
    // State
    inquiries: sortedInquiries,
    loading,
    currentFilters,
    
    // Actions
    updateInquiryStatus,
    deleteInquiry,
    updateMultipleInquiryStatuses,
    searchInquiries,
    sortInquiries,
    filterByStatus,
    filterByDateRange,
    goToPage,
    
    // Utilities
    isUpdating,
    updateFilters
  }
}