export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string | null
          short_description: string | null
          product_type: string | null
          stage: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug?: string | null
          short_description?: string | null
          product_type?: string | null
          stage?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: []
      }
      need_expressions: {
        Row: {
          id: string
          user_id: string
          product_id: string
          title: string
          body: string | null
          context: string | null
          business_objectives: string | null
          known_users: string | null
          constraints: string | null
          open_questions: string | null
          tags: string[] | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          title: string
          body?: string | null
          context?: string | null
          business_objectives?: string | null
          known_users?: string | null
          constraints?: string | null
          open_questions?: string | null
          tags?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['need_expressions']['Insert']>
        Relationships: []
      }
      ai_analyses: {
        Row: {
          id: string
          user_id: string
          product_id: string
          analysis_type: string
          source_type: string | null
          source_id: string | null
          status: string
          model: string | null
          prompt_version: string | null
          input_snapshot: Json | null
          result: Json | null
          error_message: string | null
          usage: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          analysis_type: string
          source_type?: string | null
          source_id?: string | null
          status?: string
          model?: string | null
          prompt_version?: string | null
          input_snapshot?: Json | null
          result?: Json | null
          error_message?: string | null
          usage?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_analyses']['Insert']>
        Relationships: []
      }
      folders: {
        Row: {
          id: string
          user_id: string
          product_id: string
          parent_id: string | null
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          parent_id?: string | null
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['folders']['Insert']>
        Relationships: []
      }
      assets: {
        Row: {
          id: string
          user_id: string
          product_id: string
          folder_id: string | null
          original_name: string
          storage_path: string
          mime_type: string | null
          extension: string | null
          size_bytes: number | null
          processing_status: string | null
          ai_readable: boolean | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          folder_id?: string | null
          original_name: string
          storage_path: string
          mime_type?: string | null
          extension?: string | null
          size_bytes?: number | null
          processing_status?: string | null
          ai_readable?: boolean | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['assets']['Insert']>
        Relationships: []
      }
      tests: {
        Row: {
          id: string
          user_id: string
          product_id: string
          title: string
          test_type: string | null
          objective: string | null
          context: string | null
          target_description: string | null
          prototype_url: string | null
          intro_text: string | null
          closing_text: string | null
          estimated_minutes: number | null
          status: string
          public_token: string | null
          published_at: string | null
          logo_url: string | null
          bg_color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          title: string
          test_type?: string | null
          objective?: string | null
          context?: string | null
          target_description?: string | null
          prototype_url?: string | null
          intro_text?: string | null
          closing_text?: string | null
          estimated_minutes?: number | null
          status?: string
          public_token?: string | null
          published_at?: string | null
          logo_url?: string | null
          bg_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['tests']['Insert']>
        Relationships: []
      }
      test_blocks: {
        Row: {
          id: string
          user_id: string
          product_id: string
          test_id: string
          block_type: string
          position: number
          config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          test_id: string
          block_type: string
          position: number
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['test_blocks']['Insert']>
        Relationships: []
      }
      test_participants: {
        Row: {
          id: string
          product_id: string
          test_id: string
          participant_code: string | null
          name: string | null
          email: string | null
          job_title: string | null
          age: number | null
          metadata: Json | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          test_id: string
          participant_code?: string | null
          name?: string | null
          email?: string | null
          job_title?: string | null
          age?: number | null
          metadata?: Json | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['test_participants']['Insert']>
        Relationships: []
      }
      test_responses: {
        Row: {
          id: string
          product_id: string
          test_id: string
          participant_id: string
          block_id: string
          answer: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          test_id: string
          participant_id: string
          block_id: string
          answer?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['test_responses']['Insert']>
        Relationships: []
      }
      pain_points: {
        Row: {
          id: string
          user_id: string
          product_id: string
          title: string
          description: string | null
          status: 'candidate' | 'confirmed' | 'dismissed' | 'resolved'
          severity: string | null
          confidence: string | null
          source: 'manual' | 'ai'
          origin_analysis_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          title: string
          description?: string | null
          status?: 'candidate' | 'confirmed' | 'dismissed' | 'resolved'
          severity?: string | null
          confidence?: string | null
          source?: 'manual' | 'ai'
          origin_analysis_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['pain_points']['Insert']>
        Relationships: []
      }
      insights: {
        Row: {
          id: string
          user_id: string
          product_id: string
          statement: string
          observation: string | null
          implication: string | null
          status: 'candidate' | 'validated' | 'dismissed' | 'archived'
          confidence: string | null
          source: 'manual' | 'ai'
          origin_analysis_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          statement: string
          observation?: string | null
          implication?: string | null
          status?: 'candidate' | 'validated' | 'dismissed' | 'archived'
          confidence?: string | null
          source?: 'manual' | 'ai'
          origin_analysis_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['insights']['Insert']>
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          id: string
          user_id: string
          product_id: string
          title: string
          rationale: string | null
          priority: string | null
          confidence: string | null
          action_type: string | null
          status: string
          origin_analysis_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          title: string
          rationale?: string | null
          priority?: string | null
          confidence?: string | null
          action_type?: string | null
          status?: string
          origin_analysis_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_recommendations']['Insert']>
        Relationships: []
      }
      evidence_links: {
        Row: {
          id: string
          user_id: string
          product_id: string
          source_type: string
          source_id: string
          target_type: string
          target_id: string
          quote: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          source_type: string
          source_id: string
          target_type: string
          target_id: string
          quote?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['evidence_links']['Insert']>
        Relationships: []
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          product_id: string
          action: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          action: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['activity_log']['Insert']>
        Relationships: []
      }
      personas: {
        Row: {
          id: string
          user_id: string
          product_id: string
          name: string
          age_range: string | null
          job_title: string | null
          description: string | null
          goals: string[] | null
          frustrations: string[] | null
          behaviors: string | null
          quote: string | null
          avatar_color: string | null
          source: 'manual' | 'ai'
          origin_test_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          name: string
          age_range?: string | null
          job_title?: string | null
          description?: string | null
          goals?: string[] | null
          frustrations?: string[] | null
          behaviors?: string | null
          quote?: string | null
          avatar_color?: string | null
          source?: 'manual' | 'ai'
          origin_test_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['personas']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Product = Database['public']['Tables']['products']['Row']
export type NeedExpression = Database['public']['Tables']['need_expressions']['Row']
export type AiAnalysis = Database['public']['Tables']['ai_analyses']['Row']
export type Test = Database['public']['Tables']['tests']['Row']
export type TestBlock = Database['public']['Tables']['test_blocks']['Row']
export type TestParticipant = Database['public']['Tables']['test_participants']['Row']
export type TestResponse = Database['public']['Tables']['test_responses']['Row']
export type PainPoint = Database['public']['Tables']['pain_points']['Row']
export type Insight = Database['public']['Tables']['insights']['Row']
export type AiRecommendation = Database['public']['Tables']['ai_recommendations']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type Folder = Database['public']['Tables']['folders']['Row']
export type Persona = Database['public']['Tables']['personas']['Row']
