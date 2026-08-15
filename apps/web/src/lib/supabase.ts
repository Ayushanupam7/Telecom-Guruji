import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wchaqrfkxnomafwcpiqq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjaGFxcmZreG5vbWFmd2NwaXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MzgwMjgsImV4cCI6MjEwMjIxNDAyOH0.-8zwMTal6D2zbchuUEVOigebQVWBgZ7D94cARfxIyN8';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjaGFxcmZreG5vbWFmd2NwaXFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjYzODAyOCwiZXhwIjoyMTAyMjE0MDI4fQ.G0IIG8RHiBQO4IvhUa4QklvgqHPI8ejiAOHektcO7-4';

// Standard client for Auth session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client using Service Role Key - disables GoTrue Auth session persistence to prevent 'Multiple GoTrueClient instances' warning
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
