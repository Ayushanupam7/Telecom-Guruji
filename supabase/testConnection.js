const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection to:', supabaseUrl);
  const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' });
  if (error) {
    console.log('Connection response error (expected if table not created yet):', error.message);
  } else {
    console.log('Successfully connected to Supabase! Profiles count:', data);
  }
}

testConnection();
