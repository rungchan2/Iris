'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { adminLogger } from '@/lib/logger'
import { Database } from '@/types/database.types'

type Coupon = Database['public']['Tables']['coupons']['Row']
type CouponInsert = Database['public']['Tables']['coupons']['Insert']
type CouponTemplate = Database['public']['Tables']['coupon_templates']['Row']

export interface CouponWithTemplate extends Coupon {
  template: CouponTemplate | null
}

export interface CouponFilters {
  status?: 'unused' | 'used' | 'expired'
  templateId?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface CouponStats {
  totalIssued: number
  unusedCount: number
  usedCount: number
  expiredCount: number
  totalDiscountValue: number
}

/**
 * Get coupons with filters and pagination
 */
export async function getCoupons(params: {
  page?: number
  limit?: number
  filters?: CouponFilters
} = {}) {
  try {
    const supabase = await createClient()
    const { page = 1, limit = 20, filters = {} } = params

    let query = supabase
      .from('coupons')
      .select(`
        *,
        template:coupon_templates!inner(*)
      `)

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.templateId) {
      query = query.eq('template_id', filters.templateId)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    if (filters.search) {
      query = query.ilike('code', `%${filters.search}%`)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query
      .order('created_at', { ascending: false })
      .range(from, to)

    const { data, error, count } = await query

    if (error) {
      adminLogger.error('Error fetching coupons', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data as CouponWithTemplate[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }
  } catch (error) {
    adminLogger.error('Unexpected error in getCoupons', error)
    return {
      success: false,
      error: 'Failed to fetch coupons',
    }
  }
}

/**
 * Get coupon statistics
 */
export async function getCouponStats(templateId?: string) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('coupons')
      .select(`
        status,
        template:coupon_templates!inner(discount_type, discount_value, max_discount_amount)
      `)

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data, error } = await query

    if (error) {
      adminLogger.error('Error fetching coupon stats', error)
      return {
        success: false,
        error: error.message,
      }
    }

    const stats: CouponStats = {
      totalIssued: data?.length || 0,
      unusedCount: data?.filter(c => c.status === 'unused').length || 0,
      usedCount: data?.filter(c => c.status === 'used').length || 0,
      expiredCount: data?.filter(c => c.status === 'expired').length || 0,
      totalDiscountValue: 0, // TODO: Calculate based on usage
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in getCouponStats', error)
    return {
      success: false,
      error: 'Failed to fetch coupon statistics',
    }
  }
}

/**
 * Get coupon by ID
 */
export async function getCouponById(id: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('coupons')
      .select(`
        *,
        template:coupon_templates!inner(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      adminLogger.error('Error fetching coupon', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data as CouponWithTemplate,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in getCouponById', error)
    return {
      success: false,
      error: 'Failed to fetch coupon',
    }
  }
}

/**
 * Issue new coupon
 */
export async function issueCoupon(data: {
  templateId: string
  userId?: string
  sessionToken?: string
  issuedReason: string
  validDays?: number
}) {
  try {
    const supabase = await createClient()

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('coupon_templates')
      .select('*')
      .eq('id', data.templateId)
      .single()

    if (templateError || !template) {
      adminLogger.error('Template not found', templateError)
      return {
        success: false,
        error: 'Coupon template not found',
      }
    }

    // Generate unique coupon code
    const code = generateCouponCode(template.code_prefix)

    // Calculate valid dates
    const validFrom = new Date()
    const validDays = data.validDays || template.valid_days
    const validUntil = new Date(validFrom)
    validUntil.setDate(validUntil.getDate() + validDays)

    const couponData: CouponInsert = {
      template_id: data.templateId,
      code,
      user_id: data.userId || null,
      session_token: data.sessionToken || null,
      issued_reason: data.issuedReason,
      valid_from: validFrom.toISOString(),
      valid_until: validUntil.toISOString(),
      status: 'unused',
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert(couponData)
      .select()
      .single()

    if (error) {
      adminLogger.error('Error issuing coupon', error)
      return {
        success: false,
        error: error.message,
      }
    }

    adminLogger.info('Coupon issued successfully', { couponId: coupon.id, code })
    revalidatePath('/admin/coupons')

    return {
      success: true,
      data: coupon,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in issueCoupon', error)
    return {
      success: false,
      error: 'Failed to issue coupon',
    }
  }
}

/**
 * Bulk issue coupons
 */
export async function bulkIssueCoupons(data: {
  templateId: string
  count: number
  issuedReason: string
  validDays?: number
}) {
  try {
    const supabase = await createClient()

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('coupon_templates')
      .select('*')
      .eq('id', data.templateId)
      .single()

    if (templateError || !template) {
      adminLogger.error('Template not found', templateError)
      return {
        success: false,
        error: 'Coupon template not found',
      }
    }

    // Generate coupons
    const validFrom = new Date()
    const validDays = data.validDays || template.valid_days
    const validUntil = new Date(validFrom)
    validUntil.setDate(validUntil.getDate() + validDays)

    const coupons: CouponInsert[] = []
    for (let i = 0; i < data.count; i++) {
      coupons.push({
        template_id: data.templateId,
        code: generateCouponCode(template.code_prefix),
        issued_reason: data.issuedReason,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
        status: 'unused',
      })
    }

    const { data: insertedCoupons, error } = await supabase
      .from('coupons')
      .insert(coupons)
      .select()

    if (error) {
      adminLogger.error('Error bulk issuing coupons', error)
      return {
        success: false,
        error: error.message,
      }
    }

    adminLogger.info('Bulk coupons issued successfully', { count: data.count })
    revalidatePath('/admin/coupons')

    return {
      success: true,
      data: insertedCoupons,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in bulkIssueCoupons', error)
    return {
      success: false,
      error: 'Failed to bulk issue coupons',
    }
  }
}

/**
 * Revoke coupon (mark as expired)
 */
export async function revokeCoupon(id: string, reason: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('coupons')
      .update({
        status: 'expired',
        issued_reason: reason,
      })
      .eq('id', id)
      .eq('status', 'unused') // Only revoke unused coupons

    if (error) {
      adminLogger.error('Error revoking coupon', error)
      return {
        success: false,
        error: error.message,
      }
    }

    adminLogger.info('Coupon revoked successfully', { couponId: id })
    revalidatePath('/admin/coupons')

    return {
      success: true,
      message: 'Coupon revoked successfully',
    }
  } catch (error) {
    adminLogger.error('Unexpected error in revokeCoupon', error)
    return {
      success: false,
      error: 'Failed to revoke coupon',
    }
  }
}

/**
 * Get coupon templates (with optional includeInactive flag)
 */
export async function getCouponTemplates(includeInactive = false) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('coupon_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      adminLogger.error('Error fetching coupon templates', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data as CouponTemplate[],
    }
  } catch (error) {
    adminLogger.error('Unexpected error in getCouponTemplates', error)
    return {
      success: false,
      error: 'Failed to fetch coupon templates',
    }
  }
}

/**
 * Get coupon template by ID
 */
export async function getCouponTemplateById(id: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('coupon_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      adminLogger.error('Error fetching coupon template', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data as CouponTemplate,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in getCouponTemplateById', error)
    return {
      success: false,
      error: 'Failed to fetch coupon template',
    }
  }
}

/**
 * Create coupon template
 */
export async function createCouponTemplate(data: {
  codePrefix: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  validDays: number
  minPurchaseAmount?: number
  maxDiscountAmount?: number
  termsDescription?: string
}) {
  try {
    const supabase = await createClient()

    const templateData = {
      code_prefix: data.codePrefix.toUpperCase(),
      discount_type: data.discountType,
      discount_value: data.discountValue,
      valid_days: data.validDays,
      min_purchase_amount: data.minPurchaseAmount || null,
      max_discount_amount: data.maxDiscountAmount || null,
      terms_description: data.termsDescription || null,
      is_active: true,
    }

    const { data: template, error } = await supabase
      .from('coupon_templates')
      .insert(templateData)
      .select()
      .single()

    if (error) {
      adminLogger.error('Error creating coupon template', error)
      return {
        success: false,
        error: error.message,
      }
    }

    adminLogger.info('Coupon template created', { templateId: template.id })
    revalidatePath('/admin/coupon-templates')

    return {
      success: true,
      data: template as CouponTemplate,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in createCouponTemplate', error)
    return {
      success: false,
      error: 'Failed to create coupon template',
    }
  }
}

/**
 * Update coupon template
 */
export async function updateCouponTemplate(
  id: string,
  data: {
    codePrefix?: string
    discountType?: 'percentage' | 'fixed'
    discountValue?: number
    validDays?: number
    minPurchaseAmount?: number
    maxDiscountAmount?: number
    termsDescription?: string
    isActive?: boolean
  }
) {
  try {
    const supabase = await createClient()

    // First check if template exists
    const { data: existingTemplate, error: checkError } = await supabase
      .from('coupon_templates')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingTemplate) {
      adminLogger.error('Template not found for update', { id, error: checkError })
      return {
        success: false,
        error: 'Template not found',
      }
    }

    const updateData: any = {}
    if (data.codePrefix !== undefined) updateData.code_prefix = data.codePrefix.toUpperCase()
    if (data.discountType !== undefined) updateData.discount_type = data.discountType
    if (data.discountValue !== undefined) updateData.discount_value = data.discountValue
    if (data.validDays !== undefined) updateData.valid_days = data.validDays
    if (data.minPurchaseAmount !== undefined) updateData.min_purchase_amount = data.minPurchaseAmount
    if (data.maxDiscountAmount !== undefined) updateData.max_discount_amount = data.maxDiscountAmount
    if (data.termsDescription !== undefined) updateData.terms_description = data.termsDescription
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    adminLogger.info('Updating coupon template', { templateId: id, updateData })

    const { data: template, error } = await supabase
      .from('coupon_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      adminLogger.error('Error updating coupon template', error)
      return {
        success: false,
        error: error.message,
      }
    }

    adminLogger.info('Coupon template updated', { templateId: id })
    revalidatePath('/admin/coupon-templates')

    return {
      success: true,
      data: template as CouponTemplate,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in updateCouponTemplate', error)
    return {
      success: false,
      error: 'Failed to update coupon template',
    }
  }
}

/**
 * Toggle template active status
 */
export async function toggleTemplateStatus(id: string) {
  try {
    const supabase = await createClient()

    // Get current status
    const { data: template } = await supabase
      .from('coupon_templates')
      .select('is_active')
      .eq('id', id)
      .single()

    if (!template) {
      return {
        success: false,
        error: 'Template not found',
      }
    }

    // Toggle status
    const { error } = await supabase
      .from('coupon_templates')
      .update({ is_active: !template.is_active })
      .eq('id', id)

    if (error) {
      adminLogger.error('Error toggling template status', error)
      return {
        success: false,
        error: error.message,
      }
    }

    adminLogger.info('Template status toggled', { templateId: id, newStatus: !template.is_active })
    revalidatePath('/admin/coupon-templates')

    return {
      success: true,
      message: 'Template status updated successfully',
    }
  } catch (error) {
    adminLogger.error('Unexpected error in toggleTemplateStatus', error)
    return {
      success: false,
      error: 'Failed to toggle template status',
    }
  }
}

/**
 * Get template usage statistics
 */
export async function getTemplateUsageStats(templateId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('coupons')
      .select('status')
      .eq('template_id', templateId)

    if (error) {
      adminLogger.error('Error fetching template usage stats', error)
      return {
        success: false,
        error: error.message,
      }
    }

    const stats = {
      totalIssued: data?.length || 0,
      unusedCount: data?.filter(c => c.status === 'unused').length || 0,
      usedCount: data?.filter(c => c.status === 'used').length || 0,
      expiredCount: data?.filter(c => c.status === 'expired').length || 0,
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    adminLogger.error('Unexpected error in getTemplateUsageStats', error)
    return {
      success: false,
      error: 'Failed to fetch template usage statistics',
    }
  }
}

/**
 * Generate unique coupon code
 */
function generateCouponCode(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${timestamp}${random}`
}
