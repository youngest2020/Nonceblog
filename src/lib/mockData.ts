// Mock data to replace Supabase functionality
export interface MockBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  author_id: string;
  author_name: string | null;
  category: string | null;
  tags: string[] | null;
  published_at: string | null;
  is_published: boolean | null;
  social_handles?: any;
  media_items?: any;
  created_at: string | null;
  updated_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  featured: boolean | null;
  reading_time: number | null;
}

export interface MockProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  profile_picture: string | null;
  bio: string | null;
  is_admin: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// Mock admin user
export const mockAdminUser = {
  id: "admin-1",
  email: "admin@noncefirewall.com",
  user_metadata: {
    display_name: "Admin User"
  }
};

export const mockAdminProfile: MockProfile = {
  id: "admin-1",
  email: "admin@noncefirewall.com",
  display_name: "Admin User",
  profile_picture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  bio: "Blog administrator and content creator",
  is_admin: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Mock blog posts
export const mockBlogPosts: MockBlogPost[] = [
  {
    id: "1",
    title: "Getting Started with Modern Web Development",
    slug: "getting-started-modern-web-development",
    excerpt: "Explore the modern tools and techniques that are shaping the future of web development in this comprehensive guide.",
    content: `
      <p>Web development has evolved tremendously over the past few years. In this comprehensive guide, we'll explore the modern tools and techniques that are shaping the future of web development.</p>
      
      <h2>The Modern Stack</h2>
      <p>Today's web developers have access to powerful frameworks and tools that make building complex applications more manageable than ever before. React, with its component-based architecture, has revolutionized how we think about user interfaces.</p>
      
      <h2>Best Practices</h2>
      <p>When building modern web applications, it's crucial to follow established best practices. This includes writing clean, maintainable code, implementing proper error handling, and ensuring your applications are accessible to all users.</p>
      
      <p>The journey of web development is ongoing, and staying updated with the latest trends and technologies is essential for success in this field.</p>
    `,
    image_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop",
    author_id: "admin-1",
    author_name: "Admin User",
    category: "Technology",
    tags: ["React", "JavaScript", "Web Development"],
    published_at: "2024-06-15T10:00:00Z",
    is_published: true,
    social_handles: {
      twitter: "noncefirewall",
      youtube: "noncefirewall"
    },
    media_items: [],
    created_at: "2024-06-15T10:00:00Z",
    updated_at: "2024-06-15T10:00:00Z",
    meta_title: null,
    meta_description: null,
    featured: true,
    reading_time: 5
  },
  {
    id: "2",
    title: "Breaking: Global Climate Summit Reaches Historic Agreement",
    slug: "global-climate-summit-historic-agreement",
    excerpt: "World leaders reach historic climate agreement with ambitious targets for carbon reduction and renewable energy adoption.",
    content: `
      <p>World leaders have reached a groundbreaking agreement at the Global Climate Summit, setting ambitious targets for carbon reduction and renewable energy adoption.</p>
      
      <h2>Key Commitments</h2>
      <p>The agreement includes commitments from over 190 countries to reduce carbon emissions by 50% by 2030 and achieve net-zero emissions by 2050.</p>
      
      <h2>Implementation Plan</h2>
      <p>The plan outlines specific steps for transitioning to renewable energy sources, implementing carbon pricing mechanisms, and supporting developing nations in their climate efforts.</p>
    `,
    image_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop",
    author_id: "admin-1",
    author_name: "Sarah Chen",
    category: "News",
    tags: ["Climate", "Environment", "Politics"],
    published_at: "2024-06-12T14:30:00Z",
    is_published: true,
    social_handles: {},
    media_items: [],
    created_at: "2024-06-12T14:30:00Z",
    updated_at: "2024-06-12T14:30:00Z",
    meta_title: null,
    meta_description: null,
    featured: false,
    reading_time: 3
  },
  {
    id: "3",
    title: "The Future of Remote Work: Trends and Predictions",
    slug: "future-remote-work-trends-predictions",
    excerpt: "Explore how remote work is reshaping the business landscape and what trends are emerging for the future of work.",
    content: `
      <p>As we move forward in the post-pandemic world, remote work continues to reshape the business landscape. Companies are adapting to new models of work that prioritize flexibility and employee well-being.</p>
      
      <h2>Hybrid Work Models</h2>
      <p>Many organizations are adopting hybrid models that combine remote and in-office work, allowing employees to choose the environment that best suits their productivity and lifestyle needs.</p>
      
      <h2>Technology Advancements</h2>
      <p>New technologies are making remote collaboration more seamless than ever, with virtual reality meetings and AI-powered productivity tools leading the way.</p>
    `,
    image_url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop",
    author_id: "admin-1",
    author_name: "Mike Rodriguez",
    category: "Business",
    tags: ["Remote Work", "Future", "Business Trends"],
    published_at: "2024-06-10T09:15:00Z",
    is_published: true,
    social_handles: {},
    media_items: [],
    created_at: "2024-06-10T09:15:00Z",
    updated_at: "2024-06-10T09:15:00Z",
    meta_title: null,
    meta_description: null,
    featured: false,
    reading_time: 4
  }
];

// Local storage helpers
export const localStorageHelpers = {
  getPosts: (): MockBlogPost[] => {
    const stored = localStorage.getItem('blog_posts');
    return stored ? JSON.parse(stored) : mockBlogPosts;
  },
  
  setPosts: (posts: MockBlogPost[]) => {
    localStorage.setItem('blog_posts', JSON.stringify(posts));
  },
  
  getProfile: (): MockProfile | null => {
    const stored = localStorage.getItem('user_profile');
    return stored ? JSON.parse(stored) : null;
  },
  
  setProfile: (profile: MockProfile) => {
    localStorage.setItem('user_profile', JSON.stringify(profile));
  },
  
  getCurrentUser: () => {
    const stored = localStorage.getItem('current_user');
    return stored ? JSON.parse(stored) : null;
  },
  
  setCurrentUser: (user: any) => {
    localStorage.setItem('current_user', JSON.stringify(user));
  },
  
  clearAuth: () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('user_profile');
  }
};