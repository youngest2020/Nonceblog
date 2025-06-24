
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { commentsStore } from "@/lib/commentsStore";
import { useToast } from "@/hooks/use-toast";
import { User, Heart, Share, MessageSquare } from "lucide-react";

interface CommentsSectionProps {
  postId: string;
}

const CommentsSection = ({ postId }: CommentsSectionProps) => {
  const { toast } = useToast();
  const [interactions, setInteractions] = useState(commentsStore.getPostInteractions(postId));
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");

  const handleLike = () => {
    const newLikes = commentsStore.likePost(postId);
    setInteractions(prev => ({ ...prev, likes: newLikes }));
    toast({
      title: "Liked!",
      description: "You liked this post.",
    });
  };

  const handleShare = () => {
    const newShares = commentsStore.sharePost(postId);
    setInteractions(prev => ({ ...prev, shares: newShares }));
    
    if (navigator.share) {
      navigator.share({
        title: "Check out this blog post",
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Post link copied to clipboard.",
      });
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !authorName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both name and comment.",
        variant: "destructive",
      });
      return;
    }

    const comment = commentsStore.addComment(postId, authorName, newComment);
    setInteractions(prev => ({
      ...prev,
      comments: [comment, ...prev.comments]
    }));
    setNewComment("");
    setAuthorName("");
    
    toast({
      title: "Comment added!",
      description: "Your comment has been posted.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Social Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button variant="ghost" onClick={handleLike} className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>{interactions.likes}</span>
              </Button>
              <Button variant="ghost" onClick={handleShare} className="flex items-center space-x-2">
                <Share className="h-5 w-5" />
                <span>{interactions.shares}</span>
              </Button>
              <div className="flex items-center space-x-2 text-gray-600">
                <MessageSquare className="h-5 w-5" />
                <span>{interactions.comments.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Comment */}
      <Card>
        <CardHeader>
          <CardTitle>Leave a Comment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Your name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Textarea
            placeholder="Write your comment here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAddComment}>Post Comment</Button>
        </CardContent>
      </Card>

      {/* Comments List */}
      {interactions.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comments ({interactions.comments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interactions.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3 pb-4 border-b border-gray-100 last:border-b-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommentsSection;
