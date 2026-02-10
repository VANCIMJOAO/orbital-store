import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { seedAllData, cleanupAllData } from './helpers/seed-data';

async function globalSetup() {
  console.log('[E2E Setup] Starting global setup...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL not set. Create .env.test or run supabase start.');
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    });
    if (!res.ok) throw new Error(`Supabase responded with ${res.status}`);
    console.log('[E2E Setup] Supabase is running.');
  } catch (err) {
    console.warn('[E2E Setup] WARNING: Supabase not reachable. Some tests may fail.');
    return;
  }

  // Seed test data
  try {
    await cleanupAllData();
    await seedAllData();
    console.log('[E2E Setup] Test data seeded.');
  } catch (err) {
    console.warn('[E2E Setup] WARNING: Seed failed:', err);
  }

  console.log('[E2E Setup] Global setup complete.');
}

export default globalSetup;
