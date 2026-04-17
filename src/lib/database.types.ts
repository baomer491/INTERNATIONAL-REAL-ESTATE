export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          full_name: string
          username: string
          email: string | null
          phone: string
          role: string
          status: string
          avatar: string
          department: string
          join_date: string
          last_login: string | null
          last_logout: string | null
          is_active_session: boolean
          permissions: string[]
          notes: string
          password_hash: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          username: string
          email?: string | null
          phone?: string
          role?: string
          status?: string
          avatar?: string
          department?: string
          join_date?: string
          last_login?: string | null
          last_logout?: string | null
          is_active_session?: boolean
          permissions?: string[]
          notes?: string
          password_hash?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          username?: string
          email?: string | null
          phone?: string
          role?: string
          status?: string
          avatar?: string
          department?: string
          join_date?: string
          last_login?: string | null
          last_logout?: string | null
          is_active_session?: boolean
          permissions?: string[]
          notes?: string
          password_hash?: string
          created_at?: string
          updated_at?: string
        }
      }
      login_logs: {
        Row: {
          id: string
          employee_id: string | null
          employee_name: string
          action: string
          ip_address: string
          timestamp: string
        }
        Insert: {
          id?: string
          employee_id?: string | null
          employee_name: string
          action?: string
          ip_address?: string
          timestamp?: string
        }
        Update: {
          id?: string
          employee_id?: string | null
          employee_name?: string
          action?: string
          ip_address?: string
          timestamp?: string
        }
      }
      banks: {
        Row: {
          id: string
          name: string
          name_en: string
          logo: string
          is_active: boolean
          report_template: string
          contact_person: string
          phone: string
          email: string
          address: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_en?: string
          logo?: string
          is_active?: boolean
          report_template?: string
          contact_person?: string
          phone?: string
          email?: string
          address?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_en?: string
          logo?: string
          is_active?: boolean
          report_template?: string
          contact_person?: string
          phone?: string
          email?: string
          address?: string
          created_at?: string
          updated_at?: string
        }
      }
      beneficiaries: {
        Row: {
          id: string
          full_name: string
          civil_id: string
          phone: string
          email: string
          address: string
          relation: string
          workplace: string
          notes: string
          reports_count: number
          last_report_date: string | null
          bank_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          civil_id?: string
          phone?: string
          email?: string
          address?: string
          relation?: string
          workplace?: string
          notes?: string
          reports_count?: number
          last_report_date?: string | null
          bank_ids?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          civil_id?: string
          phone?: string
          email?: string
          address?: string
          relation?: string
          workplace?: string
          notes?: string
          reports_count?: number
          last_report_date?: string | null
          bank_ids?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          report_number: string
          bank_id: string | null
          bank_name: string
          beneficiary_id: string | null
          beneficiary_name: string
          beneficiary_civil_id: string
          beneficiary_phone: string
          beneficiary_email: string
          beneficiary_address: string
          beneficiary_relation: string
          beneficiary_workplace: string
          applicant_name: string
          property_type: string
          property_usage: string
          property_condition: string
          property_details: Json
          documents: Json
          extracted_data: Json
          valuation: Json
          status: string
          approval: Json
          appraiser_id: string | null
          appraiser_name: string
          fees: number
          notes: string
          purpose_of_valuation: string
          apartment_details: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_number: string
          bank_id?: string | null
          bank_name?: string
          beneficiary_id?: string | null
          beneficiary_name?: string
          beneficiary_civil_id?: string
          beneficiary_phone?: string
          beneficiary_email?: string
          beneficiary_address?: string
          beneficiary_relation?: string
          beneficiary_workplace?: string
          applicant_name?: string
          property_type?: string
          property_usage?: string
          property_condition?: string
          property_details?: Json
          documents?: Json
          extracted_data?: Json
          valuation?: Json
          status?: string
          approval?: Json
          appraiser_id?: string | null
          appraiser_name?: string
          fees?: number
          notes?: string
          purpose_of_valuation?: string
          apartment_details?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_number?: string
          bank_id?: string | null
          bank_name?: string
          beneficiary_id?: string | null
          beneficiary_name?: string
          beneficiary_civil_id?: string
          beneficiary_phone?: string
          beneficiary_email?: string
          beneficiary_address?: string
          beneficiary_relation?: string
          beneficiary_workplace?: string
          applicant_name?: string
          property_type?: string
          property_usage?: string
          property_condition?: string
          property_details?: Json
          documents?: Json
          extracted_data?: Json
          valuation?: Json
          status?: string
          approval?: Json
          appraiser_id?: string | null
          appraiser_name?: string
          fees?: number
          notes?: string
          purpose_of_valuation?: string
          apartment_details?: Json
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          type: string
          title: string
          message: string
          priority: string
          is_read: boolean
          related_report_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type?: string
          title: string
          message: string
          priority?: string
          is_read?: boolean
          related_report_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          message?: string
          priority?: string
          is_read?: boolean
          related_report_id?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          priority: string
          status: string
          due_date: string
          assigned_name: string
          related_report_id: string | null
          related_report_number: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          priority?: string
          status?: string
          due_date: string
          assigned_name?: string
          related_report_id?: string | null
          related_report_number?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          priority?: string
          status?: string
          due_date?: string
          assigned_name?: string
          related_report_id?: string | null
          related_report_number?: string
          created_at?: string
        }
      }
      app_settings: {
        Row: {
          id: number
          office_name: string
          office_name_en: string
          logo: string
          report_prefix: string
          report_next_number: number
          default_currency: string
          language: string
          theme: string
          user_name: string
          user_role: string
          user_email: string
          user_phone: string
          default_fees: number
          updated_at: string
        }
        Insert: {
          id?: number
          office_name?: string
          office_name_en?: string
          logo?: string
          report_prefix?: string
          report_next_number?: number
          default_currency?: string
          language?: string
          theme?: string
          user_name?: string
          user_role?: string
          user_email?: string
          user_phone?: string
          default_fees?: number
          updated_at?: string
        }
        Update: {
          id?: number
          office_name?: string
          office_name_en?: string
          logo?: string
          report_prefix?: string
          report_next_number?: number
          default_currency?: string
          language?: string
          theme?: string
          user_name?: string
          user_role?: string
          user_email?: string
          user_phone?: string
          default_fees?: number
          updated_at?: string
        }
      }
      drafts: {
        Row: {
          id: string
          key: string
          data: Json
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          data?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          data?: Json
          updated_at?: string
        }
      }
      market_cache: {
        Row: {
          id: string
          cache_key: string
          wilayat: string
          property_type: string
          usage: string
          results: Json
          avg_price_per_sqm: number
          fetched_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          cache_key: string
          wilayat?: string
          property_type?: string
          usage?: string
          results?: Json
          avg_price_per_sqm?: number
          fetched_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          cache_key?: string
          wilayat?: string
          property_type?: string
          usage?: string
          results?: Json
          avg_price_per_sqm?: number
          fetched_at?: string
          expires_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      [key: string]: never
    }
  }
}

