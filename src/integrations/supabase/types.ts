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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alert_notifications: {
        Row: {
          created_at: string
          detection_event_id: string
          id: string
          notification_data: Json | null
          notification_status: string
          notification_type: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          detection_event_id: string
          id?: string
          notification_data?: Json | null
          notification_status?: string
          notification_type: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          detection_event_id?: string
          id?: string
          notification_data?: Json | null
          notification_status?: string
          notification_type?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_notifications_detection_event_id_fkey"
            columns: ["detection_event_id"]
            isOneToOne: false
            referencedRelation: "face_detection_events"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_storage: {
        Row: {
          created_at: string
          detection_event_id: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          mime_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          detection_event_id: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          mime_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          detection_event_id?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_storage_detection_event_id_fkey"
            columns: ["detection_event_id"]
            isOneToOne: false
            referencedRelation: "face_detection_events"
            referencedColumns: ["id"]
          },
        ]
      }
      face_detection_events: {
        Row: {
          bounding_box: Json | null
          camera_id: string
          camera_name: string
          confidence_score: number
          detected_name: string | null
          estimated_age: number | null
          estimated_gender: string | null
          event_timestamp: string
          id: string
          known_face_id: string | null
          notification_sent: boolean
          screenshot_url: string | null
          user_id: string
        }
        Insert: {
          bounding_box?: Json | null
          camera_id: string
          camera_name: string
          confidence_score: number
          detected_name?: string | null
          estimated_age?: number | null
          estimated_gender?: string | null
          event_timestamp?: string
          id?: string
          known_face_id?: string | null
          notification_sent?: boolean
          screenshot_url?: string | null
          user_id: string
        }
        Update: {
          bounding_box?: Json | null
          camera_id?: string
          camera_name?: string
          confidence_score?: number
          detected_name?: string | null
          estimated_age?: number | null
          estimated_gender?: string | null
          event_timestamp?: string
          id?: string
          known_face_id?: string | null
          notification_sent?: boolean
          screenshot_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "face_detection_events_known_face_id_fkey"
            columns: ["known_face_id"]
            isOneToOne: false
            referencedRelation: "known_faces"
            referencedColumns: ["id"]
          },
        ]
      }
      face_recognition_config: {
        Row: {
          age_detection_enabled: boolean
          audio_alerts_enabled: boolean
          auto_evidence_capture: boolean
          confidence_threshold: number
          created_at: string
          gender_detection_enabled: boolean
          id: string
          telegram_bot_token: string | null
          telegram_chat_id: string | null
          telegram_notifications_enabled: boolean
          updated_at: string
          user_id: string
          visual_alerts_enabled: boolean
        }
        Insert: {
          age_detection_enabled?: boolean
          audio_alerts_enabled?: boolean
          auto_evidence_capture?: boolean
          confidence_threshold?: number
          created_at?: string
          gender_detection_enabled?: boolean
          id?: string
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          telegram_notifications_enabled?: boolean
          updated_at?: string
          user_id: string
          visual_alerts_enabled?: boolean
        }
        Update: {
          age_detection_enabled?: boolean
          audio_alerts_enabled?: boolean
          auto_evidence_capture?: boolean
          confidence_threshold?: number
          created_at?: string
          gender_detection_enabled?: boolean
          id?: string
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          telegram_notifications_enabled?: boolean
          updated_at?: string
          user_id?: string
          visual_alerts_enabled?: boolean
        }
        Relationships: []
      }
      known_faces: {
        Row: {
          created_at: string
          description: string | null
          face_encoding: string
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          face_encoding: string
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          face_encoding?: string
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
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
