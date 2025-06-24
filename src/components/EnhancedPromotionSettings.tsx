import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePromotions } from "@/hooks/usePromotions";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Eye, BarChart3, Calendar, Target, Settings } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Promotion = Database['public']['Tables']['promotions']['Row'];

const EnhancedPromotionSettings = () => {
  const { promotions, loading, createPromotion, updatePromotion, deletePromotion } = usePromotions();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    button_text: "Learn More",
    button_link: "",
    is_active: false,
    display_rules: {
      pages: [] as string[],
      delay_seconds: 10,
      show_frequency: 'session' as 'once' | 'session' | 'always',
      target_audience: 'all' as 'all' | 'new_visitors' | 'returning_visitors',
      start_date: '',
      end_date: ''
    }
  });

  const pageOptions = [
    { value: 'all', label: 'All Pages' },
    { value: '/', label: 'Home Page' },
    { value: '/post', label: 'Blog Posts' },
    { value: '/about', label: 'About Page' }
  ];

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      button_text: "Learn More",
      button_link: "",
      is_active: false,
      display_rules: {
        pages: [],
        delay_seconds: 10,
        show_frequency: 'session',
        target_audience: 'all',
        start_date: '',
        end_date: ''
      }
    });
    setEditingPromotion(null);
    setIsCreating(false);
  };

  const handleEdit = (promotion: Promotion) => {
    const rules = promotion.display_rules as any || {};
    setFormData({
      title: promotion.title,
      message: promotion.message,
      button_text: promotion.button_text,
      button_link: promotion.button_link,
      is_active: promotion.is_active || false,
      display_rules: {
        pages: rules.pages || [],
        delay_seconds: rules.delay_seconds || 10,
        show_frequency: rules.show_frequency || 'session',
        target_audience: rules.target_audience || 'all',
        start_date: rules.start_date || '',
        end_date: rules.end_date || ''
      }
    });
    setEditingPromotion(promotion);
    setIsCreating(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message || !formData.button_link) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const promotionData = {
        title: formData.title,
        message: formData.message,
        button_text: formData.button_text,
        button_link: formData.button_link,
        is_active: formData.is_active,
        display_rules: formData.display_rules
      };

      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, promotionData);
      } else {
        await createPromotion(promotionData);
      }
      resetForm();
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      await deletePromotion(id);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('display_rules.')) {
      const ruleField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        display_rules: {
          ...prev.display_rules,
          [ruleField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading promotions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Promotional Content Management</span>
            <Button
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Promotion</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Active Promotions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
              {promotions.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No promotions yet</h3>
                  <p className="text-gray-600 mb-4">Create your first promotional content to start engaging visitors.</p>
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Promotion
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {promotions.map((promotion) => (
                    <div key={promotion.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{promotion.title}</h3>
                            <Badge variant={promotion.is_active ? "default" : "secondary"}>
                              {promotion.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{promotion.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(promotion.created_at || '')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(promotion)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(promotion.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Display Rules Summary */}
                      <div className="flex flex-wrap gap-2">
                        {(promotion.display_rules as any)?.pages && (promotion.display_rules as any).pages.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Pages: {(promotion.display_rules as any).pages.join(', ')}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          Frequency: {(promotion.display_rules as any)?.show_frequency || 'session'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Target: {(promotion.display_rules as any)?.target_audience || 'all'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Promotions</p>
                        <p className="text-2xl font-bold">{promotions.length}</p>
                      </div>
                      <Target className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Promotions</p>
                        <p className="text-2xl font-bold">
                          {promotions.filter(p => p.is_active).length}
                        </p>
                      </div>
                      <Eye className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Inactive Promotions</p>
                        <p className="text-2xl font-bold">
                          {promotions.filter(p => !p.is_active).length}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-gray-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Promotion Modal */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}</span>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Special Offer!"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="button_text">Button Text *</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => handleChange("button_text", e.target.value)}
                    placeholder="Learn More"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="Don't miss out on our latest updates and exclusive content."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="button_link">Button Link *</Label>
                <Input
                  id="button_link"
                  value={formData.button_link}
                  onChange={(e) => handleChange("button_link", e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>

              {/* Display Rules */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Display Rules
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Show Frequency</Label>
                    <Select
                      value={formData.display_rules.show_frequency}
                      onValueChange={(value) => handleChange("display_rules.show_frequency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Once per visitor</SelectItem>
                        <SelectItem value="session">Once per session</SelectItem>
                        <SelectItem value="always">Every page visit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select
                      value={formData.display_rules.target_audience}
                      onValueChange={(value) => handleChange("display_rules.target_audience", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All visitors</SelectItem>
                        <SelectItem value="new_visitors">New visitors</SelectItem>
                        <SelectItem value="returning_visitors">Returning visitors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Delay (seconds)</Label>
                    <Input
                      type="number"
                      value={formData.display_rules.delay_seconds}
                      onChange={(e) => handleChange("display_rules.delay_seconds", parseInt(e.target.value))}
                      min="0"
                      max="60"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Start Date (optional)</Label>
                    <Input
                      type="date"
                      value={formData.display_rules.start_date}
                      onChange={(e) => handleChange("display_rules.start_date", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>End Date (optional)</Label>
                    <Input
                      type="date"
                      value={formData.display_rules.end_date}
                      onChange={(e) => handleChange("display_rules.end_date", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange("is_active", checked)}
                />
                <Label htmlFor="is_active">Activate promotion</Label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit">
                  {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedPromotionSettings;