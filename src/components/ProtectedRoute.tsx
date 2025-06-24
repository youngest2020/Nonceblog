
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
      if (!user) {
        console.log('No user found, redirecting to secure-admin');
        navigate('/secure-admin', { replace: true });
        return;
      }

      if (requireAdmin && (!profile || !profile.is_admin)) {
        console.log('Admin required but user is not admin, redirecting to secure-admin');
        navigate('/secure-admin', { replace: true });
        return;
      }
    }
  }, [user, profile, loading, navigate, requireAdmin]);

  // Show loading while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user || (requireAdmin && (!profile || !profile.is_admin))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
