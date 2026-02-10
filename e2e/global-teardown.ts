import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { cleanupAllData } from './helpers/seed-data';

async function globalTeardown() {
  try {
    await cleanupAllData();
  } catch (err) {
    console.warn('[E2E Teardown] Cleanup error:', err);
  }
  console.log('[E2E Teardown] Cleanup complete.');
}

export default globalTeardown;
