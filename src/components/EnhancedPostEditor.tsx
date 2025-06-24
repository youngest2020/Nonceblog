import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Video, X, Link, AlertCircle } from "lucide-react";
import { uploadBlogImage } from "@/lib/imageUpload";

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
  paragraphText?: string;
}

interface EnhancedPostEditorProps {
  content: string;
  mediaItems: MediaItem[];
  onContentChange: (content: string) => void;
  onMediaChange: (mediaItems: MediaItem[]) => void;
}

const EnhancedPostEditor = ({ content, mediaItems, onContentChange, onMediaChange }: EnhancedPostEditorProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input value so the same file can be selected again
    event.target.value = '';

    setIsUploading(true);
    try {
      console.log('Starting image upload for blog post...');
      const imageUrl = await uploadBlogImage(file);
      
      const newMediaItem: MediaItem = {
        id: Date.now().toString(),
        type: 'image',
        url: imageUrl,
        caption: ''
      };
      
      onMediaChange([...mediaItems, newMediaItem]);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
      
      console.log('Image uploaded and added to media items');
    } catch (error: any) {
      console.error('Image upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const addYouTubeVideo = () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    // Extract video ID from YouTube URL
    const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (!videoIdMatch) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    const newMediaItem: MediaItem = {
      id: Date.now().toString(),
      type: 'video',
      url: youtubeUrl,
      caption: ''
    };

    onMediaChange([...mediaItems, newMediaItem]);
    setYoutubeUrl("");
    
    toast({
      title: "Success",
      description: "YouTube video added successfully!",
    });
  };

  const removeMediaItem = (id: string) => {
    onMediaChange(mediaItems.filter(item => item.id !== id));
    
    toast({
      title: "Removed",
      description: "Media item removed from post.",
    });
  };

  const updateMediaCaption = (id: string, caption: string) => {
    onMediaChange(mediaItems.map(item => 
      item.id === id ? { ...item, caption } : item
    ));
  };

  const updateMediaParagraph = (id: string, paragraphText: string) => {
    onMediaChange(mediaItems.map(item => 
      item.id === id ? { ...item, paragraphText } : item
    ));
  };

  const insertLinkText = () => {
    if (!linkText.trim() || !linkUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter both link text and URL.",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(linkUrl);
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return;
    }

    const linkMarkup = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${linkText}</a>`;
    onContentChange(content + linkMarkup);
    setLinkText("");
    setLinkUrl("");
    
    toast({
      title: "Success",
      description: "Link inserted into content!",
    });
  };

  const renderMediaItem = (item: MediaItem) => {
    if (item.type === 'image') {
      return (
        <img 
          src={item.url} 
          alt={item.caption || "Post image"} 
          className="w-full h-48 object-cover rounded-lg"
          onError={(e) => {
            console.error('Failed to load image:', item.url);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      );
    } else {
      const videoId = item.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return (
        <div className="relative w-full h-48">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video"
            className="w-full h-full rounded-lg"
            allowFullScreen
          />
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Write your post content here..."
          rows={10}
          required
        />
        <p className="text-xs text-gray-500">
          You can use HTML tags for formatting. Links and media items will be added separately below.
        </p>
      </div>

      {/* Link Text Insertion */}
      <div className="space-y-4">
        <Label>Insert Link Text</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Link text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="URL (https://...)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={insertLinkText}
            disabled={!linkText.trim() || !linkUrl.trim()}
          >
            <Link className="h-4 w-4 mr-2" />
            Insert Link
          </Button>
        </div>
      </div>

      {/* Media Upload Section */}
      <div className="space-y-4">
        <Label>Additional Media</Label>
        
        {/* Upload Controls */}
        <div className="flex flex-wrap gap-4">
          <div>
            <Label htmlFor="image-upload" className="cursor-pointer">
              <Button 
                type="button" 
                variant="outline" 
                disabled={isUploading}
                className="cursor-pointer"
                asChild
              >
                <span>
                  <Image className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Add Image"}
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

          <div className="flex gap-2">
            <Input
              placeholder="YouTube URL"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-64"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={addYouTubeVideo}
              disabled={!youtubeUrl.trim()}
            >
              <Video className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </div>
        </div>

        {/* Upload Status */}
        {isUploading && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Uploading image...</span>
          </div>
        )}

        {/* Media Items Display */}
        {mediaItems.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Media Items ({mediaItems.length})</h4>
            {mediaItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {renderMediaItem(item)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMediaItem(item.id)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Caption (optional)"
                  value={item.caption || ''}
                  onChange={(e) => updateMediaCaption(item.id, e.target.value)}
                />
                <Textarea
                  placeholder="Additional paragraph text (optional)"
                  value={item.paragraphText || ''}
                  onChange={(e) => updateMediaParagraph(item.id, e.target.value)}
                  rows={3}
                />
              </div>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Media Upload Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Images are automatically optimized and stored securely</li>
                <li>Supported formats: JPG, PNG, GIF, WebP, SVG (max 10MB)</li>
                <li>YouTube videos are embedded responsively</li>
                <li>Captions and additional text are optional but recommended for accessibility</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPostEditor;