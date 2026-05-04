import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testUpdate() {
  const futureDate = new Date(Date.now() + 60000).toISOString();
  console.log("Attempting to update next_mail_date to:", futureDate);

  // Get a test lead ID
  const { data: leads, error: fetchErr } = await supabase.from('leads').select('id').limit(1);
  
  if (fetchErr || !leads || leads.length === 0) {
    console.error("Fetch error or no leads:", fetchErr);
    return;
  }
  
  const testId = leads[0].id;
  
  const { data, error } = await supabase
    .from('leads')
    .update({ next_mail_date: futureDate })
    .eq('id', testId)
    .select();
    
  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Success! Updated lead:", data[0]);
  }
}

testUpdate();
