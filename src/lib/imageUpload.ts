import { supabase } from '@/integrations/supabase/client';

export const uploadBlogImage = async (file: File): Promise<string> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    console.log('Uploading image to Supabase Storage:', file.name);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `blog-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    console.log('Image uploaded successfully:', data.publicUrl);
    return data.publicUrl;
  } catch (error: any) {
    console.error('Image upload error:', error);
    throw error;
  }
};

export const deleteBlogImage = async (url: string): Promise<void> => {
  try {
    console.log('Deleting image from Supabase Storage:', url);
    
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `blog-images/${fileName}`;

    const { error } = await supabase.storage
      .from('blog-images')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    console.log('Image deleted successfully');
  } catch (error: any) {
    console.error('Image delete error:', error);
    throw error;
  }
};