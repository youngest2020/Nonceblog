import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  author_name: string | null;
  published_at: string | null;
  created_at: string | null;
  category: string | null;
  tags: string[] | null;
  image_url: string | null;
}

interface BlogPostCardProps {
  post: BlogPost;
}

const BlogPostCard = ({ post }: BlogPostCardProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const defaultImage = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop";

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      <Link to={`/post/${post.id}`} className="block">
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img 
            src={post.image_url || defaultImage} 
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = defaultImage;
            }}
          />
        </div>
      </Link>
      
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {post.category || "General"}
          </Badge>
          <span className="text-xs text-gray-500">
            {formatDate(post.published_at || post.created_at)}
          </span>
        </div>
        <Link to={`/post/${post.id}`}>
          <h2 className="text-lg sm:text-xl font-bold leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-gray-600 line-clamp-3 mb-3 text-sm sm:text-base">
          {post.excerpt || "No excerpt available"}
        </p>
        <div className="flex flex-wrap gap-1">
          {post.tags && post.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-gray-500 truncate">
            By {post.author_name || "Unknown Author"}
          </span>
          <Link 
            to={`/post/${post.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors whitespace-nowrap ml-2"
          >
            Read more →
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BlogPostCard;