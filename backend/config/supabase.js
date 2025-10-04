/**
 * Supabase Client Configuration
 *
 * This file initializes the Supabase client for the backend.
 * Uses the SERVICE_ROLE key for admin operations (bypasses RLS).
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Initialize Supabase client with service role key
// This bypasses Row Level Security (RLS) - use with caution
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Export as both default and named export
export { supabase };
export default supabase;
