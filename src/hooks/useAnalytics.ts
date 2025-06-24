import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PostAnalytics {
  id: string;
  post_id: string;
  views: number;
  unique_views: number;
  likes: number;
  shares: number;
  comments_count: number;
  reading_time_avg: number;
  bounce_rate: number;
  engagement_rate: number;
  last_viewed: string;
  created_at: string;
  updated_at: string;
}

export interface PromotionAnalytics {
  id: string;
  promotion_id: string;
  total_views: number;
  unique_views: number;
  total_clicks: number;
  unique_clicks: number;
  conversion_rate: number;
  click_through_rate: number;
  bounce_rate: number;
  avg_time_to_click: number;
  geographic_data: any;
  device_data: any;
  referrer_data: any;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  total_posts: number;
  total_views: number;
  total_unique_views: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  avg_engagement_rate: number;
}

export interface PromotionSummary {
  total_promotions: number;
  total_views: number;
  total_unique_views: number;
  total_clicks: number;
  total_unique_clicks: number;
  avg_click_through_rate: number;
}

export const useAnalytics = () => {
  const [postAnalytics, setPostAnalytics] = useState<PostAnalytics[]>([]);
  const [promotionAnalytics, setPromotionAnalytics] = useState<PromotionAnalytics[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [promotionSummary, setPromotionSummary] = useState<PromotionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Generate or get visitor ID
  const getVisitorId = () => {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
  };

  // Generate or get session ID
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  const fetchPostAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('post_analytics')
        .select(`
          *,
          blog_posts!inner(title, slug)
        `)
        .order('views', { ascending: false });

      if (error) throw error;
      setPostAnalytics(data || []);
    } catch (error: any) {
      console.error('Error fetching post analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load post analytics",
        variant: "destructive",
      });
    }
  };

  const fetchPromotionAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_analytics')
        .select(`
          *,
          promotions!inner(title, message)
        `)
        .order('total_views', { ascending: false });

      if (error) throw error;
      setPromotionAnalytics(data || []);
    } catch (error: any) {
      console.error('Error fetching promotion analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load promotion analytics",
        variant: "destructive",
      });
    }
  };

  const fetchAnalyticsSummary = async () => {
    try {
      const { data, error } = await supabase.rpc('get_post_analytics_summary');
      if (error) throw error;
      setAnalyticsSummary(data[0] || null);
    } catch (error: any) {
      console.error('Error fetching analytics summary:', error);
    }
  };

  const fetchPromotionSummary = async () => {
    try {
      const { data, error } = await supabase.rpc('get_promotion_analytics_summary');
      if (error) throw error;
      setPromotionSummary(data[0] || null);
    } catch (error: any) {
      console.error('Error fetching promotion summary:', error);
    }
  };

  const trackPostEngagement = async (
    postId: string, 
    eventType: 'view' | 'like' | 'share' | 'comment',
    eventData: any = {}
  ) => {
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();

      await supabase.rpc('track_post_engagement', {
        p_post_id: postId,
        p_event_type: eventType,
        p_session_id: sessionId,
        p_visitor_id: visitorId,
        p_event_data: eventData
      });

      // Refresh analytics after tracking
      if (eventType === 'view') {
        await fetchPostAnalytics();
        await fetchAnalyticsSummary();
      }
    } catch (error: any) {
      console.error('Error tracking post engagement:', error);
    }
  };

  const trackPromotionEngagement = async (
    promotionId: string,
    eventType: 'view' | 'click',
    eventData: any = {}
  ) => {
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();

      await supabase.rpc('track_promotion_engagement', {
        p_promotion_id: promotionId,
        p_event_type: eventType,
        p_session_id: sessionId,
        p_visitor_id: visitorId,
        p_event_data: eventData
      });

      // Refresh analytics after tracking
      await fetchPromotionAnalytics();
      await fetchPromotionSummary();
    } catch (error: any) {
      console.error('Error tracking promotion engagement:', error);
    }
  };

  const createUserSession = async () => {
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();

      await supabase.rpc('create_user_session', {
        p_session_id: sessionId,
        p_visitor_id: visitorId,
        p_user_agent: navigator.userAgent,
        p_referrer: document.referrer,
        p_landing_page: window.location.pathname
      });
    } catch (error: any) {
      console.error('Error creating user session:', error);
    }
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        await Promise.all([
          createUserSession(),
          fetchPostAnalytics(),
          fetchPromotionAnalytics(),
          fetchAnalyticsSummary(),
          fetchPromotionSummary()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();

    // Set up real-time subscriptions
    const postAnalyticsSubscription = supabase
      .channel('post_analytics_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_analytics'
        },
        () => {
          fetchPostAnalytics();
          fetchAnalyticsSummary();
        }
      )
      .subscribe();

    const promotionAnalyticsSubscription = supabase
      .channel('promotion_analytics_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promotion_analytics'
        },
        () => {
          fetchPromotionAnalytics();
          fetchPromotionSummary();
        }
      )
      .subscribe();

    return () => {
      postAnalyticsSubscription.unsubscribe();
      promotionAnalyticsSubscription.unsubscribe();
    };
  }, []);

  return {
    postAnalytics,
    promotionAnalytics,
    analyticsSummary,
    promotionSummary,
    loading,
    trackPostEngagement,
    trackPromotionEngagement,
    refetch: async () => {
      await Promise.all([
        fetchPostAnalytics(),
        fetchPromotionAnalytics(),
        fetchAnalyticsSummary(),
        fetchPromotionSummary()
      ]);
    }
  };
};