
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PromotionalPopupProps {
  isEnabled: boolean;
  title: string;
  message: string;
  buttonText: string;
  buttonLink: string;
}

const PromotionalPopup = ({ isEnabled, title, message, buttonText, buttonLink }: PromotionalPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    // Show popup after 10 seconds of page load or after scroll interaction
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10000);

    const handleScroll = () => {
      if (!hasInteracted && window.scrollY > 200) {
        setHasInteracted(true);
        setIsVisible(true);
        clearTimeout(timer);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isEnabled, hasInteracted]);

  if (!isVisible || !isEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="w-80 shadow-lg border-2 border-blue-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          
          <Button 
            className="w-full" 
            size="sm"
            onClick={() => {
              window.open(buttonLink, '_blank');
              setIsVisible(false);
            }}
          >
            {buttonText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionalPopup;
