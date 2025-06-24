import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  profile_picture?: string;
  bio?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      console.log('Mock: Fetching profiles from localStorage...');
      const storedProfiles = localStorage.getItem('profiles');
      const profiles = storedProfiles ? JSON.parse(storedProfiles) : [];
      setProfiles(profiles);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: { email: string; password: string; displayName: string }) => {
    try {
      console.log('Mock: Creating user:', userData.email);
      
      const newProfile: Profile = {
        id: Date.now().toString(),
        email: userData.email,
        display_name: userData.displayName,
        profile_picture: '',
        bio: '',
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const storedProfiles = localStorage.getItem('profiles');
      const profiles = storedProfiles ? JSON.parse(storedProfiles) : [];
      profiles.push(newProfile);
      localStorage.setItem('profiles', JSON.stringify(profiles));
      
      setProfiles(profiles);

      toast({
        title: "Success",
        description: `User ${userData.displayName} created successfully! (Mock implementation)`,
      });

      return { user: newProfile };
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      console.log('Mock: Deleting user:', userId);
      
      const storedProfiles = localStorage.getItem('profiles');
      const profiles = storedProfiles ? JSON.parse(storedProfiles) : [];
      const updatedProfiles = profiles.filter((profile: Profile) => profile.id !== userId);
      localStorage.setItem('profiles', JSON.stringify(updatedProfiles));
      
      setProfiles(updatedProfiles);
      
      toast({
        title: "Success",
        description: "User deleted successfully (Mock implementation)",
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return { profiles, loading, createUser, deleteUser, refetch: fetchProfiles };
};