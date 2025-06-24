import { supabase } from '@/integrations/supabase/client';

export const runStorageDiagnostic = async () => {
  console.log('=== COMPREHENSIVE STORAGE DIAGNOSTIC ===');
  
  try {
    // 1. Check authentication
    console.log('1. Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Auth error:', authError);
      return { success: false, error: 'Authentication failed', details: authError };
    }
    if (!user) {
      console.error('❌ No authenticated user');
      return { success: false, error: 'No authenticated user' };
    }
    console.log('✅ User authenticated:', user.email);

    // 2. Check user profile and admin status
    console.log('2. Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ User profile:', { 
        id: profile.id, 
        email: profile.email, 
        is_admin: profile.is_admin 
      });
    }

    // 3. List ALL buckets with detailed info
    console.log('3. Listing all storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return { success: false, error: `Bucket listing failed: ${bucketsError.message}`, details: bucketsError };
    }

    console.log('📦 Available buckets:');
    buckets?.forEach((bucket, index) => {
      console.log(`  ${index + 1}. ID: "${bucket.id}"`);
      console.log(`     Name: "${bucket.name}"`);
      console.log(`     Public: ${bucket.public}`);
      console.log(`     Created: ${bucket.created_at}`);
      console.log(`     Updated: ${bucket.updated_at}`);
      console.log(`     File size limit: ${Math.round((bucket.file_size_limit || 0) / 1024 / 1024)}MB`);
      console.log(`     Allowed MIME types: ${bucket.allowed_mime_types || 'All'}`);
      console.log('     ---');
    });

    // 4. Check for blog-images bucket specifically
    const blogImagesBucket = buckets?.find(b => b.id === 'blog-images');
    const similarBuckets = buckets?.filter(b => 
      b.id.toLowerCase().includes('blog') || 
      b.id.toLowerCase().includes('image') ||
      b.name?.toLowerCase().includes('blog') ||
      b.name?.toLowerCase().includes('image')
    );

    console.log('4. Checking for blog-images bucket...');
    if (!blogImagesBucket) {
      console.error('❌ blog-images bucket not found!');
      console.log('🔍 Similar buckets found:', similarBuckets?.map(b => ({ id: b.id, name: b.name })));
      
      if (similarBuckets && similarBuckets.length > 0) {
        console.log('💡 You might want to use one of these existing buckets or rename them to "blog-images"');
      }
      
      return { 
        success: false, 
        error: 'blog-images bucket not found',
        availableBuckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })),
        similarBuckets: similarBuckets?.map(b => ({ id: b.id, name: b.name, public: b.public }))
      };
    }
    
    console.log('✅ blog-images bucket found:', {
      id: blogImagesBucket.id,
      name: blogImagesBucket.name,
      public: blogImagesBucket.public,
      fileLimit: Math.round((blogImagesBucket.file_size_limit || 0) / 1024 / 1024) + 'MB'
    });

    // 5. Test bucket access by listing files
    console.log('5. Testing bucket access...');
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list('', { limit: 10 });

    if (listError) {
      console.error('❌ Bucket access error:', listError);
      console.log('🔍 This might be a Row Level Security (RLS) policy issue');
      return { 
        success: false, 
        error: `Bucket access failed: ${listError.message}`,
        details: listError,
        bucketExists: true,
        suggestion: 'Check your RLS policies for the storage.objects table'
      };
    }
    
    console.log('✅ Bucket access successful!');
    console.log(`📁 Current files in bucket: ${files?.length || 0}`);
    if (files && files.length > 0) {
      console.log('📄 Files:', files.slice(0, 5).map(f => f.name));
      if (files.length > 5) {
        console.log(`   ... and ${files.length - 5} more files`);
      }
    }

    // 6. Test upload with a tiny test file
    console.log('6. Testing file upload...');
    const testContent = `Test upload at ${new Date().toISOString()}`;
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `diagnostic-test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(testFileName, testBlob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      return { 
        success: false, 
        error: `Upload test failed: ${uploadError.message}`,
        details: uploadError,
        bucketExists: true,
        bucketAccessible: true
      };
    }
    
    console.log('✅ Upload test successful:', uploadData.path);

    // 7. Test public URL generation
    console.log('7. Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(uploadData.path);

    if (!urlData.publicUrl) {
      console.error('❌ Failed to generate public URL');
      return { 
        success: false, 
        error: 'Failed to generate public URL',
        bucketExists: true,
        bucketAccessible: true,
        uploadWorks: true
      };
    }
    
    console.log('✅ Public URL generated:', urlData.publicUrl);

    // 8. Test URL accessibility
    console.log('8. Testing URL accessibility...');
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log('✅ Public URL is accessible');
      } else {
        console.warn('⚠️ Public URL returned status:', response.status);
      }
    } catch (fetchError) {
      console.warn('⚠️ Could not test URL accessibility:', fetchError);
    }

    // 9. Clean up test file
    console.log('9. Cleaning up test file...');
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
      bucketInfo: blogImagesBucket,
      testUrl: urlData.publicUrl
    };

  } catch (error: any) {
    console.error('❌ Unexpected error during diagnostic:', error);
    return { 
      success: false, 
      error: `Unexpected error: ${error.message}`,
      details: error
    };
  }
};

export const createBlogImagesBucket = async () => {
  console.log('=== CREATING BLOG-IMAGES BUCKET ===');
  
  try {
    const { data, error } = await supabase.storage.createBucket('blog-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
      console.error('❌ Failed to create bucket:', error);
      return { success: false, error: error.message, details: error };
    }

    console.log('✅ Bucket created successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Unexpected error creating bucket:', error);
    return { success: false, error: error.message, details: error };
  }
};

export const fixStoragePermissions = async () => {
  console.log('=== CHECKING STORAGE PERMISSIONS ===');
  
  // This function will help identify permission issues
  // Note: RLS policies need to be set up in Supabase dashboard
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    // Test different operations to see which ones fail
    const tests = [];

    // Test 1: List buckets
    try {
      await supabase.storage.listBuckets();
      tests.push({ operation: 'listBuckets', success: true });
    } catch (error: any) {
      tests.push({ operation: 'listBuckets', success: false, error: error.message });
    }

    // Test 2: List files in blog-images
    try {
      await supabase.storage.from('blog-images').list('', { limit: 1 });
      tests.push({ operation: 'listFiles', success: true });
    } catch (error: any) {
      tests.push({ operation: 'listFiles', success: false, error: error.message });
    }

    // Test 3: Upload test
    try {
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      await supabase.storage.from('blog-images').upload(`test-${Date.now()}.txt`, testBlob);
      tests.push({ operation: 'upload', success: true });
    } catch (error: any) {
      tests.push({ operation: 'upload', success: false, error: error.message });
    }

    console.log('Permission test results:', tests);
    return { success: true, tests };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
};