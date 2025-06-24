import { supabase } from '@/integrations/supabase/client';
import { ensureBlogImagesBucket } from './storageDiagnostic';

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

    // 3. Ensure blog-images bucket exists (auto-create if needed)
    console.log('3. Ensuring blog-images bucket exists...');
    const bucketResult = await ensureBlogImagesBucket();
    if (!bucketResult.success) {
      console.error('❌ Failed to ensure bucket exists:', bucketResult.error);
      throw new Error(`Storage setup failed: ${bucketResult.error}`);
    }
    
    if (bucketResult.created) {
      console.log('✓ blog-images bucket was created automatically');
    } else {
      console.log('✓ blog-images bucket already exists');
    }

    // 4. List all available buckets for verification
    console.log('4. Verifying storage access...');
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

    // 5. Verify blog-images bucket exists
    const blogImagesBucket = buckets?.find(bucket => bucket.id === 'blog-images');
    if (!blogImagesBucket) {
      console.error('❌ blog-images bucket still not found after creation attempt!');
      console.log('Available bucket IDs:', buckets?.map(b => b.id));
      throw new Error('Blog images storage bucket could not be created. Please check your Supabase permissions or create the "blog-images" bucket manually in your Supabase dashboard.');
    }
    
    console.log('✓ blog-images bucket confirmed:', blogImagesBucket);

    // 6. Test bucket access by trying to list files
    console.log('5. Testing bucket access...');
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list('', { limit: 1 });

    if (listError) {
      console.error('Bucket access error:', listError);
      throw new Error(`Cannot access blog-images bucket: ${listError.message}. Check your RLS policies.`);
    }
    
    console.log('✓ Bucket access successful. Files count:', files?.length || 0);

    // 7. Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName; // Store directly in bucket root

    console.log('6. Uploading file:', { fileName, filePath });

    // 8. Upload the file with retry logic
    let uploadData;
    let uploadError;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`Upload attempt ${attempt}/3...`);
      
      const currentFileName = attempt === 1 ? fileName : `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const result = await supabase.storage
        .from('blog-images')
        .upload(currentFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (result.error) {
        uploadError = result.error;
        console.error(`Upload attempt ${attempt} failed:`, result.error);
        
        if (result.error.message.includes('Duplicate') && attempt < 3) {
          console.log('Retrying with different filename...');
          continue;
        }
      } else {
        uploadData = result.data;
        uploadError = null;
        console.log(`✓ Upload successful on attempt ${attempt}:`, uploadData.path);
        break;
      }
    }

    if (uploadError) {
      console.error('All upload attempts failed:', uploadError);
      throw new Error(`Upload failed after 3 attempts: ${uploadError.message}`);
    }

    if (!uploadData) {
      throw new Error('Upload failed: No data returned');
    }

    // 9. Get the public URL
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(uploadData.path);

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
      throw new Error('Storage configuration error. The blog-images bucket could not be accessed or created. Please try using the "Create Bucket" button in the diagnostic tools.');
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