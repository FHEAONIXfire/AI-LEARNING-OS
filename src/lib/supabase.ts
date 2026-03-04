import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder');

if (isMock) {
  console.warn('Supabase URL or Anon Key is missing. Using Mock Client.');
  console.log('VITE_SUPABASE_URL:', supabaseUrl);
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Found' : 'Missing');
}

// Mock Client Implementation
const createMockClient = () => {
  const storage = new Map();
  
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
      signInWithOAuth: async () => ({ error: null }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { code: 'PGRST116', message: 'Not found' } }),
          order: async () => ({ data: [], error: null }),
        }),
        limit: async () => ({ data: [], error: null }),
        order: async () => ({ data: [], error: null }),
      }),
      insert: async (data: any) => {
        console.log(`[MockDB] Insert into ${table}:`, data);
        return { data: Array.isArray(data) ? data : [data], error: null };
      },
      update: async (data: any) => ({
        eq: async () => {
          console.log(`[MockDB] Update ${table}:`, data);
          return { data: [data], error: null };
        }
      }),
      upsert: async (data: any) => ({
        select: async () => ({ data: [data], error: null })
      })
    })
  } as any;
};

export const supabase = isMock 
  ? createMockClient()
  : createClient(supabaseUrl, supabaseAnonKey);
