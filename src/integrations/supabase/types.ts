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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academy_module_pdfs: {
        Row: {
          id: string
          module_id: string | null
          order_index: number | null
          title: string
          url: string
        }
        Insert: {
          id?: string
          module_id?: string | null
          order_index?: number | null
          title: string
          url: string
        }
        Update: {
          id?: string
          module_id?: string | null
          order_index?: number | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_module_pdfs_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_modules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          module_number: number
          phase_number: number
          phase_title: string
          title: string
          track: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          module_number: number
          phase_number: number
          phase_title: string
          title: string
          track: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          module_number?: number
          phase_number?: number
          phase_title?: string
          title?: string
          track?: string
          video_url?: string | null
        }
        Relationships: []
      }
      academy_quiz_options: {
        Row: {
          id: string
          is_correct: boolean | null
          option_text: string
          order_index: number | null
          question_id: string | null
        }
        Insert: {
          id?: string
          is_correct?: boolean | null
          option_text: string
          order_index?: number | null
          question_id?: string | null
        }
        Update: {
          id?: string
          is_correct?: boolean | null
          option_text?: string
          order_index?: number | null
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "academy_quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_quiz_questions: {
        Row: {
          id: string
          module_id: string | null
          order_index: number | null
          question_text: string
        }
        Insert: {
          id?: string
          module_id?: string | null
          order_index?: number | null
          question_text: string
        }
        Update: {
          id?: string
          module_id?: string | null
          order_index?: number | null
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_quiz_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      aurum_core_state: {
        Row: {
          active_mode: string | null
          ai_brief: string | null
          ai_brief_date: string | null
          ai_summary: string | null
          ai_summary_updated_at: string | null
          current_focus: Json | null
          current_level: string | null
          current_phase: string | null
          daily_tasks: Json | null
          daily_tasks_date: string | null
          execution_score: number | null
          free_usage: Json | null
          goal: string | null
          id: string
          last_active: string | null
          level: string | null
          mode: string | null
          roadmap: Json | null
          roadmap_generated_at: string | null
          roadmap_progress: Json | null
          streak: number | null
          today_brief: string | null
          today_brief_date: string | null
          upcoming_events: Json | null
          upcoming_events_week_start: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active_mode?: string | null
          ai_brief?: string | null
          ai_brief_date?: string | null
          ai_summary?: string | null
          ai_summary_updated_at?: string | null
          current_focus?: Json | null
          current_level?: string | null
          current_phase?: string | null
          daily_tasks?: Json | null
          daily_tasks_date?: string | null
          execution_score?: number | null
          free_usage?: Json | null
          goal?: string | null
          id?: string
          last_active?: string | null
          level?: string | null
          mode?: string | null
          roadmap?: Json | null
          roadmap_generated_at?: string | null
          roadmap_progress?: Json | null
          streak?: number | null
          today_brief?: string | null
          today_brief_date?: string | null
          upcoming_events?: Json | null
          upcoming_events_week_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active_mode?: string | null
          ai_brief?: string | null
          ai_brief_date?: string | null
          ai_summary?: string | null
          ai_summary_updated_at?: string | null
          current_focus?: Json | null
          current_level?: string | null
          current_phase?: string | null
          daily_tasks?: Json | null
          daily_tasks_date?: string | null
          execution_score?: number | null
          free_usage?: Json | null
          goal?: string | null
          id?: string
          last_active?: string | null
          level?: string | null
          mode?: string | null
          roadmap?: Json | null
          roadmap_generated_at?: string | null
          roadmap_progress?: Json | null
          streak?: number | null
          today_brief?: string | null
          today_brief_date?: string | null
          upcoming_events?: Json | null
          upcoming_events_week_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      aurum_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          source: string | null
          status: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          source?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          source?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          facebook_url: string | null
          id: string
          industry: string | null
          instagram_url: string | null
          linkedin_url: string | null
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      live_intelligence: {
        Row: {
          action: string | null
          category: string | null
          content_angle: string | null
          created_at: string
          description: string | null
          id: number
          image: string | null
          published_at: string | null
          source: string | null
          tag: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          action?: string | null
          category?: string | null
          content_angle?: string | null
          created_at?: string
          description?: string | null
          id?: number
          image?: string | null
          published_at?: string | null
          source?: string | null
          tag?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          action?: string | null
          category?: string | null
          content_angle?: string | null
          created_at?: string
          description?: string | null
          id?: number
          image?: string | null
          published_at?: string | null
          source?: string | null
          tag?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: []
      }
      mentor_conversations: {
        Row: {
          created_at: string
          id: string
          industry: string
          messages: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      message_drafts: {
        Row: {
          body: string
          category: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string
          id: string
          platform: string
          sent_at: string | null
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          category?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          platform: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          platform?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_drafts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          type: string
          url: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          type: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          type?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          created_at: string | null
          format: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          industry: string | null
          platforms: Json | null
          scheduled_at: string
          script: string[] | null
          selected_platforms: string[] | null
          status: string | null
          title: string | null
          user_id: string
          viral_hook: string | null
          visual_prompt: string | null
        }
        Insert: {
          created_at?: string | null
          format?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          industry?: string | null
          platforms?: Json | null
          scheduled_at: string
          script?: string[] | null
          selected_platforms?: string[] | null
          status?: string | null
          title?: string | null
          user_id: string
          viral_hook?: string | null
          visual_prompt?: string | null
        }
        Update: {
          created_at?: string | null
          format?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          industry?: string | null
          platforms?: Json | null
          scheduled_at?: string
          script?: string[] | null
          selected_platforms?: string[] | null
          status?: string | null
          title?: string | null
          user_id?: string
          viral_hook?: string | null
          visual_prompt?: string | null
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          access_token: string | null
          connected_at: string | null
          id: string
          platform: string
          refresh_token: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          id?: string
          platform: string
          refresh_token?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          id?: string
          platform?: string
          refresh_token?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_content_history: {
        Row: {
          created_at: string | null
          goal: string | null
          hashtags: string[] | null
          id: string
          idea: string | null
          image_url: string | null
          industry: string
          instagram_caption: string | null
          linkedin_caption: string | null
          mode: string
          tiktok_caption: string | null
          title: string | null
          user_id: string
          viral_hook: string | null
          visual_prompt: string | null
        }
        Insert: {
          created_at?: string | null
          goal?: string | null
          hashtags?: string[] | null
          id?: string
          idea?: string | null
          image_url?: string | null
          industry: string
          instagram_caption?: string | null
          linkedin_caption?: string | null
          mode: string
          tiktok_caption?: string | null
          title?: string | null
          user_id: string
          viral_hook?: string | null
          visual_prompt?: string | null
        }
        Update: {
          created_at?: string | null
          goal?: string | null
          hashtags?: string[] | null
          id?: string
          idea?: string | null
          image_url?: string | null
          industry?: string
          instagram_caption?: string | null
          linkedin_caption?: string | null
          mode?: string
          tiktok_caption?: string | null
          title?: string | null
          user_id?: string
          viral_hook?: string | null
          visual_prompt?: string | null
        }
        Relationships: []
      }
      user_memory: {
        Row: {
          background: string | null
          content_topics: string[] | null
          goals: string | null
          id: string
          industry: string | null
          last_updated: string | null
          mentor_context: string | null
          user_id: string
        }
        Insert: {
          background?: string | null
          content_topics?: string[] | null
          goals?: string | null
          id?: string
          industry?: string | null
          last_updated?: string | null
          mentor_context?: string | null
          user_id: string
        }
        Update: {
          background?: string | null
          content_topics?: string[] | null
          goals?: string | null
          id?: string
          industry?: string | null
          last_updated?: string | null
          mentor_context?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_module_progress: {
        Row: {
          attempts: number | null
          completed_at: string | null
          id: string
          module_id: string
          quiz_passed: boolean | null
          quiz_score: number | null
          user_id: string
          video_watched: boolean | null
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          id?: string
          module_id: string
          quiz_passed?: boolean | null
          quiz_score?: number | null
          user_id: string
          video_watched?: boolean | null
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          id?: string
          module_id?: string
          quiz_passed?: boolean | null
          quiz_score?: number | null
          user_id?: string
          video_watched?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          ai_response_style: string | null
          auto_daily_brief: boolean | null
          content_tone: string | null
          created_at: string | null
          current_profession: string | null
          daily_task_count: number | null
          full_name: string | null
          goal: string | null
          id: string
          instagram_url: string | null
          is_admin: boolean
          linkedin_url: string | null
          location: string | null
          mentor_tone: string | null
          mission: string | null
          photo_url: string | null
          preferred_platforms: string | null
          substack_url: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          user_id: string | null
          youtube_url: string | null
        }
        Insert: {
          ai_response_style?: string | null
          auto_daily_brief?: boolean | null
          content_tone?: string | null
          created_at?: string | null
          current_profession?: string | null
          daily_task_count?: number | null
          full_name?: string | null
          goal?: string | null
          id?: string
          instagram_url?: string | null
          is_admin?: boolean
          linkedin_url?: string | null
          location?: string | null
          mentor_tone?: string | null
          mission?: string | null
          photo_url?: string | null
          preferred_platforms?: string | null
          substack_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          youtube_url?: string | null
        }
        Update: {
          ai_response_style?: string | null
          auto_daily_brief?: boolean | null
          content_tone?: string | null
          created_at?: string | null
          current_profession?: string | null
          daily_task_count?: number | null
          full_name?: string | null
          goal?: string | null
          id?: string
          instagram_url?: string | null
          is_admin?: boolean
          linkedin_url?: string | null
          location?: string | null
          mentor_tone?: string | null
          mission?: string | null
          photo_url?: string | null
          preferred_platforms?: string | null
          substack_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      social_accounts_safe: {
        Row: {
          connected_at: string | null
          id: string | null
          platform: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          connected_at?: string | null
          id?: string | null
          platform?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          connected_at?: string | null
          id?: string | null
          platform?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_free_usage: {
        Args: { amount?: number; feature: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
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
