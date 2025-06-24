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

    console.log('Mock uploading image:', file.name);

    // Mock upload - convert to data URL for local storage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        console.log('Mock image uploaded successfully');
        resolve(dataUrl);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    throw error;
  }
};

export const deleteBlogImage = async (url: string): Promise<void> => {
  try {
    console.log('Mock deleting image:', url);
    // Mock implementation - no actual deletion needed for data URLs
  } catch (error: any) {
    console.error('Image delete error:', error);
    throw error;
  }
};