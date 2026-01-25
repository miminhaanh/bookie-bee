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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      books: {
        Row: {
          author: string | null
          cover_url: string | null
          created_at: string | null
          current_page: number | null
          current_position: string | null
          description: string | null
          estimated_time_remaining: number | null
          file_url: string | null
          format: Database["public"]["Enums"]["book_format"] | null
          genre: string | null
          id: string
          is_from_library: boolean | null
          open_library_key: string | null
          progress: number | null
          summary: string | null
          status: Database["public"]["Enums"]["book_status"] | null
          title: string
          toc: Json | null
          total_pages: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          author?: string | null
          cover_url?: string | null
          created_at?: string | null
          current_page?: number | null
          current_position?: string | null
          description?: string | null
          estimated_time_remaining?: number | null
          file_url?: string | null
          format?: Database["public"]["Enums"]["book_format"] | null
          genre?: string | null
          id?: string
          is_from_library?: boolean | null
          open_library_key?: string | null
          progress?: number | null
          summary?: string | null
          status?: Database["public"]["Enums"]["book_status"] | null
          title: string
          toc?: Json | null
          total_pages?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          author?: string | null
          cover_url?: string | null
          created_at?: string | null
          current_page?: number | null
          current_position?: string | null
          description?: string | null
          estimated_time_remaining?: number | null
          file_url?: string | null
          format?: Database["public"]["Enums"]["book_format"] | null
          genre?: string | null
          id?: string
          is_from_library?: boolean | null
          open_library_key?: string | null
          progress?: number | null
          summary?: string | null
          status?: Database["public"]["Enums"]["book_status"] | null
          title?: string
          toc?: Json | null
          total_pages?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_reading: {
        Row: {
          books_count: number | null
          created_at: string | null
          date: string
          id: string
          pages_read: number | null
          total_seconds: number | null
          user_id: string
        }
        Insert: {
          books_count?: number | null
          created_at?: string | null
          date?: string
          id?: string
          pages_read?: number | null
          total_seconds?: number | null
          user_id: string
        }
        Update: {
          books_count?: number | null
          created_at?: string | null
          date?: string
          id?: string
          pages_read?: number | null
          total_seconds?: number | null
          user_id?: string
        }
        Relationships: []
      }
      highlights: {
        Row: {
          book_id: string
          chapter: string | null
          color: Database["public"]["Enums"]["highlight_color"] | null
          content: string
          created_at: string | null
          id: string
          note: string | null
          page_number: number | null
          position: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          chapter?: string | null
          color?: Database["public"]["Enums"]["highlight_color"] | null
          content: string
          created_at?: string | null
          id?: string
          note?: string | null
          page_number?: number | null
          position?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          chapter?: string | null
          color?: Database["public"]["Enums"]["highlight_color"] | null
          content?: string
          created_at?: string | null
          id?: string
          note?: string | null
          page_number?: number | null
          position?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_streak: number | null
          default_font_family: string | null
          default_font_size: number | null
          default_reader_theme: string | null
          display_name: string | null
          id: string
          last_read_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          default_font_family?: string | null
          default_font_size?: number | null
          default_reader_theme?: string | null
          display_name?: string | null
          id?: string
          last_read_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          default_font_family?: string | null
          default_font_size?: number | null
          default_reader_theme?: string | null
          display_name?: string | null
          id?: string
          last_read_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          book_id: string
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          pages_read: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          pages_read?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          pages_read?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
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
      book_format: "pdf" | "epub" | "txt"
      book_status: "reading" | "completed" | "to_read"
      highlight_color: "yellow" | "blue" | "red"
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
    Enums: {
      book_format: ["pdf", "epub", "txt"],
      book_status: ["reading", "completed", "to_read"],
      highlight_color: ["yellow", "blue", "red"],
    },
  },
} as const
