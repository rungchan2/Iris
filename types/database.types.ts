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
  public: {
    Tables: {
      admin_invite_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          notes: string | null
          role: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at: string
          id?: string
          notes?: string | null
          role?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          notes?: string | null
          role?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_invite_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_portfolio_photos: {
        Row: {
          admin_id: string | null
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_public: boolean | null
          is_representative: boolean | null
          photo_url: string
          style_tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order: number
          id?: string
          is_public?: boolean | null
          is_representative?: boolean | null
          photo_url: string
          style_tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_public?: boolean | null
          is_representative?: boolean | null
          photo_url?: string
          style_tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_portfolio_photos_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
        ]
      }
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
      ai_image_generations: {
        Row: {
          api_provider: string
          api_request_payload: Json | null
          api_response_data: Json | null
          created_at: string | null
          error_message: string | null
          generated_image_url: string | null
          generated_prompt: string
          generation_status: string | null
          id: string
          is_shared: boolean | null
          personality_code: string | null
          processing_time_seconds: number | null
          quiz_session_id: string | null
          updated_at: string | null
          user_rating: number | null
          user_uploaded_image_url: string
        }
        Insert: {
          api_provider: string
          api_request_payload?: Json | null
          api_response_data?: Json | null
          created_at?: string | null
          error_message?: string | null
          generated_image_url?: string | null
          generated_prompt: string
          generation_status?: string | null
          id?: string
          is_shared?: boolean | null
          personality_code?: string | null
          processing_time_seconds?: number | null
          quiz_session_id?: string | null
          updated_at?: string | null
          user_rating?: number | null
          user_uploaded_image_url: string
        }
        Update: {
          api_provider?: string
          api_request_payload?: Json | null
          api_response_data?: Json | null
          created_at?: string | null
          error_message?: string | null
          generated_image_url?: string | null
          generated_prompt?: string
          generation_status?: string | null
          id?: string
          is_shared?: boolean | null
          personality_code?: string | null
          processing_time_seconds?: number | null
          quiz_session_id?: string | null
          updated_at?: string | null
          user_rating?: number | null
          user_uploaded_image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_image_generations_personality_code_fkey"
            columns: ["personality_code"]
            isOneToOne: false
            referencedRelation: "personality_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "ai_image_generations_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      choice_weights: {
        Row: {
          choice_id: string | null
          created_at: string | null
          id: string
          personality_code: string | null
          weight: number
        }
        Insert: {
          choice_id?: string | null
          created_at?: string | null
          id?: string
          personality_code?: string | null
          weight: number
        }
        Update: {
          choice_id?: string | null
          created_at?: string | null
          id?: string
          personality_code?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "choice_weights_choice_id_fkey"
            columns: ["choice_id"]
            isOneToOne: false
            referencedRelation: "quiz_choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "choice_weights_personality_code_fkey"
            columns: ["personality_code"]
            isOneToOne: false
            referencedRelation: "personality_types"
            referencedColumns: ["code"]
          },
        ]
      }
      inquiries: {
        Row: {
          admin_note: string | null
          ai_generation_id: string | null
          conversation_preference: string | null
          conversation_topics: string | null
          created_at: string | null
          current_mood_keywords: string[] | null
          desired_date: string | null
          desired_mood_keywords: string[] | null
          difficulty_note: string | null
          favorite_music: string | null
          gender: string | null
          id: string
          instagram_id: string | null
          matched_admin_id: string | null
          name: string
          people_count: number | null
          phone: string
          photographer_id: string | null
          quiz_session_id: string | null
          relationship: string | null
          selected_category_id: string | null
          selected_personality_code: string | null
          selected_slot_id: string | null
          selection_history: Json | null
          selection_path: string[] | null
          shooting_meaning: string | null
          special_request: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          ai_generation_id?: string | null
          conversation_preference?: string | null
          conversation_topics?: string | null
          created_at?: string | null
          current_mood_keywords?: string[] | null
          desired_date?: string | null
          desired_mood_keywords?: string[] | null
          difficulty_note?: string | null
          favorite_music?: string | null
          gender?: string | null
          id?: string
          instagram_id?: string | null
          matched_admin_id?: string | null
          name: string
          people_count?: number | null
          phone: string
          photographer_id?: string | null
          quiz_session_id?: string | null
          relationship?: string | null
          selected_category_id?: string | null
          selected_personality_code?: string | null
          selected_slot_id?: string | null
          selection_history?: Json | null
          selection_path?: string[] | null
          shooting_meaning?: string | null
          special_request?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          ai_generation_id?: string | null
          conversation_preference?: string | null
          conversation_topics?: string | null
          created_at?: string | null
          current_mood_keywords?: string[] | null
          desired_date?: string | null
          desired_mood_keywords?: string[] | null
          difficulty_note?: string | null
          favorite_music?: string | null
          gender?: string | null
          id?: string
          instagram_id?: string | null
          matched_admin_id?: string | null
          name?: string
          people_count?: number | null
          phone?: string
          photographer_id?: string | null
          quiz_session_id?: string | null
          relationship?: string | null
          selected_category_id?: string | null
          selected_personality_code?: string | null
          selected_slot_id?: string | null
          selection_history?: Json | null
          selection_path?: string[] | null
          shooting_meaning?: string | null
          special_request?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_ai_generation_id_fkey"
            columns: ["ai_generation_id"]
            isOneToOne: false
            referencedRelation: "ai_image_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_matched_admin_id_fkey"
            columns: ["matched_admin_id"]
            isOneToOne: false
            referencedRelation: "photographers"
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
            foreignKeyName: "inquiries_quiz_session_id_fkey"
            columns: ["quiz_session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
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
            foreignKeyName: "inquiries_selected_personality_code_fkey"
            columns: ["selected_personality_code"]
            isOneToOne: false
            referencedRelation: "personality_types"
            referencedColumns: ["code"]
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
      personality_admin_mapping: {
        Row: {
          admin_id: string | null
          compatibility_score: number | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          notes: string | null
          personality_code: string | null
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          compatibility_score?: number | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          personality_code?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          compatibility_score?: number | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          personality_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personality_admin_mapping_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "photographers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personality_admin_mapping_personality_code_fkey"
            columns: ["personality_code"]
            isOneToOne: false
            referencedRelation: "personality_types"
            referencedColumns: ["code"]
          },
        ]
      }
      personality_photos: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_representative: boolean | null
          personality_code: string | null
          photo_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_representative?: boolean | null
          personality_code?: string | null
          photo_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_representative?: boolean | null
          personality_code?: string | null
          photo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personality_photos_personality_code_fkey"
            columns: ["personality_code"]
            isOneToOne: false
            referencedRelation: "personality_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "personality_photos_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      personality_types: {
        Row: {
          ai_preview_prompt: string
          code: string
          created_at: string | null
          description: string
          display_order: number | null
          example_person: string | null
          is_active: boolean | null
          name: string
          recommended_locations: string[] | null
          recommended_props: string[] | null
          representative_image_url: string | null
          style_keywords: string[] | null
          updated_at: string | null
        }
        Insert: {
          ai_preview_prompt: string
          code: string
          created_at?: string | null
          description: string
          display_order?: number | null
          example_person?: string | null
          is_active?: boolean | null
          name: string
          recommended_locations?: string[] | null
          recommended_props?: string[] | null
          representative_image_url?: string | null
          style_keywords?: string[] | null
          updated_at?: string | null
        }
        Update: {
          ai_preview_prompt?: string
          code?: string
          created_at?: string | null
          description?: string
          display_order?: number | null
          example_person?: string | null
          is_active?: boolean | null
          name?: string
          recommended_locations?: string[] | null
          recommended_props?: string[] | null
          representative_image_url?: string | null
          style_keywords?: string[] | null
          updated_at?: string | null
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
      photographers: {
        Row: {
          age_range: string | null
          application_status: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
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
          specialties: string[] | null
          studio_location: string | null
          updated_at: string | null
          website_url: string | null
          years_experience: number | null
          youtube_intro_url: string | null
        }
        Insert: {
          age_range?: string | null
          application_status?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
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
          specialties?: string[] | null
          studio_location?: string | null
          updated_at?: string | null
          website_url?: string | null
          years_experience?: number | null
          youtube_intro_url?: string | null
        }
        Update: {
          age_range?: string | null
          application_status?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
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
          specialties?: string[] | null
          studio_location?: string | null
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
          filename: string
          height: number | null
          id: string
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
          filename: string
          height?: number | null
          id?: string
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
          filename?: string
          height?: number | null
          id?: string
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
      quiz_choices: {
        Row: {
          choice_image_url: string | null
          choice_text: string
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          question_id: string | null
        }
        Insert: {
          choice_image_url?: string | null
          choice_text: string
          created_at?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
          question_id?: string | null
        }
        Update: {
          choice_image_url?: string | null
          choice_text?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          part: string
          question_image_url: string | null
          question_text: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
          part: string
          question_image_url?: string | null
          question_text: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          part?: string
          question_image_url?: string | null
          question_text?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          choice_id: string | null
          created_at: string | null
          id: string
          question_id: string | null
          response_time_ms: number | null
          session_id: string | null
        }
        Insert: {
          choice_id?: string | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          response_time_ms?: number | null
          session_id?: string | null
        }
        Update: {
          choice_id?: string | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          response_time_ms?: number | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_choice_id_fkey"
            columns: ["choice_id"]
            isOneToOne: false
            referencedRelation: "quiz_choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sessions: {
        Row: {
          calculated_personality_code: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          started_at: string
          total_score_data: Json | null
          user_agent: string | null
          user_ip: unknown | null
        }
        Insert: {
          calculated_personality_code?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          started_at?: string
          total_score_data?: Json | null
          user_agent?: string | null
          user_ip?: unknown | null
        }
        Update: {
          calculated_personality_code?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          started_at?: string
          total_score_data?: Json | null
          user_agent?: string | null
          user_ip?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_calculated_personality_code_fkey"
            columns: ["calculated_personality_code"]
            isOneToOne: false
            referencedRelation: "personality_types"
            referencedColumns: ["code"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      is_slot_available: {
        Args: { p_slot_id: string }
        Returns: boolean
      }
      reserve_slot: {
        Args: { p_inquiry_id: string; p_slot_id: string }
        Returns: boolean
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
  public: {
    Enums: {},
  },
} as const
