import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { mockBlogPosts, localStorageHelpers, MockBlogPost } from '@/lib/mockData';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  author_id: string;
  author_name: string | null;
  category: string | null;
  tags: string[] | null;
  published_at: string | null;
  is_published: boolean | null;
  social_handles?: any;
  media_items?: any;
  created_at: string | null;
  updated_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  featured: boolean | null;
  reading_time: number | null;
}

export const useBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log('Fetching published posts from localStorage...');
      
      const allPosts = localStorageHelpers.getPosts();
      const publishedPosts = allPosts.filter(post => post.is_published);
      
      console.log('Fetched posts:', publishedPosts);
      setPosts(publishedPosts);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive",
      });
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return { posts, loading, refetch: fetchPosts };
};

export const useAdminBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllPosts = async () => {
    try {
      setLoading(true);
      console.log('Fetching all posts for admin...');
      
      const allPosts = localStorageHelpers.getPosts();
      console.log('Fetched admin posts:', allPosts);
      setPosts(allPosts);
    } catch (error: any) {
      console.error('Error fetching admin posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: {
    title: string;
    content: string;
    excerpt?: string;
    author_name: string;
    author_id: string;
    category?: string;
    tags?: string[];
    image_url?: string;
    is_published: boolean;
    social_handles?: any;
    media_items?: any;
  }) => {
    try {
      console.log('Creating post:', postData);

      // Generate slug from title
      const slug = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const newPost: MockBlogPost = {
        id: Date.now().toString(),
        slug,
        excerpt: postData.excerpt || postData.content.substring(0, 200) + "...",
        published_at: postData.is_published ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        meta_title: null,
        meta_description: null,
        featured: false,
        reading_time: Math.ceil(postData.content.split(' ').length / 200),
        ...postData,
      };

      const allPosts = localStorageHelpers.getPosts();
      const updatedPosts = [newPost, ...allPosts];
      localStorageHelpers.setPosts(updatedPosts);
      setPosts(updatedPosts);
      
      toast({
        title: "Success",
        description: "Blog post created successfully!",
      });

      return newPost;
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePost = async (id: string, updates: Partial<BlogPost>) => {
    try {
      console.log('Updating post:', id, updates);

      // Generate new slug if title is being updated
      if (updates.title) {
        updates.slug = updates.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      // Update published_at if publishing status changes
      if (updates.is_published !== undefined) {
        updates.published_at = updates.is_published ? new Date().toISOString() : null;
      }

      updates.updated_at = new Date().toISOString();

      const allPosts = localStorageHelpers.getPosts();
      const updatedPosts = allPosts.map(post => 
        post.id === id ? { ...post, ...updates } : post
      );
      
      const updatedPost = updatedPosts.find(post => post.id === id);
      if (!updatedPost) {
        throw new Error('Post not found');
      }

      localStorageHelpers.setPosts(updatedPosts);
      setPosts(updatedPosts);
      
      toast({
        title: "Success",
        description: "Blog post updated successfully!",
      });

      return updatedPost;
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update post",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePost = async (id: string) => {
    try {
      console.log('Deleting post:', id);

      const allPosts = localStorageHelpers.getPosts();
      const updatedPosts = allPosts.filter(post => post.id !== id);
      
      localStorageHelpers.setPosts(updatedPosts);
      setPosts(updatedPosts);
      
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getPostById = async (id: string): Promise<BlogPost | null> => {
    try {
      console.log('Fetching post by ID:', id);

      const allPosts = localStorageHelpers.getPosts();
      const post = allPosts.find(post => post.id === id || post.slug === id);
      
      if (!post) {
        throw new Error('Post not found');
      }

      console.log('Post fetched successfully:', post);
      return post;
    } catch (error: any) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch post",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  return { 
    posts, 
    loading, 
    createPost, 
    updatePost, 
    deletePost, 
    getPostById,
    refetch: fetchAllPosts 
  };
};