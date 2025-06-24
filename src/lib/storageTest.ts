import { supabase } from '@/integrations/supabase/client';

export const testStorageSetup = async () => {
  console.log('=== COMPREHENSIVE STORAGE TEST ===');
  
  try {
    // 1. Test authentication
    console.log('1. Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Auth error:', authError);
      return { success: false, error: 'Authentication failed' };
    }
    if (!user) {
      console.error('❌ No authenticated user');
      return { success: false, error: 'No authenticated user' };
    }
    console.log('✅ User authenticated:', user.email);

    // 2. List all buckets
    console.log('2. Listing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return { success: false, error: `Bucket listing failed: ${bucketsError.message}` };
    }
    
    console.log('Available buckets:', buckets?.map(b => ({
      id: b.id,
      name: b.name,
      public: b.public,
      file_size_limit: b.file_size_limit,
      allowed_mime_types: b.allowed_mime_types
    })));

    // 3. Check for blog-images bucket
    const blogImagesBucket = buckets?.find(b => b.id === 'blog-images');
    if (!blogImagesBucket) {
      console.error('❌ blog-images bucket not found');
      return { success: false, error: 'blog-images bucket does not exist' };
    }
    console.log('✅ blog-images bucket found:', blogImagesBucket);

    // 4. Test bucket access
    console.log('3. Testing bucket access...');
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list('', { limit: 5 });

    if (listError) {
      console.error('❌ Bucket access error:', listError);
      return { success: false, error: `Bucket access failed: ${listError.message}` };
    }
    
    console.log('✅ Bucket access successful. Current files:', files?.length || 0);
    if (files && files.length > 0) {
      console.log('Existing files:', files.map(f => f.name));
    }

    // 5. Test upload with a small test file
    console.log('4. Testing file upload...');
    const testBlob = new Blob(['test content'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test-upload.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(`test-${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      return { success: false, error: `Upload test failed: ${uploadError.message}` };
    }
    
    console.log('✅ Upload test successful:', uploadData.path);

    // 6. Test public URL generation
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(uploadData.path);

    if (!urlData.publicUrl) {
      console.error('❌ Failed to generate public URL');
      return { success: false, error: 'Failed to generate public URL' };
    }
    
    console.log('✅ Public URL generated:', urlData.publicUrl);

    // 7. Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([uploadData.path]);

    if (deleteError) {
      console.warn('⚠️ Failed to clean up test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }

    console.log('=== ALL TESTS PASSED ===');
    return { 
      success: true, 
      message: 'Storage setup is working correctly',
      bucketInfo: blogImagesBucket
    };

  } catch (error: any) {
    console.error('❌ Unexpected error during storage test:', error);
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
};

export const testImageUpload = async (file: File) => {
  console.log('=== TESTING ACTUAL IMAGE UPLOAD ===');
  
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `test-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    console.log('Uploading as:', fileName);

    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(uploadData.path);

    console.log('✅ Image uploaded successfully:', urlData.publicUrl);
    
    return {
      success: true,
      url: urlData.publicUrl,
      path: uploadData.path
    };

  } catch (error: any) {
    console.error('❌ Image upload test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};