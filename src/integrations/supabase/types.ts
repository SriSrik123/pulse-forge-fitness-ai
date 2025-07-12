export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          points: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          name: string
          points?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          points?: number
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          preferences: Json | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          preferences?: Json | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          preferences?: Json | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      scheduled_workouts: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          plan_id: string | null
          scheduled_date: string
          session_time_of_day: string | null
          skipped: boolean | null
          sport: string
          title: string
          updated_at: string
          user_id: string
          workout_id: string | null
          workout_type: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          plan_id?: string | null
          scheduled_date: string
          session_time_of_day?: string | null
          skipped?: boolean | null
          sport: string
          title: string
          updated_at?: string
          user_id: string
          workout_id?: string | null
          workout_type: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          plan_id?: string | null
          scheduled_date?: string
          session_time_of_day?: string | null
          skipped?: boolean | null
          sport?: string
          title?: string
          updated_at?: string
          user_id?: string
          workout_id?: string | null
          workout_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      smartwatch_data: {
        Row: {
          created_at: string
          data: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          category: string
          completed: boolean
          created_at: string
          current_value: number
          description: string | null
          id: string
          name: string
          target_date: string | null
          target_value: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          completed?: boolean
          created_at?: string
          current_value?: number
          description?: string | null
          id?: string
          name: string
          target_date?: string | null
          target_value: number
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean
          created_at?: string
          current_value?: number
          description?: string | null
          id?: string
          name?: string
          target_date?: string | null
          target_value?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sport_profiles: {
        Row: {
          competitive_level: string
          created_at: string
          current_goals: string | null
          experience_level: string
          id: string
          primary_sport: string
          session_duration: number
          training_frequency: number
          updated_at: string
          user_id: string
        }
        Insert: {
          competitive_level: string
          created_at?: string
          current_goals?: string | null
          experience_level: string
          id?: string
          primary_sport: string
          session_duration?: number
          training_frequency?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          competitive_level?: string
          created_at?: string
          current_goals?: string | null
          experience_level?: string
          id?: string
          primary_sport?: string
          session_duration?: number
          training_frequency?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_feedback: {
        Row: {
          created_at: string
          feedback_text: string
          feedback_type: string | null
          id: string
          sport: string
          updated_at: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          created_at?: string
          feedback_text: string
          feedback_type?: string | null
          id?: string
          sport: string
          updated_at?: string
          user_id: string
          workout_id?: string | null
        }
        Update: {
          created_at?: string
          feedback_text?: string
          feedback_type?: string | null
          id?: string
          sport?: string
          updated_at?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: []
      }
      workout_plan_preferences: {
        Row: {
          created_at: string
          equipment: string[] | null
          frequency_per_week: number | null
          id: string
          plan_id: string | null
          preferred_days: string[] | null
          session_duration: number | null
          sport: string
        }
        Insert: {
          created_at?: string
          equipment?: string[] | null
          frequency_per_week?: number | null
          id?: string
          plan_id?: string | null
          preferred_days?: string[] | null
          session_duration?: number | null
          sport: string
        }
        Update: {
          created_at?: string
          equipment?: string[] | null
          frequency_per_week?: number | null
          id?: string
          plan_id?: string | null
          preferred_days?: string[] | null
          session_duration?: number | null
          sport?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_preferences_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          includes_strength: boolean | null
          multiple_sessions_per_day: boolean | null
          primary_sport: string
          start_date: string
          title: string
          training_frequency: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          includes_strength?: boolean | null
          multiple_sessions_per_day?: boolean | null
          primary_sport: string
          start_date: string
          title: string
          training_frequency?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          includes_strength?: boolean | null
          multiple_sessions_per_day?: boolean | null
          primary_sport?: string
          start_date?: string
          title?: string
          training_frequency?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_questions: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          question: string
          sport: string
          updated_at: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          question: string
          sport: string
          updated_at?: string
          user_id: string
          workout_id?: string | null
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          question?: string
          sport?: string
          updated_at?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          completed: boolean | null
          created_at: string
          description: string | null
          duration: number | null
          equipment: Json | null
          exercises: Json
          feeling: string | null
          id: string
          journal_entry: string | null
          sport: string
          title: string
          user_id: string
          workout_type: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          duration?: number | null
          equipment?: Json | null
          exercises: Json
          feeling?: string | null
          id?: string
          journal_entry?: string | null
          sport: string
          title: string
          user_id: string
          workout_type: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          duration?: number | null
          equipment?: Json | null
          exercises?: Json
          feeling?: string | null
          id?: string
          journal_entry?: string | null
          sport?: string
          title?: string
          user_id?: string
          workout_type?: string
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
