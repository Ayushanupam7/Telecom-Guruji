const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wchaqrfkxnomafwcpiqq.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjaGFxcmZreG5vbWFmd2NwaXFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjYzODAyOCwiZXhwIjoyMTAyMjE0MDI4fQ.G0IIG8RHiBQO4IvhUa4QklvgqHPI8ejiAOHektcO7-4';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkData() {
  console.log('Checking live tables on Supabase...');
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, email, role');
  if (profErr) {
    console.error('Profiles query error:', profErr.message);
  } else {
    console.log(`Live Profiles in Database (${profiles.length}):`, profiles);
  }

  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) {
    console.error('List users error:', userErr.message);
  } else {
    console.log(`Auth Users Count: ${users.users.length}`);
    users.users.forEach(u => console.log(`- ${u.email} (${u.id})`));
  }
}

checkData();
