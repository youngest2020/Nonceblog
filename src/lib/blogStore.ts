
export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  authorId: string;
  publishedAt: string;
  category: string;
  tags: string[];
  imageUrl: string;
  published: boolean;
  mediaItems?: MediaItem[];
  socialHandles?: {
    twitter?: string;
    youtube?: string;
    facebook?: string;
    telegram?: string;
  };
}

export interface BlogUser {
  id: string;
  email: string;
  displayName: string;
  profilePicture: string;
  isAdmin: boolean;
  socialHandles?: {
    twitter?: string;
    youtube?: string;
    facebook?: string;
    telegram?: string;
  };
}

// Updated categories for broader content types
export const categories = [
  "Technology",
  "News",
  "Business",
  "Health",
  "Sports",
  "Entertainment",
  "Science",
  "Politics",
  "Travel",
  "Lifestyle"
];

// Mock users data
let blogUsers: BlogUser[] = [
  {
    id: "admin-1",
    email: "admin@noncefirewall.com",
    displayName: "Admin User",
    profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    isAdmin: true,
    socialHandles: {
      twitter: "noncefirewall",
      youtube: "noncefirewall",
      facebook: "noncefirewall",
      telegram: "noncefirewall"
    }
  }
];

// Mock data for demonstration
export const mockPosts: BlogPost[] = [
  {
    id: "1",
    title: "Getting Started with Modern Web Development",
    content: `
      <p>Web development has evolved tremendously over the past few years. In this comprehensive guide, we'll explore the modern tools and techniques that are shaping the future of web development.</p>
      
      <h2>The Modern Stack</h2>
      <p>Today's web developers have access to powerful frameworks and tools that make building complex applications more manageable than ever before. React, with its component-based architecture, has revolutionized how we think about user interfaces.</p>
      
      <h2>Best Practices</h2>
      <p>When building modern web applications, it's crucial to follow established best practices. This includes writing clean, maintainable code, implementing proper error handling, and ensuring your applications are accessible to all users.</p>
      
      <p>The journey of web development is ongoing, and staying updated with the latest trends and technologies is essential for success in this field.</p>
    `,
    excerpt: "Explore the modern tools and techniques that are shaping the future of web development in this comprehensive guide.",
    author: "Admin User",
    authorId: "admin-1",
    publishedAt: "2024-06-15T10:00:00Z",
    category: "Technology",
    tags: ["React", "JavaScript", "Web Development"],
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop",
    published: true,
    mediaItems: [],
    socialHandles: {
      twitter: "noncefirewall",
      youtube: "noncefirewall"
    }
  },
  {
    id: "2",
    title: "Breaking: Global Climate Summit Reaches Historic Agreement",
    content: `
      <p>World leaders have reached a groundbreaking agreement at the Global Climate Summit, setting ambitious targets for carbon reduction and renewable energy adoption.</p>
      
      <h2>Key Commitments</h2>
      <p>The agreement includes commitments from over 190 countries to reduce carbon emissions by 50% by 2030 and achieve net-zero emissions by 2050.</p>
      
      <h2>Implementation Plan</h2>
      <p>The plan outlines specific steps for transitioning to renewable energy sources, implementing carbon pricing mechanisms, and supporting developing nations in their climate efforts.</p>
    `,
    excerpt: "World leaders reach historic climate agreement with ambitious targets for carbon reduction and renewable energy adoption.",
    author: "Sarah Chen",
    authorId: "admin-1",
    publishedAt: "2024-06-12T14:30:00Z",
    category: "News",
    tags: ["Climate", "Environment", "Politics"],
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop",
    published: true
  },
  {
    id: "3",
    title: "The Future of Remote Work: Trends and Predictions",
    content: `
      <p>As we move forward in the post-pandemic world, remote work continues to reshape the business landscape. Companies are adapting to new models of work that prioritize flexibility and employee well-being.</p>
      
      <h2>Hybrid Work Models</h2>
      <p>Many organizations are adopting hybrid models that combine remote and in-office work, allowing employees to choose the environment that best suits their productivity and lifestyle needs.</p>
      
      <h2>Technology Advancements</h2>
      <p>New technologies are making remote collaboration more seamless than ever, with virtual reality meetings and AI-powered productivity tools leading the way.</p>
    `,
    excerpt: "Explore how remote work is reshaping the business landscape and what trends are emerging for the future of work.",
    author: "Mike Rodriguez",
    authorId: "admin-1",
    publishedAt: "2024-06-10T09:15:00Z",
    category: "Business",
    tags: ["Remote Work", "Future", "Business Trends"],
    imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop",
    published: true
  }
];

// Simple in-memory store (in a real app, this would be connected to a database)
let posts = [...mockPosts];

export const blogStore = {
  getAllPosts: () => posts,
  getPublishedPosts: () => posts.filter(post => post.published),
  getPostById: (id: string) => posts.find(post => post.id === id),
  createPost: (post: Omit<BlogPost, 'id'>) => {
    const newPost = { ...post, id: Date.now().toString() };
    posts.unshift(newPost);
    return newPost;
  },
  updatePost: (id: string, updates: Partial<BlogPost>) => {
    const index = posts.findIndex(post => post.id === id);
    if (index !== -1) {
      posts[index] = { ...posts[index], ...updates };
      return posts[index];
    }
    return null;
  },
  deletePost: (id: string) => {
    posts = posts.filter(post => post.id !== id);
  },
  uploadImage: (file: File): Promise<string> => {
    // In a real app, this would upload to a file storage service
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve(dataUrl);
      };
      reader.readAsDataURL(file);
    });
  },
  
  // User management functions
  getAllUsers: () => blogUsers,
  getUserById: (id: string) => blogUsers.find(user => user.id === id),
  createUser: (user: Omit<BlogUser, 'id'>) => {
    const newUser = { ...user, id: Date.now().toString() };
    blogUsers.push(newUser);
    return newUser;
  },
  updateUser: (id: string, updates: Partial<BlogUser>) => {
    const index = blogUsers.findIndex(user => user.id === id);
    if (index !== -1) {
      blogUsers[index] = { ...blogUsers[index], ...updates };
      return blogUsers[index];
    }
    return null;
  },
  deleteUser: (id: string) => {
    blogUsers = blogUsers.filter(user => user.id !== id);
  }
};
