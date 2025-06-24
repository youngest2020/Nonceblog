
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface PromotionData {
  isEnabled: boolean;
  title: string;
  message: string;
  buttonText: string;
  buttonLink: string;
}

const PromotionSettings = () => {
  const { toast } = useToast();
  const [promotionData, setPromotionData] = useState<PromotionData>({
    isEnabled: false,
    title: "Special Offer!",
    message: "Don't miss out on our latest updates and exclusive content.",
    buttonText: "Learn More",
    buttonLink: "https://example.com"
  });

  const handleSave = () => {
    // In a real app, this would save to a database
    localStorage.setItem('promotionSettings', JSON.stringify(promotionData));
    
    toast({
      title: "Success",
      description: "Promotion settings saved successfully!",
    });
  };

  const handleChange = (field: keyof PromotionData, value: string | boolean) => {
    setPromotionData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promotional Popup Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="promotion-enabled"
            checked={promotionData.isEnabled}
            onCheckedChange={(checked) => handleChange("isEnabled", checked)}
          />
          <Label htmlFor="promotion-enabled">Enable promotional popup</Label>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promotion-title">Popup Title</Label>
            <Input
              id="promotion-title"
              value={promotionData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter popup title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promotion-message">Message</Label>
            <Textarea
              id="promotion-message"
              value={promotionData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              placeholder="Enter promotion message"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                value={promotionData.buttonText}
                onChange={(e) => handleChange("buttonText", e.target.value)}
                placeholder="e.g., Learn More"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="button-link">Button Link</Label>
              <Input
                id="button-link"
                value={promotionData.buttonLink}
                onChange={(e) => handleChange("buttonLink", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Promotion Settings
        </Button>

        {promotionData.isEnabled && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
            <div className="bg-white p-4 rounded border shadow-sm">
              <h5 className="font-semibold mb-2">{promotionData.title}</h5>
              <p className="text-sm text-gray-600 mb-3">{promotionData.message}</p>
              <Button size="sm">{promotionData.buttonText}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromotionSettings;
