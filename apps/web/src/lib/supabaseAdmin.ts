import { createClient } from '@supabase/supabase-js';
import { envConfig } from './config';

const supabaseUrl = envConfig.supabase.url;
const serviceRoleKey = envConfig.supabase.serviceRoleKey;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
