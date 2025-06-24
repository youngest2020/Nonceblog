import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BlogHeader from "@/components/BlogHeader";
import EnhancedPostEditor from "@/components/EnhancedPostEditor";
import { useAdminBlogPosts } from "@/hooks/useBlogPosts";
import { uploadBlogImage } from "@/lib/imageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image } from "lucide-react";

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

const EditPost = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { updatePost, getPostById, deletePost } = useAdminBlogPosts();
  
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "No post ID provided.",
          variant: "destructive",
        });
        navigate("/admin");
        return;
      }

      try {
        console.log('Fetching post for editing:', id);
        const post = await getPostById(id);
        
        if (!post) {
          toast({
            title: "Error",
            description: "Post not found.",
            variant: "destructive",
          });
          navigate("/admin");
          return;
        }

        console.log('Post fetched for editing:', post);
        
        // Populate form with existing post data
        setFormData({
          title: post.title,
          content: post.content || "",
          excerpt: post.excerpt || "",
          category: post.category || "",
          tags: post.tags ? post.tags.join(", ") : "",
          image_url: post.image_url || "",
          is_published: post.is_published || false,
          social_handles: {
            twitter: post.social_handles?.twitter || "",
            youtube: post.social_handles?.youtube || "",
            facebook: post.social_handles?.facebook || "",
            telegram: post.social_handles?.telegram || ""
          }
        });

        // Set media items if they exist
        if (post.media_items && Array.isArray(post.media_items)) {
          setMediaItems(post.media_items);
        }

      } catch (error) {
        console.error('Error fetching post:', error);
        toast({
          title: "Error",
          description: "Failed to load post for editing.",
          variant: "destructive",
        });
        navigate("/admin");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, getPostById, navigate, toast]);

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

    if (!user || !profile || !id) {
      toast({
        title: "Error",
        description: "Missing required information to update post.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const updates = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 200) + "...",
        category: formData.category || "General",
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        image_url: formData.image_url,
        is_published: formData.is_published,
        social_handles: Object.fromEntries(
          Object.entries(formData.social_handles).filter(([_, value]) => value.trim() !== "")
        ),
        media_items: mediaItems
      };

      await updatePost(id, updates);
      navigate("/admin");
    } catch (error) {
      // Error is already handled in the updatePost function
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        await deletePost(id);
        navigate("/admin");
      } catch (error) {
        // Error is already handled in the deletePost function
      }
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

    setIsUploading(true);
    try {
      const imageUrl = await uploadBlogImage(file);
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Post</h1>
          <p className="text-gray-600">Update your blog post</p>
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
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
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
                <Label htmlFor="published">Published</Label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Post"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/admin")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  Delete Post
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditPost;