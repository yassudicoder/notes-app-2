import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nzdjrzrziikfxwiwqmtj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZGpyenJ6aWlrZnh3aXdxbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDMyMjksImV4cCI6MjA5MTQxOTIyOX0.kMm5Dwryze9wzVbNoqi_iaqkyUPwd0hz9OUoJkMvtzU";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth helper: Sign up
export const signUp = async (email: string, password: string) => {
  const result = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    }
  });
  return result;
};

// Auth helper: Sign in
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

// Auth helper: Sign out
export const signOut = async () => {
  return await supabase.auth.signOut();
};

// Auth helper: Get current user
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
};

// Auth helper: Get session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session || null, error };
};