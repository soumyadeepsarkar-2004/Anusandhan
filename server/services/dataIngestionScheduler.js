/**
 * Anusandhan - Background Ingestion Scheduler
 * Automatically runs real-world data scraping sweeps at regular intervals
 * to maintain current bibliometrics, publications, and fellowship deadlines.
 */
import { ingestionService } from './dataIngestionService.js';

class DataIngestionScheduler {
  constructor() {
    this.timer = null;
    this.intervalMs = parseInt(process.env.SCRAPE_INTERVAL_MS || String(30 * 60 * 1000), 10); // Sweep every 30 minutes
  }

  start() {
    console.log(`[Ingestion Scheduler] Autonomous background web scraper initialized (interval: ${this.intervalMs / 60000}m).`);
    
    // Run an initial sweep asynchronously shortly after boot
    setTimeout(async () => {
      try {
        console.log('[Ingestion Scheduler] Executing initial autonomous background sweep...');
        await ingestionService.runFullIngestionSweep();
      } catch (err) {
        console.warn('[Ingestion Scheduler Error] Initial sweep failed:', err.message);
      }
    }, 2000);

    // Schedule regular autonomous sweeps
    this.timer = setInterval(async () => {
      try {
        console.log('[Ingestion Scheduler] Executing periodic autonomous background web sweep...');
        await ingestionService.runFullIngestionSweep();
      } catch (err) {
        console.warn('[Ingestion Scheduler Error] Periodic sweep failed:', err.message);
      }
    }, this.intervalMs);
  }

  setIntervalMinutes(mins) {
    const newInterval = Math.max(1, mins) * 60 * 1000;
    this.intervalMs = newInterval;
    ingestionService.intervalMs = newInterval;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = setInterval(async () => {
        try {
          await ingestionService.runFullIngestionSweep();
        } catch (err) {
          console.warn('[Ingestion Scheduler Error] Periodic sweep failed:', err.message);
        }
      }, this.intervalMs);
    }
    ingestionService.nextSweepTimestamp = new Date(Date.now() + this.intervalMs).toISOString();
    console.log(`[Ingestion Scheduler] Interval updated to ${mins} minutes.`);
  }

  async triggerImmediateSweep() {
    console.log('[Ingestion Scheduler] Triggering immediate autonomous sweep on demand...');
    const result = await ingestionService.runFullIngestionSweep();
    return result;
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Ingestion Scheduler] Autonomous background scraper stopped.');
    }
  }
}

export const ingestionScheduler = new DataIngestionScheduler();
