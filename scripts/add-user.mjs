import { createClient } from '@supabase/supabase-js';

// Use the service_role key to bypass RLS and create users
// You'll need to provide SUPABASE_SERVICE_ROLE_KEY as an env variable or replace below
const supabaseUrl = 'https://vttimxwzfyrdlwlumvhg.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  console.error('');
  console.error('Run this script with:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/add-user.mjs');
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
  const email = 'obrienflooring2001@gmail.com';
  const password = 'Obrien2001$';

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
