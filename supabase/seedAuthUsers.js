const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const DEMO_USERS = [
  {
    email: 'student@signalhub.app',
    password: 'Password123!',
    fullName: 'Priya Sharma (Student)',
    role: 'student',
    preferredLanguage: 'hi'
  },
  {
    email: 'instructor@signalhub.app',
    password: 'Password123!',
    fullName: 'Dr. Alex Rivera (Instructor)',
    role: 'instructor',
    preferredLanguage: 'en'
  },
  {
    email: 'admin@signalhub.app',
    password: 'Password123!',
    fullName: 'Admin Developer',
    role: 'admin',
    preferredLanguage: 'en'
  }
];

async function seedAuthUsers() {
  console.log('Seeding demo login accounts to Supabase Auth...');

  for (const user of DEMO_USERS) {
    // 1. Create or update user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        role: user.role,
        preferred_language: user.preferredLanguage
      }
    });

    if (error) {
      if (error.message.includes('already exists') || error.status === 422) {
        console.log(`ℹ️ User ${user.email} already exists. Updating password & profile...`);
        
        // List user by email to get ID
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const existing = usersData.users.find(u => u.email === user.email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, {
            password: user.password,
            user_metadata: {
              full_name: user.fullName,
              role: user.role,
              preferred_language: user.preferredLanguage
            }
          });

          await supabase.from('profiles').upsert({
            id: existing.id,
            email: user.email,
            full_name: user.fullName,
            role: user.role,
            preferred_language: user.preferredLanguage
          });
          console.log(`✓ Updated credentials for ${user.email}`);
        }
      } else {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
      }
    } else if (data.user) {
      // Upsert profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        preferred_language: user.preferredLanguage
      });
      console.log(`✓ Created demo user: ${user.email} (Role: ${user.role})`);
    }
  }

  console.log('\n🎉 ALL DEMO ACCOUNTS CREATED! Password for all demo users: Password123!');
}

seedAuthUsers();
