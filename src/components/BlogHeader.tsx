
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const BlogHeader = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut, user, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/21cc5b21-d175-4e0e-8222-9b97c6c1071f.png" 
              alt="Nonce Firewall Blogs Logo" 
              className="h-8 w-8 sm:h-10 sm:w-10"
            />
            <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
              Nonce Firewall Blogs
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {!isAdminPath ? (
              <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                Home
              </Link>
            ) : (
              <>
                <Link to="/admin" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
                <Link to="/admin/create">
                  <Button size="sm">New Post</Button>
                </Link>
                <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                  View Blog
                </Link>
                {user && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                )}
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3">
              {!isAdminPath ? (
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
              ) : (
                <>
                  <Link 
                    to="/admin" 
                    className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/admin/create"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button size="sm" className="w-full">New Post</Button>
                  </Link>
                  <Link 
                    to="/" 
                    className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    View Blog
                  </Link>
                  {user && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  )}
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default BlogHeader;
