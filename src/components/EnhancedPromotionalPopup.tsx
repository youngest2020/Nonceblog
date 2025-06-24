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

  // Check if promotion should be shown based on frequency rules
  const shouldShowPromotion = (promotion: any) => {
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
  };

  // Mark promotion as shown
  const markPromotionShown = (promotion: any) => {
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
  };

  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const promotions = await getActivePromotions(currentPage);
        
        // Find the first promotion that should be shown
        const promotionToShow = promotions.find(shouldShowPromotion);
        
        if (promotionToShow) {
          setCurrentPromotion(promotionToShow);
          
          const delay = promotionToShow.display_rules?.delay_seconds || 10;
          
          // Show popup after delay or scroll interaction
          const timer = setTimeout(() => {
            if (!hasInteracted) {
              showPromotion(promotionToShow);
            }
          }, delay * 1000);

          const handleScroll = () => {
            if (!hasInteracted && window.scrollY > 200) {
              setHasInteracted(true);
              showPromotion(promotionToShow);
              clearTimeout(timer);
            }
          };

          window.addEventListener('scroll', handleScroll);

          return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
          };
        }
      } catch (error) {
        console.error('Error loading promotions:', error);
      }
    };

    loadPromotions();
  }, [currentPage, hasInteracted]);

  const showPromotion = async (promotion: any) => {
    setIsVisible(true);
    markPromotionShown(promotion);
    
    // Track view with enhanced analytics
    await trackPromotionEngagement(promotion.id, 'view', {
      page: currentPage,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      referrer: document.referrer
    });
  };

  const handleClick = async () => {
    if (currentPromotion && currentPromotion.button_link) {
      console.log('🔗 Promotional button clicked!');
      console.log('📊 Tracking click for promotion:', currentPromotion.id);
      console.log('🌐 Opening external link:', currentPromotion.button_link);
      
      try {
        // Track the click with enhanced analytics
        await trackPromotionEngagement(currentPromotion.id, 'click', {
          page: currentPage,
          timestamp: new Date().toISOString(),
          target_url: currentPromotion.button_link,
          user_agent: navigator.userAgent
        });
        
        console.log('✅ Click tracked successfully');
        
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
        console.error('❌ Error handling promotional click:', error);
        // Still try to open the link even if tracking fails
        window.open(currentPromotion.button_link, '_blank', 'noopener,noreferrer');
        setIsVisible(false);
      }
    } else {
      console.warn('⚠️ No valid promotion or button link found');
    }
  };

  const handleClose = async () => {
    console.log('❌ Promotional popup closed by user');
    
    // Track close event
    if (currentPromotion) {
      await trackPromotionEngagement(currentPromotion.id, 'close', {
        page: currentPage,
        timestamp: new Date().toISOString(),
        action: 'manual_close'
      });
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
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
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