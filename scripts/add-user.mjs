import { createClient } from '@supabase/supabase-js';

// Use the service_role key to bypass RLS and create users.
// All credentials must be provided via environment variables — never hardcode them.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userEmail = process.env.NEW_USER_EMAIL;
const userPassword = process.env.NEW_USER_PASSWORD;

if (!supabaseUrl || !supabaseServiceRoleKey || !userEmail || !userPassword) {
  console.error('❌ Missing required environment variables.');
  console.error('');
  console.error('Run this script with:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... NEW_USER_EMAIL=... NEW_USER_PASSWORD=... node scripts/add-user.mjs');
  console.error('');
  console.error('You can find the service_role key in your Supabase dashboard:');
  console.error('  Settings → API → service_role (secret)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function addUser() {
  const email = userEmail;
  const password = userPassword;

  console.log(`\n🔐 Creating authorized user: ${email}\n`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip email verification
  });

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log('ℹ️  User already exists. Updating password...');
      
      // Try to find and update the existing user
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('❌ Error listing users:', listError.message);
        process.exit(1);
      }
      
      const existingUser = users.users.find(u => u.email === email);
      if (existingUser) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password }
        );
        if (updateError) {
          console.error('❌ Error updating password:', updateError.message);
          process.exit(1);
        }
        console.log('✅ Password updated successfully!');
      }
    } else {
      console.error('❌ Error creating user:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ User created successfully!');
    console.log(`   ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
  }

  console.log(`\n📋 Login credentials:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}\n`);
}

addUser();
