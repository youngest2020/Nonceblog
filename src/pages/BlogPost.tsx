import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import BlogHeader from "@/components/BlogHeader";
import CommentsSection from "@/components/CommentsSection";
import SocialMediaLinks from "@/components/SocialMediaLinks";
import YouTubeModal from "@/components/YouTubeModal";
import PromotionalPopup from "@/components/PromotionalPopup";
import { blogStore } from "@/lib/blogStore";
import { userStore } from "@/lib/userStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Play } from "lucide-react";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const post = id ? blogStore.getPostById(id) : null;
  const currentUser = userStore.getCurrentUser();
  const postAuthor = post ? blogStore.getUserById(post.authorId) : null;
  
  const [youtubeModal, setYoutubeModal] = useState<{isOpen: boolean, url: string, title?: string}>({
    isOpen: false,
    url: '',
    title: ''
  });

  // Load promotion settings
  const promotionSettings = JSON.parse(localStorage.getItem('promotionSettings') || '{"isEnabled": false}');

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
          <p className="text-gray-600 mb-6 sm:mb-8">The blog post you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>← Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderMediaItem = (item: any) => {
    if (item.type === 'image') {
      return (
        <div className="my-4 sm:my-6">
          <img 
            src={item.url} 
            alt={item.caption || "Post image"} 
            className="w-full h-auto rounded-lg shadow-lg"
          />
          {item.caption && (
            <p className="text-sm text-gray-600 mt-2 text-center italic">{item.caption}</p>
          )}
          {item.paragraphText && (
            <div 
              className="mt-4 prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: item.paragraphText }}
            />
          )}
        </div>
      );
    } else if (item.type === 'video') {
      const videoId = item.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return (
        <div className="my-4 sm:my-6">
          <div className="relative w-full group cursor-pointer" style={{ paddingBottom: '56.25%' }}>
            <div 
              className="absolute inset-0 bg-black rounded-lg overflow-hidden"
              onClick={() => setYoutubeModal({isOpen: true, url: item.url, title: item.caption})}
            >
              <img 
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                <div className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 text-white fill-current" />
                </div>
              </div>
            </div>
          </div>
          {item.caption && (
            <p className="text-sm text-gray-600 mt-2 text-center italic">{item.caption}</p>
          )}
          {item.paragraphText && (
            <div 
              className="mt-4 prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: item.paragraphText }}
            />
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 sm:mb-8 transition-colors">
          ← Back to Blog
        </Link>

        {/* Article Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge variant="secondary">{post.category}</Badge>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500 text-sm">{formatDate(post.publishedAt)}</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 mb-4 sm:mb-6">
            {post.excerpt}
          </p>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 sm:pb-6 gap-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={postAuthor?.profilePicture || currentUser.profilePicture} alt={post.author} />
                <AvatarFallback>
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900 text-sm sm:text-base">By {post.author}</p>
                <p className="text-xs sm:text-sm text-gray-500">Published on {formatDate(post.publishedAt)}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="mb-6 sm:mb-8">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-full h-48 sm:h-64 lg:h-96 object-cover rounded-lg shadow-lg"
          />
        </div>

        {/* Article Content */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div 
            className="prose prose-sm sm:prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          
          {/* Additional Media Items */}
          {post.mediaItems && post.mediaItems.length > 0 && (
            <div className="mt-6 sm:mt-8">
              {post.mediaItems.map((item) => (
                <div key={item.id}>
                  {renderMediaItem(item)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Social Media Links */}
        {post.socialHandles && (
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <SocialMediaLinks socialHandles={post.socialHandles} />
          </div>
        )}

        {/* Comments and Social Interactions */}
        <CommentsSection postId={post.id} />

        {/* Article Footer */}
        <footer className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enjoyed this article?</h3>
              <div className="text-sm text-gray-600">
                Share it with your network and leave a comment below!
              </div>
            </div>
            <Link to="/">
              <Button className="w-full sm:w-auto">Read More Articles</Button>
            </Link>
          </div>
        </footer>
      </article>

      {/* YouTube Modal */}
      <YouTubeModal
        isOpen={youtubeModal.isOpen}
        onClose={() => setYoutubeModal({isOpen: false, url: '', title: ''})}
        videoUrl={youtubeModal.url}
        title={youtubeModal.title}
      />

      {/* Promotional Popup */}
      <PromotionalPopup {...promotionSettings} />
    </div>
  );
};

export default BlogPost;
