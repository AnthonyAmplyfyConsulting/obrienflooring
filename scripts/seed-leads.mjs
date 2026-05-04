/**
 * Seed script — reads the CSV and inserts leads into Supabase.
 *
 * Usage:
 *   node scripts/seed-leads.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 * (we use the service role key to bypass RLS for seeding).
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Config ──────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(
  __dirname,
  '../Flooring Files - Accessible Extraction Tracker - Sheet1.csv'
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    '❌  Missing env vars. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are set.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CSV Parser (handles quoted fields with commas) ──────────────────────────
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

// ── Clean phone number ──────────────────────────────────────────────────────
function cleanPhone(raw) {
  if (!raw || raw === 'N/A') return '';
  return raw.replace(/^\(/, '').replace(/\)$/, '').trim();
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📂 Reading CSV...');
  const raw = readFileSync(CSV_PATH, 'utf-8');
  // Handle \r\n and \r line endings
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());

  // Skip header
  const header = parseCSVLine(lines[0]);
  console.log('   Headers:', header.join(' | '));

  // New CSV columns: file_url, last_modified, customer_name, phone, address
  const rows = lines.slice(1).map((line) => {
    const cols = parseCSVLine(line);
    return {
      file_url: cols[0] || '',
      last_modified: cols[1] || '',
      customer_name: cols[2] || '',
      phone: cols[3] || '',
      address: cols[4] || '',
    };
  });

  console.log(`   Parsed ${rows.length} rows from CSV.`);

  // ── Clear existing leads ────────────────────────────────────────────────
  console.log('🗑️  Clearing existing leads...');
  const { error: deleteError } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.error('❌  Failed to clear leads:', deleteError.message);
  } else {
    console.log('   ✅ Existing leads cleared.');
  }

  // ── Build Supabase rows ─────────────────────────────────────────────────
  const leads = [];

  for (const row of rows) {
    leads.push({
      name: row.customer_name,
      phone: cleanPhone(row.phone),
      email: '', // Not available in CSV
      address: row.address,
      stage: 'Job Completed',
      invoice_pdf: row.file_url || null,
      additional_notes: '',
      job_completed_date: row.last_modified || null,
      next_mail_date:
        row.last_modified
          ? new Date(new Date(row.last_modified).getTime() + 60000).toISOString()
          : null,
      mail_sent: false,
      created_at: row.last_modified || new Date().toISOString(),
    });
  }

  // ── Insert in batches of 20 ─────────────────────────────────────────────
  const BATCH_SIZE = 20;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from('leads').insert(batch).select();

    if (error) {
      console.error(`❌  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      errors += batch.length;
    } else {
      inserted += data.length;
      console.log(
        `   ✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${data.length} rows)`
      );
    }
  }

  console.log(`\n🏁 Done! Inserted ${inserted} leads. Errors: ${errors}.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
