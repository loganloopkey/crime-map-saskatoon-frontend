// supabaseClient.js - Supabase client initialization for frontend

// Supabase project configuration
const SUPABASE_URL = 'https://vctwkckypyipfvifkfxy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjdHdrY2t5cHlpcGZ2aWZrZnh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDA2NDcsImV4cCI6MjA3NDkxNjY0N30.r-j9hC_L5WIgPtU7LVbFZjc1zSIOHEWX5BvUqQzfdlo';

// Initialize Supabase client
// Supports both CDN and ES module imports
let supabaseClient = null;

// Function to initialize and return the Supabase client
function getSupabaseClient() {
  if (!supabaseClient) {
    // Try CDN approach first (supabase global variable)
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('✅ Supabase client initialized via CDN');
    }
    // Try ES module approach (if using npm/import)
    else if (typeof createClient !== 'undefined') {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('✅ Supabase client initialized via ES module');
    }
    else {
      console.error('❌ Supabase library not found. Please include the Supabase CDN script or install @supabase/supabase-js');
      return null;
    }
  }
  return supabaseClient;
}

// Export for use in other scripts
// For ES modules (if using type="module" in script tag):
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getSupabaseClient, SUPABASE_URL, SUPABASE_ANON_KEY };
}

// For regular scripts, make it available globally
if (typeof window !== 'undefined') {
  window.getSupabaseClient = getSupabaseClient;
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  window.supabaseClient = getSupabaseClient();
}

