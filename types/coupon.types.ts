import type { Tables, TablesInsert, TablesUpdate } from './database.types'

// ============================================================================
// Coupon Types
// ============================================================================

export type CouponDB = Tables<'coupons'>
export type CouponInsert = TablesInsert<'coupons'>
export type CouponUpdate = TablesUpdate<'coupons'>

export type CouponTemplateDB = Tables<'coupon_templates'>
export type CouponTemplateInsert = TablesInsert<'coupon_templates'>
export type CouponTemplateUpdate = TablesUpdate<'coupon_templates'>

// Coupon with template details
export interface CouponWithTemplate extends CouponDB {
  template: CouponTemplateDB | null
}

// ============================================================================
// Coupon Filters & Stats
// ============================================================================

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
