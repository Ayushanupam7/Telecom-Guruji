const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wchaqrfkxnomafwcpiqq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjaGFxcmZreG5vbWFmd2NwaXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MzgwMjgsImV4cCI6MjEwMjIxNDAyOH0.-8zwMTal6D2zbchuUEVOigebQVWBgZ7D94cARfxIyN8';

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
