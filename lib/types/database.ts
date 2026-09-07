export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string | null
          product_type: string | null
          business_model: string | null
          description: string | null
          main_objective: string | null
          assumed_target_users: string | null
          north_star_metric: Json | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          url?: string | null
          product_type?: string | null
          business_model?: string | null
          description?: string | null
          main_objective?: string | null
          assumed_target_users?: string | null
          north_star_metric?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          url?: string | null
          product_type?: string | null
          business_model?: string | null
          description?: string | null
          main_objective?: string | null
          assumed_target_users?: string | null
          north_star_metric?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_kpis: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          unit: string | null
          direction: string
          tier: string
          target: number | null
          baseline: number | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          unit?: string | null
          direction?: string
          tier?: string
          target?: number | null
          baseline?: number | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          unit?: string | null
          direction?: string
          tier?: string
          target?: number | null
          baseline?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'project_kpis_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      project_objectives: {
        Row: {
          id: string
          project_id: string
          name: string
          type: string | null
          target: string | null
          priority: string
          start_date: string | null
          end_date: string | null
          constraints: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          type?: string | null
          target?: string | null
          priority?: string
          start_date?: string | null
          end_date?: string | null
          constraints?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          type?: string | null
          target?: string | null
          priority?: string
          start_date?: string | null
          end_date?: string | null
          constraints?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_objectives_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      project_integrations: {
        Row: {
          id: string
          project_id: string
          provider: string
          connection_name: string
          status: string
          auth_type: string | null
          external_property_id: string | null
          external_property_name: string | null
          credentials_vault_key: string | null
          capabilities: Json
          settings: Json
          sync_frequency: string
          last_sync_at: string | null
          last_success_at: string | null
          last_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          provider: string
          connection_name: string
          status?: string
          auth_type?: string | null
          external_property_id?: string | null
          external_property_name?: string | null
          credentials_vault_key?: string | null
          capabilities?: Json
          settings?: Json
          sync_frequency?: string
          last_sync_at?: string | null
          last_success_at?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          connection_name?: string
          status?: string
          auth_type?: string | null
          external_property_id?: string | null
          external_property_name?: string | null
          capabilities?: Json
          settings?: Json
          sync_frequency?: string
          last_sync_at?: string | null
          last_success_at?: string | null
          last_error?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_integrations_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      integration_syncs: {
        Row: {
          id: string
          integration_id: string
          project_id: string
          status: string
          period_start: string | null
          period_end: string | null
          started_at: string | null
          completed_at: string | null
          records_processed: number | null
          records_upserted: number | null
          records_skipped: number | null
          errors: Json
          metadata: Json
        }
        Insert: {
          id?: string
          integration_id: string
          project_id: string
          status?: string
          period_start?: string | null
          period_end?: string | null
          started_at?: string | null
          completed_at?: string | null
          records_processed?: number | null
          records_upserted?: number | null
          records_skipped?: number | null
          errors?: Json
          metadata?: Json
        }
        Update: {
          status?: string
          completed_at?: string | null
          records_processed?: number | null
          records_upserted?: number | null
          records_skipped?: number | null
          errors?: Json
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'integration_syncs_integration_id_fkey'
            columns: ['integration_id']
            isOneToOne: false
            referencedRelation: 'project_integrations'
            referencedColumns: ['id']
          }
        ]
      }
      evidence: {
        Row: {
          id: string
          project_id: string
          type: string
          source_type: string | null
          source_ref: string | null
          title: string
          content: string | null
          raw_data: Json | null
          confidence: number | null
          sample_size: number | null
          collected_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          type?: string
          source_type?: string | null
          source_ref?: string | null
          title: string
          content?: string | null
          raw_data?: Json | null
          confidence?: number | null
          sample_size?: number | null
          collected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: string
          source_type?: string | null
          title?: string
          content?: string | null
          raw_data?: Json | null
          confidence?: number | null
          sample_size?: number | null
          collected_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'evidence_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      personas: {
        Row: {
          id: string
          project_id: string
          name: string
          age: number | null
          job: string | null
          goals: string | null
          frustrations: string | null
          behaviors: string | null
          quote: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          age?: number | null
          job?: string | null
          goals?: string | null
          frustrations?: string | null
          behaviors?: string | null
          quote?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          age?: number | null
          job?: string | null
          goals?: string | null
          frustrations?: string | null
          behaviors?: string | null
          quote?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'personas_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      pain_points: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          severity: string
          frequency: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          severity?: string
          frequency?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          severity?: string
          frequency?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pain_points_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      insights: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          type: string
          confidence: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          type?: string
          confidence?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          type?: string
          confidence?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'insights_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      roadmap_items: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          type: string
          status: string
          brass_benefit: number | null
          brass_revenue: number | null
          brass_alignment: number | null
          brass_speed: number | null
          brass_saturation: number | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          type?: string
          status?: string
          brass_benefit?: number | null
          brass_revenue?: number | null
          brass_alignment?: number | null
          brass_speed?: number | null
          brass_saturation?: number | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          type?: string
          status?: string
          brass_benefit?: number | null
          brass_revenue?: number | null
          brass_alignment?: number | null
          brass_speed?: number | null
          brass_saturation?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'roadmap_items_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      user_tests: {
        Row: {
          id: string
          project_id: string
          title: string
          test_type: string
          status: string
          objectives: string | null
          notes: string | null
          scheduled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          test_type?: string
          status?: string
          objectives?: string | null
          notes?: string | null
          scheduled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          test_type?: string
          status?: string
          objectives?: string | null
          notes?: string | null
          scheduled_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_tests_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      project_documents: {
        Row: {
          id: string
          project_id: string
          name: string
          file_url: string | null
          content: string | null
          file_type: string | null
          ai_processed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          file_url?: string | null
          content?: string | null
          file_type?: string | null
          ai_processed?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          file_url?: string | null
          content?: string | null
          file_type?: string | null
          ai_processed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'project_documents_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      benchmark_rejected: {
        Row: {
          id: string
          project_id: string
          competitor_name: string
          competitor_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          competitor_name: string
          competitor_url?: string | null
          created_at?: string
        }
        Update: {
          competitor_name?: string
          competitor_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'benchmark_rejected_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      ai_conversations: {
        Row: {
          id: string
          project_id: string
          question: string
          answer: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          question: string
          answer: string
          created_at?: string
        }
        Update: {
          question?: string
          answer?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ai_conversations_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      benchmark_entries: {
        Row: {
          id: string
          project_id: string
          name: string
          url: string | null
          ai_analysis: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          url?: string | null
          ai_analysis?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          url?: string | null
          ai_analysis?: Json | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'benchmark_entries_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
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

/* ─── Derived row types ─── */
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectKpi = Database['public']['Tables']['project_kpis']['Row']
export type ProjectObjective = Database['public']['Tables']['project_objectives']['Row']
export type ProjectIntegration = Database['public']['Tables']['project_integrations']['Row']
export type IntegrationSync = Database['public']['Tables']['integration_syncs']['Row']
export type Evidence = Database['public']['Tables']['evidence']['Row']
export type Persona = Database['public']['Tables']['personas']['Row']
export type PainPoint = Database['public']['Tables']['pain_points']['Row']
export type Insight = Database['public']['Tables']['insights']['Row']
export type RoadmapItem = Database['public']['Tables']['roadmap_items']['Row']
export type UserTest = Database['public']['Tables']['user_tests']['Row']
export type BenchmarkEntry = Database['public']['Tables']['benchmark_entries']['Row']
export type ProjectDocument = Database['public']['Tables']['project_documents']['Row']
export type BenchmarkRejected = Database['public']['Tables']['benchmark_rejected']['Row']
export type AiConversation = Database['public']['Tables']['ai_conversations']['Row']

export type NorthStarMetric = {
  label: string
  unit: string
  direction: 'up' | 'down' | 'neutral'
  current?: number
  target?: number
}

export type IntegrationProvider = 'ga4' | 'hotjar' | 'csv' | 'xlsx' | 'manual'
export type IntegrationStatus = 'pending' | 'connected' | 'error' | 'disconnected' | 'syncing'
export type EvidenceType = 'observed' | 'inferred' | 'generated' | 'validated'
