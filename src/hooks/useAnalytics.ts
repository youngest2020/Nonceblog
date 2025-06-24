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
    try {
      let visitorId = localStorage.getItem('visitor_id');
      if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitor_id', visitorId);
      }
      return visitorId;
    } catch (error) {
      console.error('Error getting visitor ID:', error);
      return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  };

  // Generate or get session ID
  const getSessionId = () => {
    try {
      let sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      console.error('Error getting session ID:', error);
      return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  };

  const fetchPostAnalytics = async () => {
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('post_analytics')
          .select(`
            *,
            blog_posts!inner(title, slug)
          `)
          .order('views', { ascending: false }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Post analytics fetch timeout')), 10000)
        )
      ]) as any;

      if (error) throw error;
      setPostAnalytics(data || []);
    } catch (error: any) {
      console.error('Error fetching post analytics:', error);
      // Don't show toast for timeout errors to avoid spam
      if (!error.message?.includes('timeout')) {
        toast({
          title: "Warning",
          description: "Failed to load post analytics",
          variant: "destructive",
        });
      }
    }
  };

  const fetchPromotionAnalytics = async () => {
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('promotion_analytics')
          .select(`
            *,
            promotions!inner(title, message)
          `)
          .order('total_views', { ascending: false }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Promotion analytics fetch timeout')), 10000)
        )
      ]) as any;

      if (error) throw error;
      setPromotionAnalytics(data || []);
    } catch (error: any) {
      console.error('Error fetching promotion analytics:', error);
      // Don't show toast for timeout errors
      if (!error.message?.includes('timeout')) {
        toast({
          title: "Warning",
          description: "Failed to load promotion analytics",
          variant: "destructive",
        });
      }
    }
  };

  const fetchAnalyticsSummary = async () => {
    try {
      // Create a basic summary from post_analytics table
      const { data, error } = await Promise.race([
        supabase
          .from('post_analytics')
          .select('views, likes, shares, comments_count'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Analytics summary fetch timeout')), 10000)
        )
      ]) as any;

      if (error) throw error;
      
      if (data && data.length > 0) {
        const summary = {
          total_posts: data.length,
          total_views: data.reduce((sum: number, item: any) => sum + (item.views || 0), 0),
          total_unique_views: data.reduce((sum: number, item: any) => sum + (item.unique_views || 0), 0),
          total_likes: data.reduce((sum: number, item: any) => sum + (item.likes || 0), 0),
          total_shares: data.reduce((sum: number, item: any) => sum + (item.shares || 0), 0),
          total_comments: data.reduce((sum: number, item: any) => sum + (item.comments_count || 0), 0),
          avg_engagement_rate: data.reduce((sum: number, item: any) => sum + (item.engagement_rate || 0), 0) / data.length
        };
        setAnalyticsSummary(summary);
      } else {
        setAnalyticsSummary({
          total_posts: 0,
          total_views: 0,
          total_unique_views: 0,
          total_likes: 0,
          total_shares: 0,
          total_comments: 0,
          avg_engagement_rate: 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching analytics summary:', error);
      // Set default values instead of showing error
      setAnalyticsSummary({
        total_posts: 0,
        total_views: 0,
        total_unique_views: 0,
        total_likes: 0,
        total_shares: 0,
        total_comments: 0,
        avg_engagement_rate: 0
      });
    }
  };

  const fetchPromotionSummary = async () => {
    try {
      // Create a basic summary from promotion_analytics table
      const { data, error } = await Promise.race([
        supabase
          .from('promotion_analytics')
          .select('total_views, unique_views, total_clicks, unique_clicks, click_through_rate'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Promotion summary fetch timeout')), 10000)
        )
      ]) as any;

      if (error) throw error;
      
      if (data && data.length > 0) {
        const summary = {
          total_promotions: data.length,
          total_views: data.reduce((sum: number, item: any) => sum + (item.total_views || 0), 0),
          total_unique_views: data.reduce((sum: number, item: any) => sum + (item.unique_views || 0), 0),
          total_clicks: data.reduce((sum: number, item: any) => sum + (item.total_clicks || 0), 0),
          total_unique_clicks: data.reduce((sum: number, item: any) => sum + (item.unique_clicks || 0), 0),
          avg_click_through_rate: data.reduce((sum: number, item: any) => sum + (item.click_through_rate || 0), 0) / data.length
        };
        setPromotionSummary(summary);
      } else {
        setPromotionSummary({
          total_promotions: 0,
          total_views: 0,
          total_unique_views: 0,
          total_clicks: 0,
          total_unique_clicks: 0,
          avg_click_through_rate: 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching promotion summary:', error);
      // Set default values instead of showing error
      setPromotionSummary({
        total_promotions: 0,
        total_views: 0,
        total_unique_views: 0,
        total_clicks: 0,
        total_unique_clicks: 0,
        avg_click_through_rate: 0
      });
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

      // Use a simpler approach - just increment the analytics directly
      if (eventType === 'view') {
        await Promise.race([
          supabase.rpc('increment_post_views', { post_id: postId }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Analytics timeout')), 5000)
          )
        ]);
      }

      // Refresh analytics after tracking
      if (eventType === 'view') {
        await fetchPostAnalytics();
        await fetchAnalyticsSummary();
      }
    } catch (error: any) {
      console.error('Error tracking post engagement:', error);
      // Don't show user-facing errors for analytics failures
    }
  };

  const trackPromotionEngagement = async (
    promotionId: string,
    eventType: 'view' | 'click' | 'close',
    eventData: any = {}
  ) => {
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();

      // Use a simpler approach - just increment the analytics directly
      if (eventType === 'view') {
        await Promise.race([
          supabase.rpc('increment_promotion_views', { promotion_id: promotionId }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Analytics timeout')), 5000)
          )
        ]);
      } else if (eventType === 'click') {
        await Promise.race([
          supabase.rpc('increment_promotion_clicks', { promotion_id: promotionId }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Analytics timeout')), 5000)
          )
        ]);
      }

      // Refresh analytics after tracking
      await fetchPromotionAnalytics();
      await fetchPromotionSummary();
    } catch (error: any) {
      console.error('Error tracking promotion engagement:', error);
      // Don't show user-facing errors for analytics failures
    }
  };

  const createUserSession = async () => {
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();

      // Simplified session creation
      await Promise.race([
        supabase
          .from('user_sessions')
          .upsert({
            session_id: sessionId,
            visitor_id: visitorId,
            user_agent: navigator.userAgent,
            referrer: document.referrer,
            landing_page: window.location.pathname,
            session_start: new Date().toISOString()
          }, {
            onConflict: 'session_id'
          }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session creation timeout')), 5000)
        )
      ]);
    } catch (error: any) {
      console.error('Error creating user session:', error);
      // Don't show user-facing errors for session creation failures
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      if (!mounted) return;
      
      setLoading(true);
      try {
        // Load analytics with individual error handling
        const promises = [
          createUserSession().catch(err => console.error('Session creation failed:', err)),
          fetchPostAnalytics().catch(err => console.error('Post analytics failed:', err)),
          fetchPromotionAnalytics().catch(err => console.error('Promotion analytics failed:', err)),
          fetchAnalyticsSummary().catch(err => console.error('Analytics summary failed:', err)),
          fetchPromotionSummary().catch(err => console.error('Promotion summary failed:', err))
        ];

        await Promise.allSettled(promises);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    // Set up real-time subscriptions with error handling
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
          if (mounted) {
            fetchPostAnalytics().catch(err => console.error('Real-time post analytics update failed:', err));
            fetchAnalyticsSummary().catch(err => console.error('Real-time analytics summary update failed:', err));
          }
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
          if (mounted) {
            fetchPromotionAnalytics().catch(err => console.error('Real-time promotion analytics update failed:', err));
            fetchPromotionSummary().catch(err => console.error('Real-time promotion summary update failed:', err));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
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
      const promises = [
        fetchPostAnalytics().catch(err => console.error('Refetch post analytics failed:', err)),
        fetchPromotionAnalytics().catch(err => console.error('Refetch promotion analytics failed:', err)),
        fetchAnalyticsSummary().catch(err => console.error('Refetch analytics summary failed:', err)),
        fetchPromotionSummary().catch(err => console.error('Refetch promotion summary failed:', err))
      ];
      await Promise.allSettled(promises);
    }
  };
};