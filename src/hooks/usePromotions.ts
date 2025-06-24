import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Promotion = Database['public']['Tables']['promotions']['Row'];
type PromotionInsert = Database['public']['Tables']['promotions']['Insert'];
type PromotionUpdate = Database['public']['Tables']['promotions']['Update'];

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      console.log('Fetching promotions from Supabase...');
      
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
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
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      // Filter by page and date rules on client side
      const now = new Date();
      const filteredPromotions = (data || []).filter(promotion => {
        const rules = promotion.display_rules as any || {};
        
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

  const createPromotion = async (promotionData: PromotionInsert) => {
    try {
      console.log('Creating promotion:', promotionData);

      const { data, error } = await supabase
        .from('promotions')
        .insert(promotionData)
        .select()
        .single();

      if (error) {
        throw error;
      }

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

  const updatePromotion = async (id: string, updates: PromotionUpdate) => {
    try {
      console.log('Updating promotion:', id, updates);

      const { data, error } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPromotions(prev => prev.map(promotion => 
        promotion.id === id ? data : promotion
      ));
      
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
        throw error;
      }

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
      console.log('Tracking promotion view:', { promotionId, visitorId });
      // Implementation for tracking views
    } catch (error) {
      console.error('Error tracking promotion view:', error);
    }
  };

  const trackPromotionClick = async (promotionId: string, visitorId: string) => {
    try {
      console.log('Tracking promotion click:', { promotionId, visitorId });
      // Implementation for tracking clicks
    } catch (error) {
      console.error('Error tracking promotion click:', error);
    }
  };

  useEffect(() => {
    fetchPromotions();
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