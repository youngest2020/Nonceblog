import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { mockAdminUser, mockAdminProfile, localStorageHelpers, MockProfile } from '@/lib/mockData';

interface User {
  id: string;
  email: string | null;
  user_metadata?: {
    display_name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: MockProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<MockProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MockProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorageHelpers.getCurrentUser();
        const storedProfile = localStorageHelpers.getProfile();
        
        if (storedUser) {
          setUser(storedUser);
          setProfile(storedProfile || mockAdminProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Mock sign in:', email);
      
      // Mock authentication - only allow admin credentials
      if (email === 'admin@noncefirewall.com' && password === 'admin123') {
        setUser(mockAdminUser);
        setProfile(mockAdminProfile);
        
        localStorageHelpers.setCurrentUser(mockAdminUser);
        localStorageHelpers.setProfile(mockAdminProfile);
        
        toast({
          title: "Success",
          description: "Signed in successfully!",
        });
      } else {
        throw new Error('Invalid credentials. Use admin@noncefirewall.com / admin123');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      localStorageHelpers.clearAuth();
      setUser(null);
      setProfile(null);
      
      toast({
        title: "Success",
        description: "Signed out successfully!",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<MockProfile>) => {
    if (!user || !profile) return;

    try {
      console.log('Updating profile:', updates);
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      localStorageHelpers.setProfile(updatedProfile);
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};