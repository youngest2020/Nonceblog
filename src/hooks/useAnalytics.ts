import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PostAnalytics = Database['public']['Tables']['post_analytics']['Row'];
type PromotionAnalytics = Database['public']['Tables']['promotion_analytics']['Row'];

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

  const fetchPostAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('post_analytics')
        .select(`
          *,
          blog_posts (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPostAnalytics(data || []);
    } catch (error: any) {
      console.error('Error fetching post analytics:', error);
    }
  };

  const fetchPromotionAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_analytics')
        .select(`
          *,
          promotions (
            title,
            message
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPromotionAnalytics(data || []);
    } catch (error: any) {
      console.error('Error fetching promotion analytics:', error);
    }
  };

  const calculateSummaries = () => {
    // Calculate post analytics summary
    const postSummary: AnalyticsSummary = {
      total_posts: postAnalytics.length,
      total_views: postAnalytics.reduce((sum, p) => sum + (p.views || 0), 0),
      total_unique_views: postAnalytics.reduce((sum, p) => sum + (p.unique_views || 0), 0),
      total_likes: postAnalytics.reduce((sum, p) => sum + (p.likes || 0), 0),
      total_shares: postAnalytics.reduce((sum, p) => sum + (p.shares || 0), 0),
      total_comments: postAnalytics.reduce((sum, p) => sum + (p.comments_count || 0), 0),
      avg_engagement_rate: postAnalytics.length > 0 
        ? postAnalytics.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / postAnalytics.length
        : 0
    };

    // Calculate promotion analytics summary
    const promSummary: PromotionSummary = {
      total_promotions: promotionAnalytics.length,
      total_views: promotionAnalytics.reduce((sum, p) => sum + (p.total_views || 0), 0),
      total_unique_views: promotionAnalytics.reduce((sum, p) => sum + (p.unique_views || 0), 0),
      total_clicks: promotionAnalytics.reduce((sum, p) => sum + (p.total_clicks || 0), 0),
      total_unique_clicks: promotionAnalytics.reduce((sum, p) => sum + (p.unique_clicks || 0), 0),
      avg_click_through_rate: promotionAnalytics.length > 0
        ? promotionAnalytics.reduce((sum, p) => sum + (p.click_through_rate || 0), 0) / promotionAnalytics.length
        : 0
    };

    setAnalyticsSummary(postSummary);
    setPromotionSummary(promSummary);
  };

  const trackPostEngagement = async (
    postId: string, 
    eventType: 'view' | 'like' | 'share' | 'comment',
    eventData: any = {}
  ) => {
    try {
      console.log('Tracking post engagement:', { postId, eventType, eventData });
      
      // Get or create analytics record for this post
      let { data: analytics, error } = await supabase
        .from('post_analytics')
        .select('*')
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (!analytics) {
        // Create new analytics record
        const { data: newAnalytics, error: createError } = await supabase
          .from('post_analytics')
          .insert({
            post_id: postId,
            views: eventType === 'view' ? 1 : 0,
            unique_views: eventType === 'view' ? 1 : 0,
            likes: eventType === 'like' ? 1 : 0,
            shares: eventType === 'share' ? 1 : 0,
            comments_count: eventType === 'comment' ? 1 : 0,
            last_viewed: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        analytics = newAnalytics;
      } else {
        // Update existing analytics
        const updates: any = {
          last_viewed: new Date().toISOString()
        };

        switch (eventType) {
          case 'view':
            updates.views = (analytics.views || 0) + 1;
            updates.unique_views = (analytics.unique_views || 0) + 1;
            break;
          case 'like':
            updates.likes = (analytics.likes || 0) + 1;
            break;
          case 'share':
            updates.shares = (analytics.shares || 0) + 1;
            break;
          case 'comment':
            updates.comments_count = (analytics.comments_count || 0) + 1;
            break;
        }

        // Calculate engagement rate
        const totalEngagements = (updates.likes || analytics.likes || 0) + 
                                (updates.shares || analytics.shares || 0) + 
                                (updates.comments_count || analytics.comments_count || 0);
        const totalViews = updates.views || analytics.views || 1;
        updates.engagement_rate = (totalEngagements / totalViews) * 100;

        const { data: updatedAnalytics, error: updateError } = await supabase
          .from('post_analytics')
          .update(updates)
          .eq('id', analytics.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        analytics = updatedAnalytics;
      }

      // Update local state
      setPostAnalytics(prev => {
        const index = prev.findIndex(p => p.post_id === postId);
        if (index >= 0) {
          const newAnalytics = [...prev];
          newAnalytics[index] = analytics!;
          return newAnalytics;
        } else {
          return [...prev, analytics!];
        }
      });

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
      console.log('Tracking promotion engagement:', { promotionId, eventType, eventData });
      
      // Get or create analytics record for this promotion
      let { data: analytics, error } = await supabase
        .from('promotion_analytics')
        .select('*')
        .eq('promotion_id', promotionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!analytics) {
        // Create new analytics record
        const { data: newAnalytics, error: createError } = await supabase
          .from('promotion_analytics')
          .insert({
            promotion_id: promotionId,
            total_views: eventType === 'view' ? 1 : 0,
            unique_views: eventType === 'view' ? 1 : 0,
            total_clicks: eventType === 'click' ? 1 : 0,
            unique_clicks: eventType === 'click' ? 1 : 0
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        analytics = newAnalytics;
      } else {
        // Update existing analytics
        const updates: any = {};

        switch (eventType) {
          case 'view':
            updates.total_views = (analytics.total_views || 0) + 1;
            updates.unique_views = (analytics.unique_views || 0) + 1;
            break;
          case 'click':
            updates.total_clicks = (analytics.total_clicks || 0) + 1;
            updates.unique_clicks = (analytics.unique_clicks || 0) + 1;
            break;
        }

        // Calculate click-through rate
        const totalClicks = updates.total_clicks || analytics.total_clicks || 0;
        const totalViews = analytics.total_views || 1;
        updates.click_through_rate = (totalClicks / totalViews) * 100;

        const { data: updatedAnalytics, error: updateError } = await supabase
          .from('promotion_analytics')
          .update(updates)
          .eq('id', analytics.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        analytics = updatedAnalytics;
      }

      // Update local state
      setPromotionAnalytics(prev => {
        const index = prev.findIndex(p => p.promotion_id === promotionId);
        if (index >= 0) {
          const newAnalytics = [...prev];
          newAnalytics[index] = analytics!;
          return newAnalytics;
        } else {
          return [...prev, analytics!];
        }
      });

    } catch (error: any) {
      console.error('Error tracking promotion engagement:', error);
    }
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchPostAnalytics(),
          fetchPromotionAnalytics()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  useEffect(() => {
    calculateSummaries();
  }, [postAnalytics, promotionAnalytics]);

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
        fetchPromotionAnalytics()
      ]);
    }
  };
};