import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for development
const supabaseUrl = 'https://mock-project.supabase.co';
const supabaseAnonKey = 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 0,
    },
  },
});

// Mock implementation that returns empty results
const mockSupabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: null, error: null }),
        order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
      }),
      order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
    }),
  }),
  auth: {
    signUp: (credentials: any) => Promise.resolve({ data: { user: null }, error: { message: 'Mock signup - not implemented' } }),
    signInWithPassword: (credentials: any) => Promise.resolve({ data: { user: null }, error: { message: 'Mock signin - not implemented' } }),
    signOut: () => Promise.resolve({ error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: (callback: any) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    admin: {
      createUser: (userData: any) => Promise.resolve({ data: { user: null }, error: { message: 'Mock admin create - not implemented' } }),
      deleteUser: (userId: string) => Promise.resolve({ error: { message: 'Mock admin delete - not implemented' } }),
    },
  },
};

// Export the mock client
export { mockSupabase as supabase as any };