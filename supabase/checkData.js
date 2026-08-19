const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
