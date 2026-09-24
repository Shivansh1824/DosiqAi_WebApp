import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteUser() {
  const email = 'ranashivansh86@gmail.com';
  console.log(`Looking for user: ${email}`);
  
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  
  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.log('User not found.');
    return;
  }
  
  console.log(`Found user: ${user.id}. Deleting...`);
  
  const { data, error } = await supabase.auth.admin.deleteUser(user.id);
  
  if (error) {
    console.error('Error deleting user:', error);
  } else {
    console.log('Successfully deleted user and all cascade data!');
  }
}

deleteUser();
