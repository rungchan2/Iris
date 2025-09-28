export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      admins: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          id: string
          last_login_at: string | null
          name: string
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          id: string
          last_login_at?: string | null
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          last_login_at?: string | null
          name?: string
          phone?: string | null
          role?: string | null
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
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          depth: number | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          path: string | null
          representative_image_id: string | null
          representative_image_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          depth?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          path?: string | null
          representative_image_id?: string | null
          representative_image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          depth?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          path?: string | null
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
      embedding_jobs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          job_status: string | null
          job_type: string
          processed_at: string | null
          requested_by: string | null
          target_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_status?: string | null
          job_type: string
          processed_at?: string | null
          requested_by?: string | null
          target_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_status?: string | null
          job_type?: string
          processed_at?: string | null
          requested_by?: string | null
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embedding_jobs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          admin_note: string | null
          conversation_preference: string | null
          conversation_topics: string | null
          created_at: string | null
          desired_date: string | null
          difficulty_note: string | null
          favorite_music: string | null
          gender: string | null
          id: string
          instagram_id: string | null
          name: string
          payment_amount: number | null
          payment_deadline: string | null
          payment_id: string | null
          payment_required: boolean | null
          payment_status: string | null
          people_count: number | null
          phone: string
          photographer_id: string | null
          product_id: string | null
          relationship: string | null
          selected_slot_id: string | null
          shooting_meaning: string | null
          special_request: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          conversation_preference?: string | null
          conversation_topics?: string | null
          created_at?: string | null
          desired_date?: string | null
          difficulty_note?: string | null
          favorite_music?: string | null
          gender?: string | null
          id?: string
          instagram_id?: string | null
          name: string
          payment_amount?: number | null
          payment_deadline?: string | null
          payment_id?: string | null
          payment_required?: boolean | null
          payment_status?: string | null
          people_count?: number | null
          phone: string
          photographer_id?: string | null
          product_id?: string | null
          relationship?: string | null
          selected_slot_id?: string | null
          shooting_meaning?: string | null
          special_request?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          conversation_preference?: string | null
          conversation_topics?: string | null
          created_at?: string | null
          desired_date?: string | null
          difficulty_note?: string | null
          favorite_music?: string | null
          gender?: string | null
          id?: string
          instagram_id?: string | null
          name?: string
          payment_amount?: number | null
          payment_deadline?: string | null
          payment_id?: string | null
          payment_required?: boolean | null
          payment_status?: string | null
          people_count?: number | null
          phone?: string
          photographer_id?: string | null
          product_id?: string | null
          relationship?: string | null
          selected_slot_id?: string | null
          shooting_meaning?: string | null
          special_request?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_selected_slot_id_fkey"
            columns: ["selected_slot_id"]
            isOneToOne: false
            referencedRelation: "available_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_performance_logs: {
        Row: {
          algorithm_version: string | null
          created_at: string | null
          embedding_calculation_ms: number | null
          id: string
          session_id: string
          total_candidates: number | null
          total_processing_ms: number | null
          weight_config_used: Json | null
        }
        Insert: {
          algorithm_version?: string | null
          created_at?: string | null
          embedding_calculation_ms?: number | null
          id?: string
          session_id: string
          total_candidates?: number | null
          total_processing_ms?: number | null
          weight_config_used?: Json | null
        }
        Update: {
          algorithm_version?: string | null
          created_at?: string | null
          embedding_calculation_ms?: number | null
          id?: string
          session_id?: string
          total_candidates?: number | null
          total_processing_ms?: number | null
          weight_config_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "matching_performance_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "matching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_results: {
        Row: {
          clicked_at: string | null
          communication_psychology_score: number
          companion_score: number
          contacted_at: string | null
          created_at: string | null
          id: string
          keyword_bonus: number | null
          photographer_id: string
          purpose_story_score: number
          rank_position: number
          session_id: string
          style_emotion_score: number
          total_score: number
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          clicked_at?: string | null
          communication_psychology_score: number
          companion_score: number
          contacted_at?: string | null
          created_at?: string | null
          id?: string
          keyword_bonus?: number | null
          photographer_id: string
          purpose_story_score: number
          rank_position: number
          session_id: string
          style_emotion_score: number
          total_score: number
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          clicked_at?: string | null
          communication_psychology_score?: number
          companion_score?: number
          contacted_at?: string | null
          created_at?: string | null
          id?: string
          keyword_bonus?: number | null
          photographer_id?: string
          purpose_story_score?: number
          rank_position?: number
          session_id?: string
          style_emotion_score?: number
          total_score?: number
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matching_results_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "matching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          final_user_embedding: string | null
          id: string
          ip_address: unknown | null
          responses: Json
          session_token: string
          subjective_embedding: string | null
          subjective_text: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          final_user_embedding?: string | null
          id?: string
          ip_address?: unknown | null
          responses: Json
          session_token: string
          subjective_embedding?: string | null
          subjective_text?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          final_user_embedding?: string | null
          id?: string
          ip_address?: unknown | null
          responses?: Json
          session_token?: string
          subjective_embedding?: string | null
          subjective_text?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matching_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_data: Json | null
          event_type: string
          http_status_code: number | null
          id: string
          ip_address: unknown | null
          payment_id: string | null
          provider: string
          referer: string | null
          response_time_ms: number | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type: string
          http_status_code?: number | null
          id?: string
          ip_address?: unknown | null
          payment_id?: string | null
          provider?: string
          referer?: string | null
          response_time_ms?: number | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type?: string
          http_status_code?: number | null
          id?: string
          ip_address?: unknown | null
          payment_id?: string | null
          provider?: string
          referer?: string | null
          response_time_ms?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_memo: string | null
          amount: number
          bank_info: Json | null
          buyer_email: string | null
          buyer_name: string | null
          buyer_tel: string | null
          cancelled_at: string | null
          card_info: Json | null
          created_at: string | null
          currency: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          inquiry_id: string | null
          order_id: string
          paid_at: string | null
          payment_method: string | null
          photographer_id: string | null
          product_id: string | null
          product_options: Json | null
          provider: string
          provider_transaction_id: string | null
          raw_response: Json | null
          receipt_url: string | null
          status: string
          total_price: number | null
          updated_at: string | null
          user_id: string | null
          wallet_info: Json | null
        }
        Insert: {
          admin_memo?: string | null
          amount: number
          bank_info?: Json | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_tel?: string | null
          cancelled_at?: string | null
          card_info?: Json | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          inquiry_id?: string | null
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          photographer_id?: string | null
          product_id?: string | null
          product_options?: Json | null
          provider?: string
          provider_transaction_id?: string | null
          raw_response?: Json | null
          receipt_url?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string | null
          user_id?: string | null
          wallet_info?: Json | null
        }
        Update: {
          admin_memo?: string | null
          amount?: number
          bank_info?: Json | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_tel?: string | null
          cancelled_at?: string | null
          card_info?: Json | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          inquiry_id?: string | null
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          photographer_id?: string | null
          product_id?: string | null
          product_options?: Json | null
          provider?: string
          provider_transaction_id?: string | null
          raw_response?: Json | null
          receipt_url?: string | null
          status?: string
          total_price?: number | null
          updated_at?: string | null
          user_id?: string | null
          wallet_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      photographer_keywords: {
        Row: {
          created_at: string | null
          keyword: string
          photographer_id: string
          portfolio_count: number | null
          proficiency_level: number | null
        }
        Insert: {
          created_at?: string | null
          keyword: string
          photographer_id: string
          portfolio_count?: number | null
          proficiency_level?: number | null
        }
        Update: {
          created_at?: string | null
          keyword?: string
          photographer_id?: string
          portfolio_count?: number | null
          proficiency_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_photographer_keywords_photographer_id"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographer_profiles"
            referencedColumns: ["photographer_id"]
          },
          {
            foreignKeyName: "photographer_keywords_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      photographer_profiles: {
        Row: {
          communication_psychology_description: string | null
          communication_psychology_embedding: string | null
          companion_description: string | null
          companion_embedding: string | null
          companion_types: string[]
          created_at: string | null
          embeddings_generated_at: string | null
          photographer_id: string
          price_max: number
          price_min: number
          profile_completed: boolean | null
          purpose_story_description: string | null
          purpose_story_embedding: string | null
          service_regions: string[]
          style_emotion_description: string | null
          style_emotion_embedding: string | null
          updated_at: string | null
        }
        Insert: {
          communication_psychology_description?: string | null
          communication_psychology_embedding?: string | null
          companion_description?: string | null
          companion_embedding?: string | null
          companion_types?: string[]
          created_at?: string | null
          embeddings_generated_at?: string | null
          photographer_id: string
          price_max?: number
          price_min?: number
          profile_completed?: boolean | null
          purpose_story_description?: string | null
          purpose_story_embedding?: string | null
          service_regions?: string[]
          style_emotion_description?: string | null
          style_emotion_embedding?: string | null
          updated_at?: string | null
        }
        Update: {
          communication_psychology_description?: string | null
          communication_psychology_embedding?: string | null
          companion_description?: string | null
          companion_embedding?: string | null
          companion_types?: string[]
          created_at?: string | null
          embeddings_generated_at?: string | null
          photographer_id?: string
          price_max?: number
          price_min?: number
          profile_completed?: boolean | null
          purpose_story_description?: string | null
          purpose_story_embedding?: string | null
          service_regions?: string[]
          style_emotion_description?: string | null
          style_emotion_embedding?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photographer_profiles_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: true
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      photographers: {
        Row: {
          account_holder: string | null
          age_range: string | null
          application_status: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          bank_account: string | null
          bank_name: string | null
          bio: string | null
          birth_year: number | null
          created_at: string | null
          directing_style: string | null
          email: string | null
          equipment_info: string | null
          gender: string | null
          id: string
          instagram_handle: string | null
          name: string | null
          personality_type: string | null
          phone: string | null
          photography_approach: string | null
          portfolio_submitted_at: string | null
          price_description: string | null
          price_range_max: number | null
          price_range_min: number | null
          profile_completed: boolean | null
          profile_image_url: string | null
          rejection_reason: string | null
          settlement_day: number | null
          settlement_ratio: number | null
          specialties: string[] | null
          studio_location: string | null
          tax_rate: number | null
          updated_at: string | null
          website_url: string | null
          years_experience: number | null
          youtube_intro_url: string | null
        }
        Insert: {
          account_holder?: string | null
          age_range?: string | null
          application_status?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account?: string | null
          bank_name?: string | null
          bio?: string | null
          birth_year?: number | null
          created_at?: string | null
          directing_style?: string | null
          email?: string | null
          equipment_info?: string | null
          gender?: string | null
          id: string
          instagram_handle?: string | null
          name?: string | null
          personality_type?: string | null
          phone?: string | null
          photography_approach?: string | null
          portfolio_submitted_at?: string | null
          price_description?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          profile_completed?: boolean | null
          profile_image_url?: string | null
          rejection_reason?: string | null
          settlement_day?: number | null
          settlement_ratio?: number | null
          specialties?: string[] | null
          studio_location?: string | null
          tax_rate?: number | null
          updated_at?: string | null
          website_url?: string | null
          years_experience?: number | null
          youtube_intro_url?: string | null
        }
        Update: {
          account_holder?: string | null
          age_range?: string | null
          application_status?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account?: string | null
          bank_name?: string | null
          bio?: string | null
          birth_year?: number | null
          created_at?: string | null
          directing_style?: string | null
          email?: string | null
          equipment_info?: string | null
          gender?: string | null
          id?: string
          instagram_handle?: string | null
          name?: string | null
          personality_type?: string | null
          phone?: string | null
          photography_approach?: string | null
          portfolio_submitted_at?: string | null
          price_description?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          profile_completed?: boolean | null
          profile_image_url?: string | null
          rejection_reason?: string | null
          settlement_day?: number | null
          settlement_ratio?: number | null
          specialties?: string[] | null
          studio_location?: string | null
          tax_rate?: number | null
          updated_at?: string | null
          website_url?: string | null
          years_experience?: number | null
          youtube_intro_url?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          embedding_generated_at: string | null
          filename: string
          height: number | null
          id: string
          image_embedding: string | null
          is_active: boolean | null
          is_public: boolean | null
          is_representative: boolean | null
          size_kb: number | null
          storage_url: string
          style_tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          uploaded_by: string | null
          view_count: number | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          embedding_generated_at?: string | null
          filename: string
          height?: number | null
          id?: string
          image_embedding?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          is_representative?: boolean | null
          size_kb?: number | null
          storage_url: string
          style_tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          view_count?: number | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          embedding_generated_at?: string | null
          filename?: string
          height?: number | null
          id?: string
          image_embedding?: string | null
          is_active?: boolean | null
          is_public?: boolean | null
          is_representative?: boolean | null
          size_kb?: number | null
          storage_url?: string
          style_tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          view_count?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          display_order: number | null
          holiday_surcharge: number | null
          id: string
          includes_makeup: boolean | null
          includes_props: boolean | null
          includes_styling: boolean | null
          is_featured: boolean | null
          location_type: string | null
          max_participants: number | null
          name: string
          photo_count_max: number | null
          photo_count_min: number
          photographer_id: string
          price: number
          product_code: string
          retouched_count: number | null
          shooting_duration: number
          status: string | null
          tags: string[] | null
          updated_at: string | null
          weekend_surcharge: number | null
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          display_order?: number | null
          holiday_surcharge?: number | null
          id?: string
          includes_makeup?: boolean | null
          includes_props?: boolean | null
          includes_styling?: boolean | null
          is_featured?: boolean | null
          location_type?: string | null
          max_participants?: number | null
          name: string
          photo_count_max?: number | null
          photo_count_min: number
          photographer_id: string
          price: number
          product_code: string
          retouched_count?: number | null
          shooting_duration: number
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          weekend_surcharge?: number | null
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          display_order?: number | null
          holiday_surcharge?: number | null
          id?: string
          includes_makeup?: boolean | null
          includes_props?: boolean | null
          includes_styling?: boolean | null
          is_featured?: boolean | null
          location_type?: string | null
          max_participants?: number | null
          name?: string
          photo_count_max?: number | null
          photo_count_min?: number
          photographer_id?: string
          price?: number
          product_code?: string
          retouched_count?: number | null
          shooting_duration?: number
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          weekend_surcharge?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          admin_note: string | null
          created_at: string | null
          id: string
          original_amount: number
          payment_id: string
          processed_at: string | null
          processed_by: string | null
          provider: string
          provider_refund_id: string | null
          reason: string | null
          refund_account: string | null
          refund_amount: number
          refund_bank_code: string | null
          refund_category: string
          refund_holder: string | null
          refund_reason: string
          refund_response: Json | null
          refund_type: string
          remaining_amount: number
          requested_at: string | null
          requested_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string | null
          id?: string
          original_amount: number
          payment_id: string
          processed_at?: string | null
          processed_by?: string | null
          provider?: string
          provider_refund_id?: string | null
          reason?: string | null
          refund_account?: string | null
          refund_amount: number
          refund_bank_code?: string | null
          refund_category: string
          refund_holder?: string | null
          refund_reason: string
          refund_response?: Json | null
          refund_type: string
          remaining_amount: number
          requested_at?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string | null
          id?: string
          original_amount?: number
          payment_id?: string
          processed_at?: string | null
          processed_by?: string | null
          provider?: string
          provider_refund_id?: string | null
          reason?: string | null
          refund_account?: string | null
          refund_amount?: number
          refund_bank_code?: string | null
          refund_category?: string
          refund_holder?: string | null
          refund_reason?: string
          refund_response?: Json | null
          refund_type?: string
          remaining_amount?: number
          requested_at?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          inquiry_id: string | null
          is_anonymous: boolean | null
          is_public: boolean | null
          is_submitted: boolean | null
          photos: string[] | null
          rating: number | null
          review_token: string
          reviewer_name: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          inquiry_id?: string | null
          is_anonymous?: boolean | null
          is_public?: boolean | null
          is_submitted?: boolean | null
          photos?: string[] | null
          rating?: number | null
          review_token?: string
          reviewer_name?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          inquiry_id?: string | null
          is_anonymous?: boolean | null
          is_public?: boolean | null
          is_submitted?: boolean | null
          photos?: string[] | null
          rating?: number | null
          review_token?: string
          reviewer_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_items: {
        Row: {
          created_at: string | null
          id: string
          payment_amount: number
          payment_gateway_fee: number
          payment_id: string
          photographer_id: string
          platform_fee: number
          platform_fee_rate: number
          settled_at: string | null
          settlement_amount: number
          settlement_date: string | null
          status: string
          tax_amount: number
          tax_rate: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_amount: number
          payment_gateway_fee: number
          payment_id: string
          photographer_id: string
          platform_fee: number
          platform_fee_rate: number
          settled_at?: string | null
          settlement_amount: number
          settlement_date?: string | null
          status?: string
          tax_amount: number
          tax_rate: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_amount?: number
          payment_gateway_fee?: number
          payment_id?: string
          photographer_id?: string
          platform_fee?: number
          platform_fee_rate?: number
          settled_at?: string | null
          settlement_amount?: number
          settlement_date?: string | null
          status?: string
          tax_amount?: number
          tax_rate?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlement_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_items_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          admin_note: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          final_settlement_amount: number
          id: string
          payment_count: number
          photographer_id: string
          refund_count: number | null
          settlement_data: Json | null
          settlement_date: string
          settlement_item_count: number
          settlement_period: string
          status: string
          total_gateway_fee: number
          total_payment_amount: number
          total_platform_fee: number
          total_refund_amount: number | null
          total_tax_amount: number
          transfer_account: string | null
          transfer_bank_name: string | null
          transfer_holder: string | null
          transfer_receipt_url: string | null
          transferred_at: string | null
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          final_settlement_amount: number
          id?: string
          payment_count: number
          photographer_id: string
          refund_count?: number | null
          settlement_data?: Json | null
          settlement_date: string
          settlement_item_count: number
          settlement_period: string
          status?: string
          total_gateway_fee: number
          total_payment_amount: number
          total_platform_fee: number
          total_refund_amount?: number | null
          total_tax_amount: number
          transfer_account?: string | null
          transfer_bank_name?: string | null
          transfer_holder?: string | null
          transfer_receipt_url?: string | null
          transferred_at?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          final_settlement_amount?: number
          id?: string
          payment_count?: number
          photographer_id?: string
          refund_count?: number | null
          settlement_data?: Json | null
          settlement_date?: string
          settlement_item_count?: number
          settlement_period?: string
          status?: string
          total_gateway_fee?: number
          total_payment_amount?: number
          total_platform_fee?: number
          total_refund_amount?: number | null
          total_tax_amount?: number
          transfer_account?: string | null
          transfer_bank_name?: string | null
          transfer_holder?: string | null
          transfer_receipt_url?: string | null
          transferred_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlements_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_choices: {
        Row: {
          choice_description: string | null
          choice_embedding: string | null
          choice_key: string
          choice_label: string
          choice_order: number
          created_at: string | null
          embedding_generated_at: string | null
          id: string
          is_active: boolean | null
          question_id: string
          updated_at: string | null
        }
        Insert: {
          choice_description?: string | null
          choice_embedding?: string | null
          choice_key: string
          choice_label: string
          choice_order: number
          created_at?: string | null
          embedding_generated_at?: string | null
          id?: string
          is_active?: boolean | null
          question_id: string
          updated_at?: string | null
        }
        Update: {
          choice_description?: string | null
          choice_embedding?: string | null
          choice_key?: string
          choice_label?: string
          choice_order?: number
          created_at?: string | null
          embedding_generated_at?: string | null
          id?: string
          is_active?: boolean | null
          question_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_images: {
        Row: {
          created_at: string | null
          embedding_generated_at: string | null
          id: string
          image_description: string | null
          image_embedding: string | null
          image_key: string
          image_label: string
          image_order: number
          image_url: string
          is_active: boolean | null
          question_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          embedding_generated_at?: string | null
          id?: string
          image_description?: string | null
          image_embedding?: string | null
          image_key: string
          image_label: string
          image_order: number
          image_url: string
          is_active?: boolean | null
          question_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          embedding_generated_at?: string | null
          id?: string
          image_description?: string | null
          image_embedding?: string | null
          image_key?: string
          image_label?: string
          image_order?: number
          image_url?: string
          is_active?: boolean | null
          question_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_images_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          base_weight: number
          created_at: string | null
          id: string
          is_active: boolean | null
          is_hard_filter: boolean | null
          question_description: string | null
          question_key: string
          question_order: number
          question_title: string
          question_type: string
          updated_at: string | null
          weight_category: string | null
        }
        Insert: {
          base_weight: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_hard_filter?: boolean | null
          question_description?: string | null
          question_key: string
          question_order: number
          question_title: string
          question_type: string
          updated_at?: string | null
          weight_category?: string | null
        }
        Update: {
          base_weight?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_hard_filter?: boolean | null
          question_description?: string | null
          question_key?: string
          question_order?: number
          question_title?: string
          question_type?: string
          updated_at?: string | null
          weight_category?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          setting_description: string | null
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          setting_description?: string | null
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          setting_description?: string | null
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          created_at: string | null
          feedback_text: string | null
          feedback_type: string
          id: string
          photographer_id: string | null
          rating: number | null
          session_id: string
          was_booked: boolean | null
          was_contacted: boolean | null
          would_recommend: boolean | null
        }
        Insert: {
          created_at?: string | null
          feedback_text?: string | null
          feedback_type: string
          id?: string
          photographer_id?: string | null
          rating?: number | null
          session_id: string
          was_booked?: boolean | null
          was_contacted?: boolean | null
          would_recommend?: boolean | null
        }
        Update: {
          created_at?: string | null
          feedback_text?: string | null
          feedback_type?: string
          id?: string
          photographer_id?: string | null
          rating?: number | null
          session_id?: string
          was_booked?: boolean | null
          was_contacted?: boolean | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "matching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          birth_year: number | null
          created_at: string | null
          email: string
          gender: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_booking_at: string | null
          last_login_at: string | null
          marketing_consent: boolean | null
          name: string
          notification_consent: boolean | null
          phone: string | null
          preferred_language: string | null
          profile_image_url: string | null
          total_bookings: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          birth_year?: number | null
          created_at?: string | null
          email: string
          gender?: string | null
          id: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_booking_at?: string | null
          last_login_at?: string | null
          marketing_consent?: boolean | null
          name: string
          notification_consent?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          profile_image_url?: string | null
          total_bookings?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          birth_year?: number | null
          created_at?: string | null
          email?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_booking_at?: string | null
          last_login_at?: string | null
          marketing_consent?: boolean | null
          name?: string
          notification_consent?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          profile_image_url?: string | null
          total_bookings?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      cancel_reservation: {
        Args: { p_inquiry_id: string }
        Returns: boolean
      }
      get_available_slots: {
        Args: {
          p_admin_id?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          admin_id: string
          end_time: string
          is_available: boolean
          slot_date: string
          slot_id: string
          start_time: string
        }[]
      }
      get_payment_summary: {
        Args: { photographer_uuid?: string }
        Returns: {
          cancelled_count: number
          failed_count: number
          paid_amount: number
          paid_count: number
          pending_count: number
          refunded_count: number
          total_amount: number
          total_count: number
        }[]
      }
      get_reserved_slots: {
        Args: {
          p_admin_id?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          admin_id: string
          customer_name: string
          end_time: string
          inquiry_id: string
          inquiry_status: string
          slot_date: string
          slot_id: string
          start_time: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_slot_available: {
        Args: { p_slot_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      reserve_slot: {
        Args: { p_inquiry_id: string; p_slot_id: string }
        Returns: boolean
      }
      save_matching_results: {
        Args: { session_id_param: string }
        Returns: {
          message: string
          results_count: number
          success: boolean
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
