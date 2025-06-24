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

    console.log('=== SUPABASE STORAGE DEBUG ===');
    console.log('File details:', { name: file.name, size: file.size, type: file.type });

    // 1. Check authentication first
    console.log('1. Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    if (!user) {
      throw new Error('You must be signed in to upload images.');
    }
    console.log('✓ User authenticated:', { id: user.id, email: user.email });

    // 2. Check user profile and admin status
    console.log('2. Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Profile error:', profileError);
    } else {
      console.log('✓ User profile:', { 
        id: profile.id, 
        email: profile.email, 
        is_admin: profile.is_admin 
      });
    }

    // 3. List all available buckets
    console.log('3. Listing all storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      throw new Error(`Storage access failed: ${bucketsError.message}`);
    }

    console.log('Available buckets:', buckets?.map(b => ({
      id: b.id,
      name: b.name,
      public: b.public,
      file_size_limit: b.file_size_limit,
      allowed_mime_types: b.allowed_mime_types
    })));

    // 4. Check if blog-images bucket exists
    const blogImagesBucket = buckets?.find(bucket => bucket.id === 'blog-images');
    if (!blogImagesBucket) {
      console.error('❌ blog-images bucket not found!');
      console.log('Available bucket IDs:', buckets?.map(b => b.id));
      throw new Error('Blog images storage bucket not found. Please create the "blog-images" bucket in your Supabase dashboard.');
    }
    
    console.log('✓ blog-images bucket found:', blogImagesBucket);

    // 5. Test bucket access by trying to list files
    console.log('4. Testing bucket access...');
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list('', { limit: 1 });

    if (listError) {
      console.error('Bucket access error:', listError);
      throw new Error(`Cannot access blog-images bucket: ${listError.message}. Check your RLS policies.`);
    }
    
    console.log('✓ Bucket access successful. Files count:', files?.length || 0);

    // 6. Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName; // Store directly in bucket root

    console.log('5. Uploading file:', { fileName, filePath });

    // 7. Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      if (uploadError.message.includes('Duplicate')) {
        // Retry with a different filename
        const retryFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        console.log('Retrying with filename:', retryFileName);
        
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

        console.log('✓ Image uploaded successfully (retry):', retryUrlData.publicUrl);
        return retryUrlData.publicUrl;
      }
      
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 8. Get the public URL
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    if (!urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    console.log('✓ Image uploaded successfully:', urlData.publicUrl);
    console.log('=== UPLOAD COMPLETE ===');
    return urlData.publicUrl;
    
  } catch (error: any) {
    console.error('=== UPLOAD FAILED ===');
    console.error('Error details:', error);
    
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

// Debug function to check storage setup
export const debugStorageSetup = async () => {
  try {
    console.log('=== STORAGE SETUP DEBUG ===');
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User:', user?.email || 'Not authenticated');
    
    // List buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    console.log('Buckets:', buckets?.map(b => b.id) || 'Error:', error);
    
    // Test blog-images access
    if (buckets?.find(b => b.id === 'blog-images')) {
      const { data: files, error: listError } = await supabase.storage
        .from('blog-images')
        .list('', { limit: 1 });
      console.log('blog-images access:', listError ? 'FAILED' : 'SUCCESS');
      if (listError) console.log('List error:', listError);
    }
    
    console.log('=== DEBUG COMPLETE ===');
  } catch (error) {
    console.error('Debug failed:', error);
  }
};