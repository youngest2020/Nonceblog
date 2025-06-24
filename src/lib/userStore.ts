
export interface UserProfile {
  id: string;
  displayName: string;
  profilePicture: string;
  email: string;
  bio: string;
}

// Mock user data (in a real app, this would be connected to a database)
let currentUser: UserProfile = {
  id: "admin-1",
  displayName: "Admin User",
  profilePicture: "",
  email: "admin@techblog.com",
  bio: "Blog administrator and content creator"
};

export const userStore = {
  getCurrentUser: () => currentUser,
  updateUser: (updates: Partial<UserProfile>) => {
    currentUser = { ...currentUser, ...updates };
    return currentUser;
  },
  uploadProfilePicture: (file: File): Promise<string> => {
    // In a real app, this would upload to a file storage service
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve(dataUrl);
      };
      reader.readAsDataURL(file);
    });
  }
};
