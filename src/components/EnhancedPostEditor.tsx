import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Video, X, Link } from "lucide-react";
import { blogStore } from "@/lib/blogStore";

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

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await blogStore.uploadImage(file);
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image.",
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
            placeholder="URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={insertLinkText}
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
            >
              <Video className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </div>
        </div>

        {/* Media Items Display */}
        {mediaItems.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Media Items</h4>
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
                    className="ml-2"
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
      </div>
    </div>
  );
};

export default EnhancedPostEditor;
