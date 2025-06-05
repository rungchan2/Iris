
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      available_dates: {
        Row: {
          created_at: string | null
          current_bookings: number | null
          date: string
          id: string
          is_available: boolean | null
          max_bookings: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_bookings?: number | null
          date: string
          id?: string
          is_available?: boolean | null
          max_bookings?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_bookings?: number | null
          date?: string
          id?: string
          is_available?: boolean | null
          max_bookings?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      available_slots: {
        Row: {
          admin_id: string | null
          created_at: string | null
          date: string
          duration_minutes: number | null
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          date: string
          duration_minutes?: number | null
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "available_slots_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          depth: number
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          path: string
          representative_image_id: string | null
          representative_image_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          depth: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          path: string
          representative_image_id?: string | null
          representative_image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          depth?: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          path?: string
          representative_image_id?: string | null
          representative_image_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_representative_image_id_fkey"
            columns: ["representative_image_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          admin_note: string | null
          assigned_admin_id: string | null
          created_at: string | null
          current_mood_keywords: string[] | null
          desired_date: string | null
          desired_mood_keywords: string[] | null
          difficulty_note: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          instagram_id: string | null
          name: string
          people_count: number | null
          phone: string
          relationship: string | null
          selected_category_id: string | null
          selected_slot_id: string | null
          selection_history: Json | null
          selection_path: string[] | null
          special_request: string | null
          status: Database["public"]["Enums"]["inquiry_status"] | null
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          assigned_admin_id?: string | null
          created_at?: string | null
          current_mood_keywords?: string[] | null
          desired_date?: string | null
          desired_mood_keywords?: string[] | null
          difficulty_note?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          instagram_id?: string | null
          name: string
          people_count?: number | null
          phone: string
          relationship?: string | null
          selected_category_id?: string | null
          selected_slot_id?: string | null
          selection_history?: Json | null
          selection_path?: string[] | null
          special_request?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"] | null
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          assigned_admin_id?: string | null
          created_at?: string | null
          current_mood_keywords?: string[] | null
          desired_date?: string | null
          desired_mood_keywords?: string[] | null
          difficulty_note?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          instagram_id?: string | null
          name?: string
          people_count?: number | null
          phone?: string
          relationship?: string | null
          selected_category_id?: string | null
          selected_slot_id?: string | null
          selection_history?: Json | null
          selection_path?: string[] | null
          special_request?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_assigned_admin_id_fkey"
            columns: ["assigned_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_selected_category_id_fkey"
            columns: ["selected_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_selected_slot_id_fkey"
            columns: ["selected_slot_id"]
            isOneToOne: false
            referencedRelation: "available_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      photo_categories: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          photo_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          photo_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          photo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_categories_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string | null
          filename: string
          height: number | null
          id: string
          is_active: boolean | null
          size_kb: number | null
          storage_url: string
          thumbnail_url: string | null
          updated_at: string | null
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          filename: string
          height?: number | null
          id?: string
          is_active?: boolean | null
          size_kb?: number | null
          storage_url: string
          thumbnail_url?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          filename?: string
          height?: number | null
          id?: string
          is_active?: boolean | null
          size_kb?: number | null
          storage_url?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_slot: {
        Args: { p_slot_id: string; p_inquiry_id: string }
        Returns: boolean
      }
      cancel_slot_booking: {
        Args: { p_inquiry_id: string }
        Returns: boolean
      }
      get_leaf_categories: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          path: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      gender_type: "male" | "female" | "other"
      inquiry_status: "new" | "contacted" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      gender_type: ["male", "female", "other"],
      inquiry_status: ["new", "contacted", "completed"],
    },
  },
} as const
