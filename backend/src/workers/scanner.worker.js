import dotenv from 'dotenv';
dotenv.config();

import { handler } from '../handlers/scanner-handler.js';

// Scan interval (e.g. check every 1 hour)
const SCAN_INTERVAL_MS = 60 * 60 * 1000;

console.log('====================================================');
console.log('[Scanner Worker] Advisory Forecast Scanner started...');
console.log('====================================================');

const runScanner = async () => {
  while (true) {
    try {
      console.log(`[Scanner] Beginning farm forecast evaluation scan...`);
      await handler({ source: 'local-development-worker' });
      console.log(`[Scanner] Completed evaluation. Waiting ${SCAN_INTERVAL_MS / 1000}s for next cycle.`);
      await new Promise((resolve) => setTimeout(resolve, SCAN_INTERVAL_MS));
    } catch (err) {
      console.error('[Scanner Fatal] Scanner loop error:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
};

runScanner();
