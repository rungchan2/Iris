'use server'

import { createClient } from '@/lib/supabase/server'
import { adminLogger } from '@/lib/logger'
import type { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row'] & {
  photographer?: {
    name: string
    email: string
  }
}

type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export interface ProductStats {
  totalProducts: number
  pendingProducts: number
  approvedProducts: number
  rejectedProducts: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get all products with photographer details
 */
export async function getProducts(): Promise<ApiResponse<Product[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        photographer:photographers!products_photographer_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      adminLogger.error('Error fetching products:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as unknown as Product[] }
  } catch (error) {
    adminLogger.error('Unexpected error in getProducts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get approved photographers for product creation
 */
export async function getApprovedPhotographers(): Promise<ApiResponse<Array<{
  id: string
  name: string | null
  email: string | null
  approval_status: string | null
}>>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('photographers')
      .select('id, name, email, approval_status')
      .eq('approval_status', 'approved')
      .order('name')

    if (error) {
      adminLogger.error('Error fetching photographers:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    adminLogger.error('Unexpected error in getApprovedPhotographers:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create a new product
 */
export async function createProduct(productData: ProductInsert): Promise<ApiResponse<Product>> {
  try {
    const supabase = await createClient()

    // Get current user for created_by
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: '로그인이 필요합니다' }
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        created_by: user.id,
      })
      .select(`
        *,
        photographer:photographers!products_photographer_id_fkey(name, email)
      `)
      .single()

    if (error) {
      adminLogger.error('Error creating product:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Product created successfully:', { productId: data.id })
    return { success: true, data: data as unknown as Product }
  } catch (error) {
    adminLogger.error('Unexpected error in createProduct:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  productId: string,
  productData: ProductUpdate
): Promise<ApiResponse<Product>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select(`
        *,
        photographer:photographers!products_photographer_id_fkey(name, email)
      `)
      .single()

    if (error) {
      adminLogger.error('Error updating product:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Product updated successfully:', { productId })
    return { success: true, data: data as unknown as Product }
  } catch (error) {
    adminLogger.error('Unexpected error in updateProduct:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Approve a product
 */
export async function approveProduct(productId: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: '로그인이 필요합니다' }
    }

    const { error } = await supabase
      .from('products')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', productId)

    if (error) {
      adminLogger.error('Error approving product:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Product approved successfully:', { productId, approvedBy: user.id })
    return { success: true }
  } catch (error) {
    adminLogger.error('Unexpected error in approveProduct:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Reject a product with optional notes
 */
export async function rejectProduct(
  productId: string,
  notes?: string
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('products')
      .update({
        status: 'rejected',
        approval_notes: notes || '승인 거부됨',
      })
      .eq('id', productId)

    if (error) {
      adminLogger.error('Error rejecting product:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Product rejected successfully:', { productId })
    return { success: true }
  } catch (error) {
    adminLogger.error('Unexpected error in rejectProduct:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      adminLogger.error('Error deleting product:', error)
      return { success: false, error: error.message }
    }

    adminLogger.info('Product deleted successfully:', { productId })
    return { success: true }
  } catch (error) {
    adminLogger.error('Unexpected error in deleteProduct:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
