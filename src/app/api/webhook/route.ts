import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    // Verify the user is authenticated before forwarding to n8n
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();

    const response = await fetch('https://amplyfyconsulting.app.n8n.cloud/webhook/59146b02-b62d-4b99-add0-66cbe02f9bbe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('n8n responded with status:', response.status);
      return NextResponse.json({ error: 'Failed' }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
