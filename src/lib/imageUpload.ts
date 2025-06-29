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

    console.log('=== BLOG IMAGE UPLOAD ===');
    console.log('File details:', { name: file.name, size: file.size, type: file.type });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be signed in to upload images');
    }

    console.log('✓ User authenticated:', user.email);

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    console.log('Uploading file:', fileName);

    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    if (!urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    console.log('✓ Image uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error: any) {
    console.error('=== UPLOAD FAILED ===');
    console.error('Error details:', error);
    throw error;
  }
};

export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    console.log('=== AVATAR UPLOAD ===');
    console.log('File details:', { name: file.name, size: file.size, type: file.type });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be signed in to upload images');
    }

    console.log('✓ User authenticated:', user.email);

    // Generate unique filename with user folder
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-avatar.${fileExt}`;

    console.log('Uploading avatar:', fileName);

    // Delete old avatar if it exists
    try {
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(file => `${userId}/${file.name}`);
        await supabase.storage.from('avatars').remove(filesToDelete);
        console.log('✓ Old avatars cleaned up');
      }
    } catch (error) {
      console.log('No old avatars to clean up');
    }

    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    if (!urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded avatar');
    }

    console.log('✓ Avatar uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error: any) {
    console.error('=== AVATAR UPLOAD FAILED ===');
    console.error('Error details:', error);
    throw error;
  }
};

export const deleteBlogImage = async (url: string): Promise<void> => {
  try {
    console.log('Deleting blog image:', url);
    
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

    console.log('✓ Blog image deleted successfully');
  } catch (error: any) {
    console.error('Blog image delete error:', error);
    throw error;
  }
};

export const deleteAvatar = async (url: string): Promise<void> => {
  try {
    console.log('Deleting avatar:', url);
    
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts.slice(-2).join('/'); // Get userId/filename

    const { error } = await supabase.storage
      .from('avatars')
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    console.log('✓ Avatar deleted successfully');
  } catch (error: any) {
    console.error('Avatar delete error:', error);
    throw error;
  }
};

// Helper function to validate image URLs
export const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase.co') && 
           (url.includes('blog-images') || url.includes('avatars'));
  } catch {
    return false;
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
    
    // Test avatars access
    if (buckets?.find(b => b.id === 'avatars')) {
      const { data: files, error: listError } = await supabase.storage
        .from('avatars')
        .list('', { limit: 1 });
      console.log('avatars access:', listError ? 'FAILED' : 'SUCCESS');
      if (listError) console.log('List error:', listError);
    }
    
    console.log('=== DEBUG COMPLETE ===');
  } catch (error) {
    console.error('Debug failed:', error);
  }
};