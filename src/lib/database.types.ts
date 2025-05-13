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
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'farmer' | 'agent'
          phone_number: string | null
          location: string | null
        }
        Insert: {
          id: string
          full_name: string
          role: 'farmer' | 'agent'
          phone_number?: string | null
          location?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'farmer' | 'agent'
          phone_number?: string | null
          location?: string | null
        }
      }
      farmers: {
        Row: {
          id: string
          full_name: string
          phone_number: string
          location: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone_number: string
          location: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone_number?: string
          location?: string
          created_by?: string
          created_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          farmer_id: string
          agent_id: string
          scheduled_date: string
          scheduled_time: string
          quantity_liters: number | null
          status: 'scheduled' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          farmer_id: string
          agent_id: string
          scheduled_date: string
          scheduled_time: string
          quantity_liters?: number | null
          status?: 'scheduled' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          farmer_id?: string
          agent_id?: string
          scheduled_date?: string
          scheduled_time?: string
          quantity_liters?: number | null
          status?: 'scheduled' | 'completed' | 'cancelled'
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          created_at: string
          read_at: string | null
          message_type: 'inquiry' | 'response' | 'announcement'
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          created_at?: string
          read_at?: string | null
          message_type: 'inquiry' | 'response' | 'announcement'
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          created_at?: string
          read_at?: string | null
          message_type?: 'inquiry' | 'response' | 'announcement'
        }
      }
      announcements: {
        Row: {
          id: string
          agent_id: string
          title: string
          content: string
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          title: string
          content: string
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          title?: string
          content?: string
          created_at?: string
          expires_at?: string | null
        }
      }
      announcement_recipients: {
        Row: {
          announcement_id: string
          user_id: string
          read_at: string | null
        }
        Insert: {
          announcement_id: string
          user_id: string
          read_at?: string | null
        }
        Update: {
          announcement_id?: string
          user_id?: string
          read_at?: string | null
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