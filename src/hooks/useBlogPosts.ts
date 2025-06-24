import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      console.log('Fetching published posts...');
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }

      console.log('Fetched posts:', data);
      setPosts(data || []);
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
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin posts:', error);
        throw error;
      }

      console.log('Fetched admin posts:', data);
      setPosts(data || []);
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

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([{
          ...postData,
          slug,
          published_at: postData.is_published ? new Date().toISOString() : null,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }

      console.log('Post created successfully:', data);
      setPosts(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Blog post created successfully!",
      });

      return data;
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

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating post:', error);
        throw error;
      }

      console.log('Post updated successfully:', data);
      setPosts(prev => prev.map(post => post.id === id ? data : post));
      
      toast({
        title: "Success",
        description: "Blog post updated successfully!",
      });

      return data;
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

      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }

      console.log('Post deleted successfully');
      setPosts(prev => prev.filter(post => post.id !== id));
      
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

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        throw error;
      }

      console.log('Post fetched successfully:', data);
      return data;
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