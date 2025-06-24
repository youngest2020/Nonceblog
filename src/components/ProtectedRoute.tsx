import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect when we're not loading and have determined auth state
    if (!loading) {
      console.log('ProtectedRoute check:', { 
        user: !!user, 
        profile: !!profile, 
        isAdmin: profile?.is_admin, 
        requireAdmin,
        userEmail: user?.email 
      });
      
      if (!user) {
        console.log('No user found, redirecting to secure-admin');
        navigate('/secure-admin', { replace: true });
        return;
      }

      // For admin routes, we need to check if profile exists and has admin privileges
      if (requireAdmin) {
        if (!profile) {
          console.log('Profile not loaded yet, waiting...');
          return; // Wait for profile to load
        }
        
        if (!profile.is_admin) {
          console.log('User is not admin, redirecting to secure-admin');
          navigate('/secure-admin', { replace: true });
          return;
        }
      }
    }
  }, [user, profile, loading, navigate, requireAdmin]);

  // Show loading while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Show loading while profile is being fetched for admin routes
  if (requireAdmin && user && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting (prevents flash)
  if (!user || (requireAdmin && (!profile || !profile.is_admin))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;