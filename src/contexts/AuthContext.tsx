import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean | null;
  bio: string | null;
  profile_picture: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const { toast } = useToast();

  // Fetch user profile from database with timeout and error handling
  const fetchProfile = async (userId: string, retries = 3): Promise<Profile | null> => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching profile:', error);
        if (retries > 0) {
          console.log(`Retrying profile fetch, ${retries} attempts left`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retries - 1);
        }
        return null;
      }

      console.log('Profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (retries > 0) {
        console.log(`Retrying profile fetch after error, ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(userId, retries - 1);
      }
      return null;
    }
  };

  // Initialize auth state with better error handling
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Set a maximum initialization time
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Auth initialization timeout, proceeding without session');
            setLoading(false);
            setInitializing(false);
          }
        }, 15000);

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        } else if (session?.user && mounted) {
          console.log('Initial session found:', session.user.email);
          setUser(session.user);
          
          // Fetch profile with timeout
          try {
            const userProfile = await fetchProfile(session.user.id);
            if (mounted) {
              setProfile(userProfile);
            }
          } catch (profileError) {
            console.error('Failed to fetch profile during initialization:', profileError);
            // Continue without profile rather than blocking
          }
        } else {
          console.log('No initial session found');
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            
            if (!mounted) return;

            if (session?.user) {
              setUser(session.user);
              try {
                const userProfile = await fetchProfile(session.user.id);
                if (mounted) {
                  setProfile(userProfile);
                }
              } catch (profileError) {
                console.error('Failed to fetch profile on auth change:', profileError);
                // Set profile to null but don't block the auth flow
                setProfile(null);
              }
            } else {
              setUser(null);
              setProfile(null);
            }
          }
        );

        if (mounted) {
          setLoading(false);
          setInitializing(false);
          clearTimeout(timeoutId);
        }

        return () => {
          subscription.unsubscribe();
          clearTimeout(timeoutId);
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setInitializing(false);
          clearTimeout(timeoutId);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Signing in:', email);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout')), 30000)
      );
      
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;

      if (error) throw error;

      if (data.user) {
        console.log('Sign in successful, user ID:', data.user.id);
        try {
          const userProfile = await fetchProfile(data.user.id);
          setProfile(userProfile);
        } catch (profileError) {
          console.error('Failed to fetch profile after sign in:', profileError);
          // Continue with sign in even if profile fetch fails
        }
      }

      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
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
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 10000)
      );
      
      const signOutPromise = supabase.auth.signOut();
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any;
      
      if (error) throw error;

      setUser(null);
      setProfile(null);
      
      toast({
        title: "Success",
        description: "Signed out successfully!",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Force local sign out even if server request fails
      setUser(null);
      setProfile(null);
      toast({
        title: "Warning",
        description: "Signed out locally. Please refresh if you experience issues.",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      console.log('Updating profile:', updates);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile update timeout')), 15000)
      );
      
      const updatePromise = supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      const { data, error } = await Promise.race([updatePromise, timeoutPromise]) as any;

      if (error) throw error;

      setProfile(data);
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
    loading: loading || initializing,
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