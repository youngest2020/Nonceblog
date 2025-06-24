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
        console.error('Error fetching posts:', error);
        setPosts([]);
        return;
      }

      console.log('Fetched posts:', data);
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Set up realtime subscription for published posts
    const channel = supabase
      .channel('public-blog-posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_posts',
          filter: 'is_published=eq.true'
        },
        (payload) => {
          console.log('Realtime update for published posts:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new.is_published) {
            setPosts(prev => [payload.new as BlogPost, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.is_published) {
              setPosts(prev => {
                const index = prev.findIndex(p => p.id === payload.new.id);
                if (index >= 0) {
                  const newPosts = [...prev];
                  newPosts[index] = payload.new as BlogPost;
                  return newPosts;
                } else {
                  return [payload.new as BlogPost, ...prev];
                }
              });
            } else {
              // Post was unpublished, remove it
              setPosts(prev => prev.filter(p => p.id !== payload.old.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        toast({
          title: "Error",
          description: "Failed to load posts",
          variant: "destructive",
        });
        setPosts([]);
        return;
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

      // Generate slug from title if not provided
      const slug = postData.slug || postData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('blog_posts')
        .insert({ ...postData, slug })
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

    // Set up realtime subscription for all posts (admin view)
    const channel = supabase
      .channel('admin-blog-posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_posts'
        },
        (payload) => {
          console.log('Realtime update for admin posts:', payload);
          
          if (payload.eventType === 'INSERT') {
            setPosts(prev => [payload.new as BlogPost, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPosts(prev => prev.map(post => 
              post.id === payload.new.id ? payload.new as BlogPost : post
            ));
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(post => post.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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