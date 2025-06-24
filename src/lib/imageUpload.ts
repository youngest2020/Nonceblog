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

    console.log('Starting blog image upload process...');
    console.log('File details:', { name: file.name, size: file.size, type: file.type });

    // Test Supabase connection first
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication required. Please sign in again.');
      }
      if (!user) {
        throw new Error('You must be signed in to upload images.');
      }
      console.log('User authenticated:', user.email);
    } catch (authError) {
      console.error('Authentication check failed:', authError);
      throw new Error('Authentication failed. Please sign in again.');
    }

    // Check if bucket exists
    console.log('Checking if blog-images bucket exists...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        throw new Error('Unable to access storage. Please try again.');
      }

      console.log('Available buckets:', buckets?.map(b => b.id));
      
      const blogImagesBucket = buckets?.find(bucket => bucket.id === 'blog-images');
      if (!blogImagesBucket) {
        console.error('blog-images bucket not found in:', buckets?.map(b => b.id));
        throw new Error('Blog images storage bucket not found. Please contact support.');
      }
      
      console.log('blog-images bucket found:', blogImagesBucket);
    } catch (bucketError) {
      console.error('Bucket check failed:', bucketError);
      throw bucketError;
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName; // Store directly in bucket root for simplicity

    console.log('Uploading to path:', filePath);

    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      
      if (uploadError.message.includes('Duplicate')) {
        // Retry with a different filename
        const retryFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        console.log('Retrying upload with filename:', retryFileName);
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from('blog-images')
          .upload(retryFileName, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (retryError) {
          console.error('Retry upload failed:', retryError);
          throw new Error(`Upload failed: ${retryError.message}`);
        }
        
        const { data: retryUrlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(retryFileName);

        console.log('Image uploaded successfully (retry):', retryUrlData.publicUrl);
        return retryUrlData.publicUrl;
      }
      
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    if (!urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    console.log('Image uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error: any) {
    console.error('Blog image upload error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('JWT')) {
      throw new Error('Session expired. Please sign out and sign in again.');
    }
    if (error.message.includes('network')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    if (error.message.includes('bucket')) {
      throw new Error('Storage configuration error. Please contact support.');
    }
    
    throw error;
  }
};

export const deleteBlogImage = async (url: string): Promise<void> => {
  try {
    console.log('Deleting blog image from Supabase Storage:', url);
    
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from('blog-images')
      .remove([fileName]);

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