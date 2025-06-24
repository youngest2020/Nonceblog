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
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          image_url: string | null
          author_id: string | null
          author_name: string | null
          category: string | null
          tags: string[] | null
          published_at: string | null
          is_published: boolean | null
          social_handles: Json | null
          media_items: Json | null
          meta_title: string | null
          meta_description: string | null
          featured: boolean | null
          reading_time: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          image_url?: string | null
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          tags?: string[] | null
          published_at?: string | null
          is_published?: boolean | null
          social_handles?: Json | null
          media_items?: Json | null
          meta_title?: string | null
          meta_description?: string | null
          featured?: boolean | null
          reading_time?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          image_url?: string | null
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          tags?: string[] | null
          published_at?: string | null
          is_published?: boolean | null
          social_handles?: Json | null
          media_items?: Json | null
          meta_title?: string | null
          meta_description?: string | null
          featured?: boolean | null
          reading_time?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      post_analytics: {
        Row: {
          id: string
          post_id: string | null
          views: number | null
          unique_views: number | null
          likes: number | null
          shares: number | null
          comments_count: number | null
          reading_time_avg: number | null
          bounce_rate: number | null
          engagement_rate: number | null
          last_viewed: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          post_id?: string | null
          views?: number | null
          unique_views?: number | null
          likes?: number | null
          shares?: number | null
          comments_count?: number | null
          reading_time_avg?: number | null
          bounce_rate?: number | null
          engagement_rate?: number | null
          last_viewed?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string | null
          views?: number | null
          unique_views?: number | null
          likes?: number | null
          shares?: number | null
          comments_count?: number | null
          reading_time_avg?: number | null
          bounce_rate?: number | null
          engagement_rate?: number | null
          last_viewed?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          profile_picture: string | null
          bio: string | null
          is_admin: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email?: string | null
          display_name?: string | null
          profile_picture?: string | null
          bio?: string | null
          is_admin?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          profile_picture?: string | null
          bio?: string | null
          is_admin?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      promotion_analytics: {
        Row: {
          id: string
          promotion_id: string | null
          total_views: number | null
          unique_views: number | null
          total_clicks: number | null
          unique_clicks: number | null
          conversion_rate: number | null
          click_through_rate: number | null
          bounce_rate: number | null
          avg_time_to_click: number | null
          geographic_data: Json | null
          device_data: Json | null
          referrer_data: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          promotion_id?: string | null
          total_views?: number | null
          unique_views?: number | null
          total_clicks?: number | null
          unique_clicks?: number | null
          conversion_rate?: number | null
          click_through_rate?: number | null
          bounce_rate?: number | null
          avg_time_to_click?: number | null
          geographic_data?: Json | null
          device_data?: Json | null
          referrer_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          promotion_id?: string | null
          total_views?: number | null
          unique_views?: number | null
          total_clicks?: number | null
          unique_clicks?: number | null
          conversion_rate?: number | null
          click_through_rate?: number | null
          bounce_rate?: number | null
          avg_time_to_click?: number | null
          geographic_data?: Json | null
          device_data?: Json | null
          referrer_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      promotions: {
        Row: {
          id: string
          title: string
          message: string
          button_text: string
          button_link: string
          is_active: boolean | null
          display_rules: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          message: string
          button_text: string
          button_link: string
          is_active?: boolean | null
          display_rules?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          message?: string
          button_text?: string
          button_link?: string
          is_active?: boolean | null
          display_rules?: Json | null
          created_at?: string | null
          updated_at?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}