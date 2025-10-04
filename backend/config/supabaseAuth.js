/**
 * Supabase Auth Client Configuration
 *
 * This file initializes a Supabase client for authentication operations.
 * Uses the ANON key (not service role) for auth.signInWithPassword().
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Initialize Supabase client with anon key for auth operations
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabaseAuth;
