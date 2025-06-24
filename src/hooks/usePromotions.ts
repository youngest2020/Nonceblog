import { useState, useEffect } from 'react';
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

  const getPromotionsFromStorage = (): Promotion[] => {
    const stored = localStorage.getItem('promotions');
    return stored ? JSON.parse(stored) : [];
  };

  const savePromotionsToStorage = (promotions: Promotion[]) => {
    localStorage.setItem('promotions', JSON.stringify(promotions));
  };

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      console.log('Fetching promotions from localStorage...');
      
      const storedPromotions = getPromotionsFromStorage();
      console.log('Promotions fetched successfully:', storedPromotions);
      setPromotions(storedPromotions);
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
      const allPromotions = getPromotionsFromStorage();
      
      // Filter by page and date rules on client side
      const now = new Date();
      const filteredPromotions = allPromotions.filter(promotion => {
        if (!promotion.is_active) return false;
        
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

      const newPromotion: Promotion = {
        id: Date.now().toString(),
        ...promotionData,
        analytics: { views: 0, clicks: 0, conversion_rate: 0 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const allPromotions = getPromotionsFromStorage();
      const updatedPromotions = [newPromotion, ...allPromotions];
      savePromotionsToStorage(updatedPromotions);
      setPromotions(updatedPromotions);
      
      toast({
        title: "Success",
        description: "Promotion created successfully!",
      });

      return newPromotion;
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

      const allPromotions = getPromotionsFromStorage();
      const updatedPromotions = allPromotions.map(promotion => 
        promotion.id === id 
          ? { ...promotion, ...updates, updated_at: new Date().toISOString() }
          : promotion
      );
      
      const updatedPromotion = updatedPromotions.find(promotion => promotion.id === id);
      if (!updatedPromotion) {
        throw new Error('Promotion not found');
      }

      savePromotionsToStorage(updatedPromotions);
      setPromotions(updatedPromotions);
      
      toast({
        title: "Success",
        description: "Promotion updated successfully!",
      });

      return updatedPromotion;
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

      const allPromotions = getPromotionsFromStorage();
      const updatedPromotions = allPromotions.filter(promotion => promotion.id !== id);
      
      savePromotionsToStorage(updatedPromotions);
      setPromotions(updatedPromotions);
      
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
      console.log('Mock tracking promotion view:', { promotionId, visitorId });
      // Mock implementation
    } catch (error) {
      console.error('Error tracking promotion view:', error);
    }
  };

  const trackPromotionClick = async (promotionId: string, visitorId: string) => {
    try {
      console.log('Mock tracking promotion click:', { promotionId, visitorId });
      // Mock implementation
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