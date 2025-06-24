import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { usePromotions } from "@/hooks/usePromotions";
import { useAnalytics } from "@/hooks/useAnalytics";

interface EnhancedPromotionalPopupProps {
  currentPage?: string;
}

const EnhancedPromotionalPopup = ({ currentPage = '/' }: EnhancedPromotionalPopupProps) => {
  const { getActivePromotions } = usePromotions();
  const { trackPromotionEngagement } = useAnalytics();
  const [currentPromotion, setCurrentPromotion] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if promotion should be shown based on frequency rules
  const shouldShowPromotion = (promotion: any) => {
    try {
      const frequency = promotion.display_rules?.show_frequency || 'session';
      const storageKey = `promotion_${promotion.id}_${frequency}`;
      
      switch (frequency) {
        case 'once':
          return !localStorage.getItem(storageKey);
        case 'session':
          return !sessionStorage.getItem(storageKey);
        case 'always':
          return true;
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking promotion frequency:', error);
      return false;
    }
  };

  // Mark promotion as shown
  const markPromotionShown = (promotion: any) => {
    try {
      const frequency = promotion.display_rules?.show_frequency || 'session';
      const storageKey = `promotion_${promotion.id}_${frequency}`;
      
      switch (frequency) {
        case 'once':
          localStorage.setItem(storageKey, 'shown');
          break;
        case 'session':
          sessionStorage.setItem(storageKey, 'shown');
          break;
      }
    } catch (error) {
      console.error('Error marking promotion as shown:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadPromotions = async () => {
      if (isLoading) return;
      
      try {
        setIsLoading(true);
        console.log('Loading promotions for page:', currentPage);
        
        const promotions = await Promise.race([
          getActivePromotions(currentPage),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Promotion fetch timeout')), 10000)
          )
        ]) as any[];
        
        if (!mounted) return;

        // Find the first promotion that should be shown
        const promotionToShow = promotions.find(shouldShowPromotion);
        
        if (promotionToShow && mounted) {
          setCurrentPromotion(promotionToShow);
          
          const delay = Math.max(1000, Math.min(30000, (promotionToShow.display_rules?.delay_seconds || 10) * 1000));
          
          // Show popup after delay or scroll interaction
          timeoutId = setTimeout(() => {
            if (!hasInteracted && mounted) {
              showPromotion(promotionToShow);
            }
          }, delay);

          const handleScroll = () => {
            if (!hasInteracted && window.scrollY > 200 && mounted) {
              setHasInteracted(true);
              showPromotion(promotionToShow);
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
            }
          };

          window.addEventListener('scroll', handleScroll, { passive: true });

          return () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            window.removeEventListener('scroll', handleScroll);
          };
        }
      } catch (error) {
        console.error('Error loading promotions:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadPromotions();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentPage, hasInteracted, isLoading]);

  const showPromotion = async (promotion: any) => {
    try {
      setIsVisible(true);
      markPromotionShown(promotion);
      
      // Track view with enhanced analytics (with timeout)
      await Promise.race([
        trackPromotionEngagement(promotion.id, 'view', {
          page: currentPage,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          referrer: document.referrer
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Analytics timeout')), 5000)
        )
      ]);
    } catch (error) {
      console.error('Error showing promotion:', error);
      // Still show the promotion even if analytics fails
      setIsVisible(true);
      markPromotionShown(promotion);
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentPromotion && currentPromotion.button_link) {
      console.log('🔗 Promotional button clicked!');
      console.log('📊 Tracking click for promotion:', currentPromotion.id);
      console.log('🌐 Opening external link:', currentPromotion.button_link);
      
      try {
        // Track the click with enhanced analytics (with timeout)
        await Promise.race([
          trackPromotionEngagement(currentPromotion.id, 'click', {
            page: currentPage,
            timestamp: new Date().toISOString(),
            target_url: currentPromotion.button_link,
            user_agent: navigator.userAgent
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Analytics timeout')), 3000)
          )
        ]);
        
        console.log('✅ Click tracked successfully');
      } catch (error) {
        console.error('❌ Error tracking promotional click:', error);
        // Continue with link opening even if tracking fails
      }
      
      try {
        // Validate URL format
        let linkUrl = currentPromotion.button_link;
        if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
          linkUrl = 'https://' + linkUrl;
          console.log('🔧 Auto-corrected URL to:', linkUrl);
        }
        
        // Open external link in new tab with security measures
        const newWindow = window.open(linkUrl, '_blank', 'noopener,noreferrer');
        
        if (newWindow) {
          console.log('🚀 External link opened successfully in new tab');
        } else {
          console.warn('⚠️ Popup blocked - trying alternative method');
          // Fallback for popup blockers
          window.location.href = linkUrl;
        }
        
        // Close the promotional popup
        setIsVisible(false);
        
      } catch (error) {
        console.error('❌ Error opening promotional link:', error);
        // Still close the popup
        setIsVisible(false);
      }
    } else {
      console.warn('⚠️ No valid promotion or button link found');
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('❌ Promotional popup closed by user');
    
    try {
      // Track close event (with timeout)
      if (currentPromotion) {
        await Promise.race([
          trackPromotionEngagement(currentPromotion.id, 'close', {
            page: currentPage,
            timestamp: new Date().toISOString(),
            action: 'manual_close'
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Analytics timeout')), 3000)
          )
        ]);
      }
    } catch (error) {
      console.error('Error tracking close event:', error);
      // Continue with closing even if tracking fails
    }
    
    setIsVisible(false);
  };

  if (!isVisible || !currentPromotion) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="w-80 shadow-lg border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {currentPromotion.title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0 ml-2"
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            {currentPromotion.message}
          </p>
          
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200" 
            size="sm"
            onClick={handleClick}
            disabled={!currentPromotion.button_link}
            type="button"
          >
            {currentPromotion.button_text}
          </Button>
          
          {/* Analytics indicator (only visible in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-gray-400 text-center">
              Analytics: Tracking enabled
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPromotionalPopup;