/*
  # Enhanced Analytics System

  1. New Tables
    - `post_analytics` - Enhanced post engagement tracking
    - `promotion_analytics` - Detailed promotion performance
    - `user_sessions` - User session tracking
    - `engagement_events` - Granular event tracking

  2. Enhanced Analytics
    - Real-time view tracking
    - Click-through rates
    - User engagement metrics
    - Geographic data
    - Device information
    - Time-based analytics

  3. Functions
    - Analytics aggregation functions
    - Real-time metric calculations
    - Performance reporting
*/

-- Enhanced post analytics table
CREATE TABLE IF NOT EXISTS post_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  likes integer DEFAULT 0,
  shares integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  reading_time_avg integer DEFAULT 0,
  bounce_rate decimal(5,2) DEFAULT 0,
  engagement_rate decimal(5,2) DEFAULT 0,
  last_viewed timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(post_id)
);

-- Enhanced promotion analytics
CREATE TABLE IF NOT EXISTS promotion_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  total_views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  total_clicks integer DEFAULT 0,
  unique_clicks integer DEFAULT 0,
  conversion_rate decimal(5,2) DEFAULT 0,
  click_through_rate decimal(5,2) DEFAULT 0,
  bounce_rate decimal(5,2) DEFAULT 0,
  avg_time_to_click integer DEFAULT 0,
  geographic_data jsonb DEFAULT '{}',
  device_data jsonb DEFAULT '{}',
  referrer_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(promotion_id)
);

-- User sessions for better tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  visitor_id text NOT NULL,
  user_agent text,
  ip_address inet,
  country text,
  city text,
  device_type text,
  browser text,
  referrer text,
  landing_page text,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  page_views integer DEFAULT 1,
  total_time_spent integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Granular engagement events
CREATE TABLE IF NOT EXISTS engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES user_sessions(id),
  event_type text NOT NULL, -- 'view', 'click', 'share', 'like', 'comment', 'scroll', 'time_spent'
  target_type text NOT NULL, -- 'post', 'promotion', 'page'
  target_id uuid,
  event_data jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_analytics_post_id ON post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_promotion_analytics_promotion_id ON promotion_analytics(promotion_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_visitor_id ON user_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_session_id ON engagement_events(session_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_target ON engagement_events(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_timestamp ON engagement_events(timestamp);

-- Enable RLS
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view post analytics" ON post_analytics FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage post analytics" ON post_analytics FOR ALL TO public USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

CREATE POLICY "Public can view promotion analytics" ON promotion_analytics FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage promotion analytics" ON promotion_analytics FOR ALL TO public USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

CREATE POLICY "Anyone can insert user sessions" ON user_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can view user sessions" ON user_sessions FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

CREATE POLICY "Anyone can insert engagement events" ON engagement_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can view engagement events" ON engagement_events FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

-- Function to track post engagement
CREATE OR REPLACE FUNCTION track_post_engagement(
  p_post_id uuid,
  p_event_type text,
  p_session_id text DEFAULT NULL,
  p_visitor_id text DEFAULT NULL,
  p_event_data jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_uuid uuid;
BEGIN
  -- Get or create session
  IF p_session_id IS NOT NULL THEN
    SELECT id INTO v_session_uuid FROM user_sessions WHERE session_id = p_session_id LIMIT 1;
  END IF;

  -- Insert engagement event
  INSERT INTO engagement_events (session_id, event_type, target_type, target_id, event_data)
  VALUES (v_session_uuid, p_event_type, 'post', p_post_id, p_event_data);

  -- Update post analytics based on event type
  CASE p_event_type
    WHEN 'view' THEN
      INSERT INTO post_analytics (post_id, views, unique_views, last_viewed)
      VALUES (p_post_id, 1, 1, now())
      ON CONFLICT (post_id) DO UPDATE SET
        views = post_analytics.views + 1,
        unique_views = CASE 
          WHEN p_visitor_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM engagement_events e 
            JOIN user_sessions s ON e.session_id = s.id 
            WHERE e.target_id = p_post_id AND e.event_type = 'view' AND s.visitor_id = p_visitor_id
          ) THEN post_analytics.unique_views + 1
          ELSE post_analytics.unique_views
        END,
        last_viewed = now(),
        updated_at = now();
    
    WHEN 'like' THEN
      UPDATE post_analytics SET likes = likes + 1, updated_at = now() WHERE post_id = p_post_id;
    
    WHEN 'share' THEN
      UPDATE post_analytics SET shares = shares + 1, updated_at = now() WHERE post_id = p_post_id;
  END CASE;
END;
$$;

-- Function to track promotion engagement
CREATE OR REPLACE FUNCTION track_promotion_engagement(
  p_promotion_id uuid,
  p_event_type text,
  p_session_id text DEFAULT NULL,
  p_visitor_id text DEFAULT NULL,
  p_event_data jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_uuid uuid;
BEGIN
  -- Get or create session
  IF p_session_id IS NOT NULL THEN
    SELECT id INTO v_session_uuid FROM user_sessions WHERE session_id = p_session_id LIMIT 1;
  END IF;

  -- Insert engagement event
  INSERT INTO engagement_events (session_id, event_type, target_type, target_id, event_data)
  VALUES (v_session_uuid, p_event_type, 'promotion', p_promotion_id, p_event_data);

  -- Update promotion analytics
  CASE p_event_type
    WHEN 'view' THEN
      INSERT INTO promotion_analytics (promotion_id, total_views, unique_views)
      VALUES (p_promotion_id, 1, 1)
      ON CONFLICT (promotion_id) DO UPDATE SET
        total_views = promotion_analytics.total_views + 1,
        unique_views = CASE 
          WHEN p_visitor_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM engagement_events e 
            JOIN user_sessions s ON e.session_id = s.id 
            WHERE e.target_id = p_promotion_id AND e.event_type = 'view' AND s.visitor_id = p_visitor_id
          ) THEN promotion_analytics.unique_views + 1
          ELSE promotion_analytics.unique_views
        END,
        updated_at = now();
    
    WHEN 'click' THEN
      INSERT INTO promotion_analytics (promotion_id, total_clicks, unique_clicks)
      VALUES (p_promotion_id, 1, 1)
      ON CONFLICT (promotion_id) DO UPDATE SET
        total_clicks = promotion_analytics.total_clicks + 1,
        unique_clicks = CASE 
          WHEN p_visitor_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM engagement_events e 
            JOIN user_sessions s ON e.session_id = s.id 
            WHERE e.target_id = p_promotion_id AND e.event_type = 'click' AND s.visitor_id = p_visitor_id
          ) THEN promotion_analytics.unique_clicks + 1
          ELSE promotion_analytics.unique_clicks
        END,
        click_through_rate = CASE 
          WHEN promotion_analytics.total_views > 0 THEN 
            (promotion_analytics.total_clicks + 1) * 100.0 / promotion_analytics.total_views
          ELSE 0
        END,
        updated_at = now();
  END CASE;
END;
$$;

-- Function to create user session
CREATE OR REPLACE FUNCTION create_user_session(
  p_session_id text,
  p_visitor_id text,
  p_user_agent text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_landing_page text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_uuid uuid;
BEGIN
  INSERT INTO user_sessions (
    session_id, visitor_id, user_agent, referrer, landing_page
  ) VALUES (
    p_session_id, p_visitor_id, p_user_agent, p_referrer, p_landing_page
  ) RETURNING id INTO v_session_uuid;
  
  RETURN v_session_uuid;
END;
$$;

-- Function to get post analytics summary
CREATE OR REPLACE FUNCTION get_post_analytics_summary()
RETURNS TABLE (
  total_posts bigint,
  total_views bigint,
  total_unique_views bigint,
  total_likes bigint,
  total_shares bigint,
  total_comments bigint,
  avg_engagement_rate decimal
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT pa.post_id)::bigint as total_posts,
    COALESCE(SUM(pa.views), 0)::bigint as total_views,
    COALESCE(SUM(pa.unique_views), 0)::bigint as total_unique_views,
    COALESCE(SUM(pa.likes), 0)::bigint as total_likes,
    COALESCE(SUM(pa.shares), 0)::bigint as total_shares,
    COALESCE(SUM(pa.comments_count), 0)::bigint as total_comments,
    COALESCE(AVG(pa.engagement_rate), 0)::decimal as avg_engagement_rate
  FROM post_analytics pa;
END;
$$;

-- Function to get promotion analytics summary
CREATE OR REPLACE FUNCTION get_promotion_analytics_summary()
RETURNS TABLE (
  total_promotions bigint,
  total_views bigint,
  total_unique_views bigint,
  total_clicks bigint,
  total_unique_clicks bigint,
  avg_click_through_rate decimal
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT pa.promotion_id)::bigint as total_promotions,
    COALESCE(SUM(pa.total_views), 0)::bigint as total_views,
    COALESCE(SUM(pa.unique_views), 0)::bigint as total_unique_views,
    COALESCE(SUM(pa.total_clicks), 0)::bigint as total_clicks,
    COALESCE(SUM(pa.unique_clicks), 0)::bigint as total_unique_clicks,
    COALESCE(AVG(pa.click_through_rate), 0)::decimal as avg_click_through_rate
  FROM promotion_analytics pa;
END;
$$;