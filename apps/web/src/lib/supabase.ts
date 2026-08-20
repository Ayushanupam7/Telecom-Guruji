import { createClient } from '@supabase/supabase-js';
import { envConfig } from './config';

const supabaseUrl = envConfig.supabase.url;
const supabaseAnonKey = envConfig.supabase.anonKey;
const supabaseServiceKey = envConfig.supabase.serviceRoleKey;

// Standard client for Auth session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client using Service Role Key - isolated with distinct storageKey to prevent 'Multiple GoTrueClient instances' warning
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'sb-admin-isolated-token',
  },
});

