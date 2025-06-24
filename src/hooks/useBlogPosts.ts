import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert'];
type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update'];

export const useBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log('Fetching published posts from Supabase...');
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) {
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

  const createPost = async (postData: BlogPostInsert) => {
    try {
      console.log('Creating post:', postData);

      const { data, error } = await supabase
        .from('blog_posts')
        .insert(postData)
        .select()
        .single();

      if (error) {
        throw error;
      }

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

  const updatePost = async (id: string, updates: BlogPostUpdate) => {
    try {
      console.log('Updating post:', id, updates);

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPosts(prev => prev.map(post => 
        post.id === id ? data : post
      ));
      
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
        throw error;
      }

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
        .or(`id.eq.${id},slug.eq.${id}`)
        .single();

      if (error) {
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