
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key not found in .env.local');
    process.exit(1);
  }

  console.log('Testing Supabase connection to:', supabaseUrl);
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase.from('User').select('count', { count: 'exact', head: true });
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log('Successfully connected to Supabase, but table "User" does not exist yet (expected since DB is empty).');
      } else {
        throw error;
      }
    } else {
      console.log('Successfully connected to Supabase and queried User table.');
    }
  } catch (err) {
    console.error('Supabase error:', err.message);
    process.exit(1);
  }
}

testSupabase();
