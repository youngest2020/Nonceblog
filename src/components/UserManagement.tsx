import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Mail, Eye, EyeOff, Copy } from "lucide-react";
import { mockAdminProfile } from "@/lib/mockData";

interface MockUser {
  id: string;
  email: string | null;
  display_name: string | null;
  profile_picture: string | null;
  is_admin: boolean | null;
  created_at: string | null;
}

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Mock users data
  const mockUsers: MockUser[] = [
    {
      id: mockAdminProfile.id,
      email: mockAdminProfile.email,
      display_name: mockAdminProfile.display_name,
      profile_picture: mockAdminProfile.profile_picture,
      is_admin: mockAdminProfile.is_admin,
      created_at: mockAdminProfile.created_at
    }
  ];

  // Fetch users from localStorage
  const fetchUsers = async () => {
    try {
      console.log('Fetching users from localStorage...');
      const storedUsers = localStorage.getItem('users');
      const users = storedUsers ? JSON.parse(storedUsers) : mockUsers;
      
      console.log('Users fetched successfully:', users);
      setUsers(users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
      title: "Success",
      description: "Password copied to clipboard!",
    });
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !newUserName.trim() || !generatedPassword.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields and generate a password.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newUser: MockUser = {
        id: Date.now().toString(),
        email: newUserEmail.trim(),
        display_name: newUserName.trim(),
        profile_picture: null,
        is_admin: false,
        created_at: new Date().toISOString()
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);

      toast({
        title: "Success", 
        description: `User ${newUserName} created successfully! (Mock implementation)`,
      });
      
      // Reset form
      setNewUserEmail("");
      setNewUserName("");
      setGeneratedPassword("");
      setIsAddingUser(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.is_admin) {
      toast({
        title: "Error",
        description: "Cannot delete admin users.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete user ${user.display_name}?`)) {
      try {
        const updatedUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        
        toast({
          title: "Success",
          description: "User deleted successfully! (Mock implementation)",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete user",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>User Management (Mock)</span>
          <Button
            onClick={() => setIsAddingUser(true)}
            size="sm"
            className="flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add User Form */}
        {isAddingUser && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-4">Add New User (Mock)</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email Address</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userName">Display Name</Label>
                  <Input
                    id="userName"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Generated Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={generatedPassword}
                      readOnly
                      placeholder="Click 'Generate Password' to create one"
                    />
                    {generatedPassword && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generatePassword}
                  >
                    Generate
                  </Button>
                  {generatedPassword && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={copyPassword}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  This is a mock implementation. In a real app, this would create an actual user account.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddUser}>Add User (Mock)</Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingUser(false);
                  setNewUserEmail("");
                  setNewUserName("");
                  setGeneratedPassword("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="space-y-4">
          <h3 className="font-medium">Current Users ({users.length})</h3>
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No users found</p>
          ) : (
            users.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <img 
                    src={user.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"} 
                    alt={user.display_name || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{user.display_name || 'No Name'}</h4>
                      {user.is_admin && (
                        <Badge variant="default">Admin</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Mail className="h-3 w-3" />
                      <span>{user.email || 'No Email'}</span>
                    </div>
                  </div>
                </div>
                
                {!user.is_admin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;