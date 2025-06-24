
import { useState } from "react";
import BlogHeader from "@/components/BlogHeader";
import BlogPostCard from "@/components/BlogPostCard";
import FeaturedPostsCarousel from "@/components/FeaturedPostsCarousel";
import ContactForm from "@/components/ContactForm";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Index = () => {
  const { posts, loading } = useBlogPosts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const categories = ["all", ...Array.from(new Set(posts.map(post => post.category || "").filter(Boolean)))];
  
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.excerpt || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BlogHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 animate-fade-in">
            Welcome to Nonce Firewall Blogs
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-6 sm:mb-8 animate-fade-in px-4">
            Stay secure with cybersecurity insights, tech news, and industry updates
          </p>
          <div className="max-w-sm sm:max-w-md mx-auto px-4">
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/70 backdrop-blur-sm w-full"
            />
          </div>
        </div>
      </section>

      {/* Featured Posts Carousel - Only show if there are posts */}
      {posts.length > 0 && (
        <FeaturedPostsCarousel posts={posts.map(post => ({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt || "",
          content: post.content || "",
          author: post.author_name || "Unknown",
          authorId: post.author_id,
          category: post.category || "General",
          tags: post.tags || [],
          imageUrl: post.image_url || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop",
          publishedAt: post.published_at || post.created_at || new Date().toISOString(),
          published: post.is_published || false,
          mediaItems: post.media_items || [],
          socialHandles: post.social_handles || {}
        }))} />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Category Filter - Only show if there are posts */}
        {posts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize text-xs sm:text-sm"
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        {/* Posts Grid or Empty State */}
        {posts.length === 0 ? (
          <div className="text-center py-16 sm:py-24 px-4">
            <div className="max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No posts yet</h3>
              <p className="text-gray-600 mb-8">
                Welcome to Nonce Firewall Blogs! We're just getting started. 
                Check back soon for cybersecurity insights, tech news, and industry updates.
              </p>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <strong>Admin:</strong> Ready to publish your first post? 
                  <br />
                  <a href="/secure-admin" className="underline hover:text-blue-600">
                    Sign in to the admin panel
                  </a> to get started.
                </p>
              </div>
            </div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredPosts.map((post) => (
              <div key={post.id} className="animate-fade-in">
                <BlogPostCard post={{
                  id: post.id,
                  title: post.title,
                  excerpt: post.excerpt || "",
                  content: post.content || "",
                  author: post.author_name || "Unknown",
                  authorId: post.author_id,
                  category: post.category || "General",
                  tags: post.tags || [],
                  imageUrl: post.image_url || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop",
                  publishedAt: post.published_at || post.created_at || new Date().toISOString(),
                  published: post.is_published || false,
                  mediaItems: post.media_items || [],
                  socialHandles: post.social_handles || {}
                }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 px-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Call to Action - Only show if there are posts */}
        {posts.length > 0 && (
          <section className="mt-16 sm:mt-20 bg-white rounded-2xl shadow-sm border p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-sm sm:text-base">
              Get the latest cybersecurity insights and tech updates delivered straight to your inbox. 
              Join our community of security professionals and tech enthusiasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input placeholder="Enter your email" className="flex-1" />
              <Button className="sm:w-auto">Subscribe</Button>
            </div>
          </section>
        )}
      </main>

      {/* Contact Form */}
      <ContactForm />
    </div>
  );
};

export default Index;
