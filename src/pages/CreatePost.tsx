import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BlogHeader from "@/components/BlogHeader";
import EnhancedPostEditor from "@/components/EnhancedPostEditor";
import { useAdminBlogPosts } from "@/hooks/useBlogPosts";
import { uploadBlogImage, debugStorageSetup } from "@/lib/imageUpload";
import { testStorageSetup, testImageUpload } from "@/lib/storageTest";
import { runStorageDiagnostic, createBlogImagesBucket, fixStoragePermissions } from "@/lib/storageDiagnostic";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, AlertTriangle, TestTube, CheckCircle, XCircle, Wrench, Plus, RefreshCw } from "lucide-react";

const categories = [
  "Technology",
  "News", 
  "Business",
  "Health",
  "Sports",
  "Entertainment",
  "Science",
  "Politics",
  "Travel",
  "Lifestyle"
];

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
  paragraphText?: string;
}

const CreatePost = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { createPost } = useAdminBlogPosts();
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    tags: "",
    image_url: "",
    is_published: false,
    social_handles: {
      twitter: "",
      youtube: "",
      facebook: "",
      telegram: ""
    }
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in title and content.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !profile) {
      toast({
        title: "Error",
        description: "You must be logged in to create posts.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const postData = {
        title: formData.title,
        slug: slug,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 200) + "...",
        author_name: profile.display_name || profile.email || "Unknown Author",
        author_id: user.id,
        category: formData.category || "General",
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        image_url: formData.image_url,
        is_published: formData.is_published,
        published_at: formData.is_published ? new Date().toISOString() : null,
        social_handles: Object.fromEntries(
          Object.entries(formData.social_handles).filter(([_, value]) => value.trim() !== "")
        ),
        media_items: mediaItems
      };

      await createPost(postData);
      navigate("/admin");
    } catch (error) {
      // Error is already handled in the createPost function
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_handles: {
        ...prev.social_handles,
        [platform]: value
      }
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input value so the same file can be selected again
    event.target.value = '';

    setIsUploading(true);
    try {
      console.log('Starting featured image upload...');
      const imageUrl = await uploadBlogImage(file);
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      toast({
        title: "Success",
        description: "Featured image uploaded successfully!",
      });
    } catch (error: any) {
      console.error('Featured image upload failed:', error);
      
      // Check if it's a bucket-related error and suggest using the diagnostic tools
      if (error.message.includes('bucket') || error.message.includes('storage')) {
        toast({
          title: "Storage Setup Required",
          description: "The blog-images storage bucket needs to be created. Please use the 'Create Bucket' button below.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const result = await runStorageDiagnostic();
      setDiagnosticResult(result);
      
      if (result.success) {
        toast({
          title: "Diagnostic Complete",
          description: "Storage setup is working correctly!",
        });
      } else {
        toast({
          title: "Diagnostic Found Issues",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setDiagnosticResult({ success: false, error: error.message });
      toast({
        title: "Diagnostic Error",
        description: "Failed to run diagnostic",
        variant: "destructive",
      });
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const handleCreateBucket = async () => {
    setIsCreatingBucket(true);
    try {
      const result = await createBlogImagesBucket();
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.alreadyExists 
            ? "blog-images bucket already exists!" 
            : "blog-images bucket created successfully!",
        });
        // Re-run diagnostic to verify
        await handleRunDiagnostic();
      } else {
        toast({
          title: "Failed to Create Bucket",
          description: result.error,
          variant: "destructive",
        });
        
        // Show additional help if it's a permission issue
        if (result.suggestion) {
          toast({
            title: "Suggestion",
            description: result.suggestion,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create bucket",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBucket(false);
    }
  };

  const handleFixPermissions = async () => {
    try {
      const result = await fixStoragePermissions();
      console.log('Permission check results:', result);
      
      toast({
        title: "Permission Check Complete",
        description: "Check the browser console for detailed results",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to check permissions",
        variant: "destructive",
      });
    }
  };

  const handleQuickFix = async () => {
    setIsCreatingBucket(true);
    try {
      // First try to create the bucket
      const createResult = await createBlogImagesBucket();
      
      if (createResult.success) {
        // Then run diagnostic to verify everything works
        const diagnosticResult = await runStorageDiagnostic();
        setDiagnosticResult(diagnosticResult);
        
        if (diagnosticResult.success) {
          toast({
            title: "Quick Fix Complete",
            description: "Storage is now ready for image uploads!",
          });
        } else {
          toast({
            title: "Bucket Created",
            description: "Bucket created but there may be permission issues. Check diagnostic results.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Quick Fix Failed",
          description: createResult.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Quick fix failed",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBucket(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Post</h1>
          <p className="text-gray-600">Write and publish your blog post</p>
          
          {/* Enhanced Debug and Test Tools */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Storage Setup & Diagnostic Tools</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              <Button 
                type="button" 
                variant="default" 
                size="sm"
                onClick={handleQuickFix}
                disabled={isCreatingBucket}
                className="bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isCreatingBucket ? "Fixing..." : "Quick Fix"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleRunDiagnostic}
                disabled={isRunningDiagnostic}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isRunningDiagnostic ? "Running..." : "Full Diagnostic"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleCreateBucket}
                disabled={isCreatingBucket}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCreatingBucket ? "Creating..." : "Create Bucket"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleFixPermissions}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Check Permissions
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={debugStorageSetup}
              >
                Debug Storage
              </Button>
            </div>

            {/* Diagnostic Results */}
            {diagnosticResult && (
              <div className={`p-4 rounded-lg border ${
                diagnosticResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {diagnosticResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    diagnosticResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Diagnostic {diagnosticResult.success ? 'Passed' : 'Failed'}
                  </span>
                </div>
                
                <div className={`text-sm ${
                  diagnosticResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  <p className="font-medium mb-2">
                    {diagnosticResult.success ? diagnosticResult.message : diagnosticResult.error}
                  </p>
                  
                  {!diagnosticResult.success && (
                    <div className="space-y-2">
                      {diagnosticResult.canCreateBucket && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="font-medium text-blue-800 mb-2">🔧 Quick Solution:</p>
                          <p className="text-blue-700 text-sm">
                            Click the "Quick Fix" button above to automatically create the blog-images bucket and verify the setup.
                          </p>
                        </div>
                      )}
                      
                      {diagnosticResult.availableBuckets && (
                        <div>
                          <p className="font-medium">Available buckets:</p>
                          <ul className="list-disc list-inside ml-4">
                            {diagnosticResult.availableBuckets.map((bucket: any) => (
                              <li key={bucket.id}>
                                {bucket.id} {bucket.public ? '(public)' : '(private)'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {diagnosticResult.similarBuckets && diagnosticResult.similarBuckets.length > 0 && (
                        <div>
                          <p className="font-medium">Similar buckets found:</p>
                          <ul className="list-disc list-inside ml-4">
                            {diagnosticResult.similarBuckets.map((bucket: any) => (
                              <li key={bucket.id}>
                                {bucket.id} {bucket.public ? '(public)' : '(private)'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {diagnosticResult.suggestion && (
                        <p className="font-medium text-blue-700">
                          💡 {diagnosticResult.suggestion}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {diagnosticResult.bucketInfo && (
                    <div className="mt-2 text-xs">
                      <p>Bucket: {diagnosticResult.bucketInfo.name}</p>
                      <p>Public: {diagnosticResult.bucketInfo.public ? 'Yes' : 'No'}</p>
                      <p>Size Limit: {Math.round((diagnosticResult.bucketInfo.file_size_limit || 0) / 1024 / 1024)}MB</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <p className="text-xs text-blue-700 mt-2">
              💡 <strong>Quick Fix</strong> will automatically create the bucket and verify setup. 
              Use <strong>Full Diagnostic</strong> for detailed troubleshooting. Check browser console for detailed logs.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Enter post title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  placeholder="Separate tags with commas"
                />
              </div>

              {/* Featured Image Upload */}
              <div className="space-y-2">
                <Label>Featured Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {formData.image_url ? (
                    <div className="space-y-4">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Image className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <Button 
                            type="button" 
                            variant="outline" 
                            disabled={isUploading}
                            className="cursor-pointer"
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploading ? "Uploading..." : "Upload Image"}
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                      
                      {/* Upload Status */}
                      {isUploading && (
                        <div className="flex items-center justify-center gap-2 text-blue-600 mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Uploading...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media Handles */}
              <div className="space-y-4">
                <Label>Social Media Handles (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="X (Twitter) handle"
                    value={formData.social_handles.twitter}
                    onChange={(e) => handleSocialChange("twitter", e.target.value)}
                  />
                  <Input
                    placeholder="YouTube channel"
                    value={formData.social_handles.youtube}
                    onChange={(e) => handleSocialChange("youtube", e.target.value)}
                  />
                  <Input
                    placeholder="Facebook profile"
                    value={formData.social_handles.facebook}
                    onChange={(e) => handleSocialChange("facebook", e.target.value)}
                  />
                  <Input
                    placeholder="Telegram username"
                    value={formData.social_handles.telegram}
                    onChange={(e) => handleSocialChange("telegram", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleChange("excerpt", e.target.value)}
                  placeholder="Brief description of the post"
                  rows={3}
                />
              </div>

              {/* Enhanced Post Editor */}
              <EnhancedPostEditor
                content={formData.content}
                mediaItems={mediaItems}
                onContentChange={(content) => handleChange("content", content)}
                onMediaChange={setMediaItems}
              />

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => handleChange("is_published", checked)}
                />
                <Label htmlFor="published">Publish immediately</Label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : (formData.is_published ? "Publish Post" : "Save Draft")}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/admin")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;