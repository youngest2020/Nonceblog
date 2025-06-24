import { useState, useEffect } from 'react';
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

  // Mock analytics data
  const mockPostAnalytics: PostAnalytics[] = [
    {
      id: '1',
      post_id: '1',
      views: 1250,
      unique_views: 890,
      likes: 45,
      shares: 12,
      comments_count: 8,
      reading_time_avg: 180,
      bounce_rate: 35.5,
      engagement_rate: 5.2,
      last_viewed: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      post_id: '2',
      views: 890,
      unique_views: 650,
      likes: 32,
      shares: 8,
      comments_count: 5,
      reading_time_avg: 150,
      bounce_rate: 42.1,
      engagement_rate: 4.8,
      last_viewed: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const mockAnalyticsSummary: AnalyticsSummary = {
    total_posts: 3,
    total_views: 2140,
    total_unique_views: 1540,
    total_likes: 77,
    total_shares: 20,
    total_comments: 13,
    avg_engagement_rate: 5.0
  };

  const mockPromotionSummary: PromotionSummary = {
    total_promotions: 0,
    total_views: 0,
    total_unique_views: 0,
    total_clicks: 0,
    total_unique_clicks: 0,
    avg_click_through_rate: 0
  };

  const trackPostEngagement = async (
    postId: string, 
    eventType: 'view' | 'like' | 'share' | 'comment',
    eventData: any = {}
  ) => {
    try {
      console.log('Mock tracking post engagement:', { postId, eventType, eventData });
      
      // Update local analytics
      setPostAnalytics(prev => prev.map(analytics => {
        if (analytics.post_id === postId) {
          const updated = { ...analytics };
          switch (eventType) {
            case 'view':
              updated.views += 1;
              updated.unique_views += 1;
              break;
            case 'like':
              updated.likes += 1;
              break;
            case 'share':
              updated.shares += 1;
              break;
            case 'comment':
              updated.comments_count += 1;
              break;
          }
          updated.engagement_rate = ((updated.likes + updated.shares + updated.comments_count) / updated.views) * 100;
          return updated;
        }
        return analytics;
      }));
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
      console.log('Mock tracking promotion engagement:', { promotionId, eventType, eventData });
      // Mock implementation - no actual tracking
    } catch (error: any) {
      console.error('Error tracking promotion engagement:', error);
    }
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setPostAnalytics(mockPostAnalytics);
        setPromotionAnalytics([]);
        setAnalyticsSummary(mockAnalyticsSummary);
        setPromotionSummary(mockPromotionSummary);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
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
      // Mock refetch
      console.log('Mock analytics refetch');
    }
  };
};