import type { Tables, TablesInsert, TablesUpdate } from './database.types'

// ============================================================================
// Product Types
// ============================================================================

export type ProductDB = Tables<'products'>
export type ProductInsert = TablesInsert<'products'>
export type ProductUpdate = TablesUpdate<'products'>

// Product with photographer details (for list/detail views)
export type Product = ProductDB & {
  photographer?: {
    name: string
    email: string
  }
}

// ============================================================================
// Product Stats
// ============================================================================

export interface ProductStats {
  totalProducts: number
  pendingProducts: number
  approvedProducts: number
  rejectedProducts: number
}
