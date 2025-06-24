/*
  # Initial Database Schema Setup

  1. New Tables
    - `profiles` - User profile information
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `display_name` (text)
      - `profile_picture` (text, URL)
      - `bio` (text)
      - `is_admin` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `blog_posts` - Blog post content
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `slug` (text, unique, not null)
      - `excerpt` (text)
      - `content` (text)
      - `image_url` (text)
      - `author_id` (uuid, references profiles)
      - `author_name` (text)
      - `category` (text)
      - `tags` (text array)
      - `published_at` (timestamp)
      - `is_published` (boolean, default false)
      - `social_handles` (jsonb)
      - `media_items` (jsonb)
      - `meta_title` (text)
      - `meta_description` (text)
      - `featured` (boolean, default false)
      - `reading_time` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `promotions` - Promotional content management
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `message` (text, not null)
      - `button_text` (text, not null)
      - `button_link` (text, not null)
      - `is_active` (boolean, default false)
      - `display_rules` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `post_analytics` - Blog post analytics
      - `id` (uuid, primary key)
      - `post_id` (uuid, references blog_posts)
      - `views` (integer, default 0)
      - `unique_views` (integer, default 0)
      - `likes` (integer, default 0)
      - `shares` (integer, default 0)
      - `comments_count` (integer, default 0)
      - `reading_time_avg` (integer, default 0)
      - `bounce_rate` (decimal, default 0)
      - `engagement_rate` (decimal, default 0)
      - `last_viewed` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `promotion_analytics` - Promotion analytics
      - `id` (uuid, primary key)
      - `promotion_id` (uuid, references promotions)
      - `total_views` (integer, default 0)
      - `unique_views` (integer, default 0)
      - `total_clicks` (integer, default 0)
      - `unique_clicks` (integer, default 0)
      - `conversion_rate` (decimal, default 0)
      - `click_through_rate` (decimal, default 0)
      - `bounce_rate` (decimal, default 0)
      - `avg_time_to_click` (integer, default 0)
      - `geographic_data` (jsonb)
      - `device_data` (jsonb)
      - `referrer_data` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add admin-only policies for management functions
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  display_name text,
  profile_picture text,
  bio text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text,
  image_url text,
  author_id uuid REFERENCES profiles(id),
  author_name text,
  category text,
  tags text[],
  published_at timestamptz,
  is_published boolean DEFAULT false,
  social_handles jsonb DEFAULT '{}',
  media_items jsonb DEFAULT '[]',
  meta_title text,
  meta_description text,
  featured boolean DEFAULT false,
  reading_time integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  button_text text NOT NULL,
  button_link text NOT NULL,
  is_active boolean DEFAULT false,
  display_rules jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create post_analytics table
CREATE TABLE IF NOT EXISTS post_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  likes integer DEFAULT 0,
  shares integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  reading_time_avg integer DEFAULT 0,
  bounce_rate decimal DEFAULT 0,
  engagement_rate decimal DEFAULT 0,
  last_viewed timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create promotion_analytics table
CREATE TABLE IF NOT EXISTS promotion_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid REFERENCES promotions(id) ON DELETE CASCADE,
  total_views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  total_clicks integer DEFAULT 0,
  unique_clicks integer DEFAULT 0,
  conversion_rate decimal DEFAULT 0,
  click_through_rate decimal DEFAULT 0,
  bounce_rate decimal DEFAULT 0,
  avg_time_to_click integer DEFAULT 0,
  geographic_data jsonb DEFAULT '{}',
  device_data jsonb DEFAULT '{}',
  referrer_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_analytics ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Blog posts policies
CREATE POLICY "Anyone can read published posts"
  ON blog_posts
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all posts"
  ON blog_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Promotions policies
CREATE POLICY "Anyone can read active promotions"
  ON promotions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage promotions"
  ON promotions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Analytics policies
CREATE POLICY "Admins can read post analytics"
  ON post_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage post analytics"
  ON post_analytics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can read promotion analytics"
  ON promotion_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage promotion analytics"
  ON promotion_analytics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_post_analytics_post_id ON post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_promotion_analytics_promotion_id ON promotion_analytics(promotion_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(is_admin);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_analytics_updated_at BEFORE UPDATE ON post_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotion_analytics_updated_at BEFORE UPDATE ON promotion_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();