export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      inquiries: {
        Row: {
          id: string
          name: string
          phone: string
          instagram_id: string | null
          gender: "male" | "female" | "other" | null
          desired_date: string | null
          people_count: number
          selected_category_id: string | null
          selection_path: string[] | null
          status: "new" | "contacted" | "completed"
          created_at: string
          special_request: string | null
          admin_notes: string | null
        }
        Insert: {
          id?: string
          name: string
          phone: string
          instagram_id?: string | null
          gender?: "male" | "female" | "other" | null
          desired_date?: string | null
          people_count: number
          selected_category_id?: string | null
          selection_path?: string[] | null
          status?: "new" | "contacted" | "completed"
          created_at?: string
          special_request?: string | null
          admin_notes?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          instagram_id?: string | null
          gender?: "male" | "female" | "other" | null
          desired_date?: string | null
          people_count?: number
          selected_category_id?: string | null
          selection_path?: string[] | null
          status?: "new" | "contacted" | "completed"
          created_at?: string
          special_request?: string | null
          admin_notes?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          parent_id: string | null
          name: string
          depth: number
          path: string
          display_order: number
          is_active: boolean
          representative_image_url: string | null
          representative_image_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_id?: string | null
          name: string
          depth: number
          path: string
          display_order: number
          is_active?: boolean
          representative_image_url?: string | null
          representative_image_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_id?: string | null
          name?: string
          depth?: number
          path?: string
          display_order?: number
          is_active?: boolean
          representative_image_url?: string | null
          representative_image_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          filename: string
          storage_url: string
          thumbnail_url: string | null
          width: number | null
          height: number | null
          size_kb: number | null
          uploaded_by: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          filename: string
          storage_url: string
          thumbnail_url?: string | null
          width?: number | null
          height?: number | null
          size_kb?: number | null
          uploaded_by?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          filename?: string
          storage_url?: string
          thumbnail_url?: string | null
          width?: number | null
          height?: number | null
          size_kb?: number | null
          uploaded_by?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      photo_categories: {
        Row: {
          id: string
          photo_id: string
          category_id: string
        }
        Insert: {
          id?: string
          photo_id: string
          category_id: string
        }
        Update: {
          id?: string
          photo_id?: string
          category_id?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
