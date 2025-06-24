
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlogPost } from "@/lib/blogStore";

interface BlogPostCardProps {
  post: BlogPost;
}

const BlogPostCard = ({ post }: BlogPostCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      <Link to={`/post/${post.id}`} className="block">
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {post.category}
          </Badge>
          <span className="text-xs text-gray-500">
            {formatDate(post.publishedAt)}
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
          {post.excerpt}
        </p>
        <div className="flex flex-wrap gap-1">
          {post.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-gray-500 truncate">By {post.author}</span>
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
