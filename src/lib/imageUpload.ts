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

    console.log('Uploading blog image to Supabase Storage:', file.name);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `blog-images/${fileName}`;

    // Check if bucket exists, if not provide helpful error
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError);
      throw new Error('Unable to access storage. Please try again.');
    }

    const blogImagesBucket = buckets?.find(bucket => bucket.id === 'blog-images');
    if (!blogImagesBucket) {
      throw new Error('Blog images storage bucket not found. Please contact support.');
    }

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      if (uploadError.message.includes('Duplicate')) {
        // Retry with a different filename
        const retryFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const retryFilePath = `blog-images/${retryFileName}`;
        
        const { error: retryError } = await supabase.storage
          .from('blog-images')
          .upload(retryFilePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (retryError) {
          throw retryError;
        }
        
        const { data } = supabase.storage
          .from('blog-images')
          .getPublicUrl(retryFilePath);

        console.log('Blog image uploaded successfully (retry):', data.publicUrl);
        return data.publicUrl;
      }
      
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    console.log('Blog image uploaded successfully:', data.publicUrl);
    return data.publicUrl;
  } catch (error: any) {
    console.error('Blog image upload error:', error);
    throw error;
  }
};

export const deleteBlogImage = async (url: string): Promise<void> => {
  try {
    console.log('Deleting blog image from Supabase Storage:', url);
    
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `blog-images/${fileName}`;

    const { error } = await supabase.storage
      .from('blog-images')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    console.log('Blog image deleted successfully');
  } catch (error: any) {
    console.error('Blog image delete error:', error);
    throw error;
  }
};

// Helper function to validate image URLs
export const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase.co') && url.includes('blog-images');
  } catch {
    return false;
  }
};

// Helper function to get image metadata
export const getImageMetadata = async (url: string) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      size: response.headers.get('content-length'),
      type: response.headers.get('content-type'),
      lastModified: response.headers.get('last-modified')
    };
  } catch (error) {
    console.error('Error getting image metadata:', error);
    return null;
  }
};