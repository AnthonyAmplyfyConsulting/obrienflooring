import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lob Automation n8n Webhook Endpoint
const N8N_WEBHOOK_URL = 'https://amplyfyconsulting.app.n8n.cloud/webhook/e0e46c3d-d398-49c0-ad47-d45fb7bfce6b';

export async function GET(request: Request) {
  // Validate Vercel Cron Request
  const authHeader = request.headers.get('authorization');
  // Disable protection momentarily for local testing or if CRON_SECRET isn't set,
  // but ensure it works on Vercel properly:
  if (
    process.env.VERCEL === '1' && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Initialize Supabase Admin Client to bypass RLS policies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Query leads where next_mail_date <= now() and mail_sent = false
    const now = new Date().toISOString();
    const { data: leadsToMail, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('mail_sent', false)
      .lte('next_mail_date', now);

    if (fetchError) {
      console.error('Failed to fetch due mailings', fetchError);
      return NextResponse.json({ error: 'Database fetch failed' }, { status: 500 });
    }

    if (!leadsToMail || leadsToMail.length === 0) {
      return NextResponse.json({ message: 'No postcards due today' }, { status: 200 });
    }

    let successCount = 0;
    const errors = [];

    // 3. Process each lead
    for (const lead of leadsToMail) {
      try {
        // Send to n8n Webhook
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: lead.id,
            name: lead.name,
            address: lead.address,
            phone: lead.phone,
            email: lead.email,
            job_completed_date: lead.job_completed_date,
            automation_type: '5_YEAR_ANNIVERSARY',
            postcard_front: `${supabaseUrl}/storage/v1/object/public/Postcards/Postcard%20front.png`,
            postcard_back: `${supabaseUrl}/storage/v1/object/public/Postcards/Postcard%20back.png`,
            from_name: "O'Brien Flooring",
            from_address_line1: '53 Union St',
            from_address_city: 'Easthampton',
            from_address_state: 'MA',
            from_address_zip: '01027',
          }),
        });

        if (!n8nResponse.ok) {
          throw new Error(`n8n webhook failed with status ${n8nResponse.status}`);
        }

        // Mark as sent in Supabase
        const { error: updateError } = await supabase
          .from('leads')
          .update({ mail_sent: true })
          .eq('id', lead.id);

        if (updateError) {
           throw new Error(`Failed to update mail_sent flag in DB for lead ${lead.id}`);
        }

        successCount++;
      } catch (err: any) {
        console.error(`Failed to process lead ${lead.id}:`, err);
        errors.push({ leadId: lead.id, error: err.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: successCount, 
      errors: errors.length > 0 ? errors : undefined 
    }, { status: 200 });

  } catch (error) {
    console.error('Cron job generic error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
