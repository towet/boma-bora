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
      farmers: {
        Row: {
          id: string
          full_name: string
          phone_number: string | null
          location: string
          created_at: string
          created_by: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone_number?: string | null
          location: string
          created_at?: string
          created_by: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone_number?: string | null
          location?: string
          created_at?: string
          created_by?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'agent' | 'farmer'
          phone_number: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: 'agent' | 'farmer'
          phone_number?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'agent' | 'farmer'
          phone_number?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          farmer_id: string
          scheduled_date: string
          scheduled_time: string
          quantity_liters: number | null
          status: 'scheduled' | 'completed' | 'cancelled'
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          farmer_id: string
          scheduled_date: string
          scheduled_time: string
          quantity_liters?: number | null
          status?: 'scheduled' | 'completed' | 'cancelled'
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          farmer_id?: string
          scheduled_date?: string
          scheduled_time?: string
          quantity_liters?: number | null
          status?: 'scheduled' | 'completed' | 'cancelled'
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          created_at: string
          read: boolean
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          created_at?: string
          read?: boolean
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          created_at?: string
          read?: boolean
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
  }
}