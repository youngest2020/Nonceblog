// Mock types for Supabase integration
export interface Database {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string | null;
          image_url: string | null;
          author_id: string;
          author_name: string | null;
          category: string | null;
          tags: string[] | null;
          published_at: string | null;
          is_published: boolean | null;
          social_handles: any;
          media_items: any;
          created_at: string | null;
          updated_at: string | null;
          meta_title: string | null;
          meta_description: string | null;
          featured: boolean | null;
          reading_time: number | null;
        };
        Insert: Omit<Database['public']['Tables']['blog_posts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['blog_posts']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          profile_picture: string | null;
          bio: string | null;
          is_admin: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      promotions: {
        Row: {
          id: string;
          title: string;
          message: string;
          button_text: string;
          button_link: string;
          is_active: boolean;
          display_rules: any;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['promotions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['promotions']['Insert']>;
      };
    };
  };
}