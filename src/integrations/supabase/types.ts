export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      aurum_core_state: {
        Row: {
          id: string;
          user_id: string | null;
          mode: string | null;
          goal: string | null;
          level: string | null;
          streak: number | null;
          execution_score: number | null;
          current_focus: Json | null;
          ai_summary: string | null;
          last_active: string | null;
          updated_at: string | null;
          ai_brief: string | null;
          ai_brief_date: string | null;
          upcoming_events: Json | null;
          active_mode: string | null;
          current_phase: string | null;
          current_level: string | null;
          daily_tasks_date: string | null;
          ai_summary_updated_at: string | null;
          upcoming_events_week_start: string | null;
          daily_tasks: Json | null;
          today_brief: string | null;
          today_brief_date: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          mode?: string | null;
          goal?: string | null;
          level?: string | null;
          streak?: number | null;
          execution_score?: number | null;
          current_focus?: Json | null;
          ai_summary?: string | null;
          last_active?: string | null;
          updated_at?: string | null;
          ai_brief?: string | null;
          ai_brief_date?: string | null;
          upcoming_events?: Json | null;
          active_mode?: string | null;
          current_phase?: string | null;
          current_level?: string | null;
          daily_tasks_date?: string | null;
          ai_summary_updated_at?: string | null;
          upcoming_events_week_start?: string | null;
          daily_tasks?: Json | null;
          today_brief?: string | null;
          today_brief_date?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          mode?: string | null;
          goal?: string | null;
          level?: string | null;
          streak?: number | null;
          execution_score?: number | null;
          current_focus?: Json | null;
          ai_summary?: string | null;
          last_active?: string | null;
          updated_at?: string | null;
          ai_brief?: string | null;
          ai_brief_date?: string | null;
          upcoming_events?: Json | null;
          active_mode?: string | null;
          current_phase?: string | null;
          current_level?: string | null;
          daily_tasks_date?: string | null;
          ai_summary_updated_at?: string | null;
          upcoming_events_week_start?: string | null;
          daily_tasks?: Json | null;
          today_brief?: string | null;
          today_brief_date?: string | null;
        };
      };
      aurum_tasks: {
        Row: {
          id: string;
          user_id: string | null;
          title: string | null;
          description: string | null;
          status: string | null;
          priority: string | null;
          source: string | null;
          completed_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title?: string | null;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          source?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string | null;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          source?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
        };
      };
      live_intelligence: {
        Row: {
          id: number;
          created_at: string;
          title: string | null;
          description: string | null;
          category: string | null;
          source: string | null;
          image: string | null;
          url: string | null;
          tag: string | null;
          action: string | null;
          content_angle: string | null;
          published_at: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          title?: string | null;
          description?: string | null;
          category?: string | null;
          source?: string | null;
          image?: string | null;
          url?: string | null;
          tag?: string | null;
          action?: string | null;
          content_angle?: string | null;
          published_at?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          title?: string | null;
          description?: string | null;
          category?: string | null;
          source?: string | null;
          image?: string | null;
          url?: string | null;
          tag?: string | null;
          action?: string | null;
          content_angle?: string | null;
          published_at?: string | null;
        };
      };
      mentor_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          messages: Json;
          industry: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          messages?: Json;
          industry: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          messages?: Json;
          industry?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      social_accounts: {
        Row: {
          id: string;
          user_id: string | null;
          platform: string;
          access_token: string | null;
          refresh_token: string | null;
          username: string | null;
          connected_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          platform: string;
          access_token?: string | null;
          refresh_token?: string | null;
          username?: string | null;
          connected_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          platform?: string;
          access_token?: string | null;
          refresh_token?: string | null;
          username?: string | null;
          connected_at?: string | null;
        };
      };
      user_content_history: {
        Row: {
          id: string;
          user_id: string;
          industry: string;
          mode: string;
          idea: string | null;
          goal: string | null;
          title: string | null;
          viral_hook: string | null;
          instagram_caption: string | null;
          tiktok_caption: string | null;
          linkedin_caption: string | null;
          hashtags: string[] | null;
          visual_prompt: string | null;
          image_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          industry: string;
          mode: string;
          idea?: string | null;
          goal?: string | null;
          title?: string | null;
          viral_hook?: string | null;
          instagram_caption?: string | null;
          tiktok_caption?: string | null;
          linkedin_caption?: string | null;
          hashtags?: string[] | null;
          visual_prompt?: string | null;
          image_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          industry?: string;
          mode?: string;
          idea?: string | null;
          goal?: string | null;
          title?: string | null;
          viral_hook?: string | null;
          instagram_caption?: string | null;
          tiktok_caption?: string | null;
          linkedin_caption?: string | null;
          hashtags?: string[] | null;
          visual_prompt?: string | null;
          image_url?: string | null;
          created_at?: string | null;
        };
      };
      contacts: {
        Row: { id: string; user_id: string; name: string; email: string | null; company: string | null; role: string | null; phone: string | null; linkedin_url: string | null; instagram_url: string | null; facebook_url: string | null; notes: string | null; industry: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; user_id: string; name: string; email?: string | null; company?: string | null; role?: string | null; phone?: string | null; linkedin_url?: string | null; instagram_url?: string | null; facebook_url?: string | null; notes?: string | null; industry?: string | null; };
        Update: { id?: string; user_id?: string; name?: string; email?: string | null; company?: string | null; role?: string | null; phone?: string | null; linkedin_url?: string | null; instagram_url?: string | null; facebook_url?: string | null; notes?: string | null; industry?: string | null; };
      };
      message_drafts: {
        Row: { id: string; user_id: string; contact_id: string | null; contact_name: string | null; platform: string; category: string | null; subject: string | null; body: string; status: string; sent_at: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; user_id: string; contact_id?: string | null; contact_name?: string | null; platform: string; category?: string | null; subject?: string | null; body: string; status?: string; sent_at?: string | null; };
        Update: { id?: string; user_id?: string; contact_id?: string | null; contact_name?: string | null; platform?: string; category?: string | null; subject?: string | null; body?: string; status?: string; sent_at?: string | null; };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_memory: {
        Row: {
          id: string;
          user_id: string;
          industry: string | null;
          goals: string | null;
          background: string | null;
          content_topics: string[] | null;
          mentor_context: string | null;
          last_updated: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          industry?: string | null;
          goals?: string | null;
          background?: string | null;
          content_topics?: string[] | null;
          mentor_context?: string | null;
          last_updated?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          industry?: string | null;
          goals?: string | null;
          background?: string | null;
          content_topics?: string[] | null;
          mentor_context?: string | null;
          last_updated?: string | null;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string | null;
          current_profession: string | null;
          location: string | null;
          linkedin_url: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          twitter_url: string | null;
          youtube_url: string | null;
          substack_url: string | null;
          goal: string | null;
          photo_url: string | null;
          created_at: string | null;
          mission: string | null;
          updated_at: string | null;
          mentor_tone: string | null;
          daily_task_count: number | null;
          ai_response_style: string | null;
          content_tone: string | null;
          preferred_platforms: string | null;
          auto_daily_brief: boolean | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name?: string | null;
          current_profession?: string | null;
          location?: string | null;
          linkedin_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          twitter_url?: string | null;
          youtube_url?: string | null;
          substack_url?: string | null;
          goal?: string | null;
          photo_url?: string | null;
          created_at?: string | null;
          mission?: string | null;
          updated_at?: string | null;
          mentor_tone?: string | null;
          daily_task_count?: number | null;
          ai_response_style?: string | null;
          content_tone?: string | null;
          preferred_platforms?: string | null;
          auto_daily_brief?: boolean | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string | null;
          current_profession?: string | null;
          location?: string | null;
          linkedin_url?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          twitter_url?: string | null;
          youtube_url?: string | null;
          substack_url?: string | null;
          goal?: string | null;
          photo_url?: string | null;
          created_at?: string | null;
          mission?: string | null;
          updated_at?: string | null;
          mentor_tone?: string | null;
          daily_task_count?: number | null;
          ai_response_style?: string | null;
          content_tone?: string | null;
          preferred_platforms?: string | null;
          auto_daily_brief?: boolean | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};