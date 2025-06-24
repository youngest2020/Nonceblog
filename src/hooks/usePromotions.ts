import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Promotion {
  id: string;
  title: string;
  message: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  display_rules: {
    pages?: string[];
    delay_seconds?: number;
    show_frequency?: 'once' | 'session' | 'always';
    target_audience?: 'all' | 'new_visitors' | 'returning_visitors';
    start_date?: string;
    end_date?: string;
  };
  analytics: {
    views: number;
    clicks: number;
    conversion_rate: number;
  };
  created_at: string;
  updated_at: string;
}

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      console.log('Fetching promotions...');
      
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching promotions:', error);
        throw error;
      }

      console.log('Promotions fetched successfully:', data);
      setPromotions(data || []);
    } catch (error: any) {
      console.error('Error fetching promotions:', error);
      toast({
        title: "Error",
        description: "Failed to load promotions",
        variant: "destructive",
      });
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivePromotions = async (page?: string) => {
    try {
      let query = supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true);

      const { data, error } = await query;

      if (error) throw error;

      // Filter by page and date rules on client side
      const now = new Date();
      const filteredPromotions = (data || []).filter(promotion => {
        const rules = promotion.display_rules || {};
        
        // Check page filter
        if (rules.pages && rules.pages.length > 0 && page) {
          if (!rules.pages.includes(page) && !rules.pages.includes('all')) {
            return false;
          }
        }

        // Check date range
        if (rules.start_date && new Date(rules.start_date) > now) {
          return false;
        }
        if (rules.end_date && new Date(rules.end_date) < now) {
          return false;
        }

        return true;
      });

      return filteredPromotions;
    } catch (error: any) {
      console.error('Error fetching active promotions:', error);
      return [];
    }
  };

  const createPromotion = async (promotionData: Omit<Promotion, 'id' | 'created_at' | 'updated_at' | 'analytics'>) => {
    try {
      console.log('Creating promotion:', promotionData);

      const { data, error } = await supabase
        .from('promotions')
        .insert([{
          ...promotionData,
          analytics: { views: 0, clicks: 0, conversion_rate: 0 }
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating promotion:', error);
        throw error;
      }

      console.log('Promotion created successfully:', data);
      setPromotions(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Promotion created successfully!",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating promotion:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create promotion",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePromotion = async (id: string, updates: Partial<Promotion>) => {
    try {
      console.log('Updating promotion:', id, updates);

      const { data, error } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating promotion:', error);
        throw error;
      }

      console.log('Promotion updated successfully:', data);
      setPromotions(prev => prev.map(promotion => promotion.id === id ? data : promotion));
      
      toast({
        title: "Success",
        description: "Promotion updated successfully!",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating promotion:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update promotion",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      console.log('Deleting promotion:', id);

      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting promotion:', error);
        throw error;
      }

      console.log('Promotion deleted successfully');
      setPromotions(prev => prev.filter(promotion => promotion.id !== id));
      
      toast({
        title: "Success",
        description: "Promotion deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting promotion:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete promotion",
        variant: "destructive",
      });
      throw error;
    }
  };

  const trackPromotionView = async (promotionId: string, visitorId: string) => {
    try {
      await supabase
        .from('promotion_views')
        .insert([{
          promotion_id: promotionId,
          visitor_id: visitorId,
          viewed_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          referrer: document.referrer
        }]);
    } catch (error) {
      console.error('Error tracking promotion view:', error);
    }
  };

  const trackPromotionClick = async (promotionId: string, visitorId: string) => {
    try {
      await supabase
        .from('promotion_views')
        .update({
          clicked: true,
          clicked_at: new Date().toISOString()
        })
        .eq('promotion_id', promotionId)
        .eq('visitor_id', visitorId)
        .order('viewed_at', { ascending: false })
        .limit(1);
    } catch (error) {
      console.error('Error tracking promotion click:', error);
    }
  };

  useEffect(() => {
    fetchPromotions();

    // Set up real-time subscription for promotions
    const subscription = supabase
      .channel('promotions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promotions'
        },
        (payload) => {
          console.log('Promotion real-time update received:', payload);
          fetchPromotions(); // Refetch promotions when changes occur
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { 
    promotions, 
    loading, 
    createPromotion, 
    updatePromotion, 
    deletePromotion,
    getActivePromotions,
    trackPromotionView,
    trackPromotionClick,
    refetch: fetchPromotions 
  };
};