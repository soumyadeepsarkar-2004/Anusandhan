import express from 'express';
import { ingestionService } from '../services/dataIngestionService.js';
import { ingestionScheduler } from '../services/dataIngestionScheduler.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/ingest/status - Telemetry of live scraper & background ingestion engine
router.get('/status', (req, res) => {
  res.json(ingestionService.getStatus());
});

// GET /api/ingest/postings - Live scraped opportunities and postings from the web
router.get('/postings', (req, res) => {
  const { domain, scope, q } = req.query;
  let postings = ingestionService.getScrapedPostings();

  if (domain && domain !== 'all') {
    postings = postings.filter(p => p.domain === domain || p.researchDomains?.includes(domain));
  }
  if (scope && scope !== 'all') {
    postings = postings.filter(p => p.scope === scope);
  }
  if (q) {
    const term = q.toLowerCase();
    postings = postings.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.university.toLowerCase().includes(term) ||
      p.researchFocus?.toLowerCase().includes(term) ||
      p.recentPaper?.title?.toLowerCase().includes(term)
    );
  }

  res.json(postings);
});

// Middleware: Enforce admin authorization for background scraping and schedule configuration
const requireAdmin = (req, res, next) => {
  // If user has an explicit non-admin role, reject with 403 Forbidden
  if (req.user?.role && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required. Access denied.' });
  }
  // In production, strictly enforce that req.user.role === 'admin'
  if (process.env.NODE_ENV === 'production' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required. Access denied.' });
  }
  next();
};

// POST /api/ingest/refresh - Trigger on-demand real-world data scrape
router.post('/refresh', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await ingestionService.runFullIngestionSweep();
    res.json({
      message: 'Autonomous internet data scrape completed successfully',
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ingest/schedule - Configure autonomous sweep interval
router.post('/schedule', authenticateToken, requireAdmin, (req, res) => {
  const { intervalMinutes } = req.body;
  if (!intervalMinutes || typeof intervalMinutes !== 'number' || intervalMinutes < 1) {
    return res.status(400).json({ error: 'Valid intervalMinutes (>= 1) is required' });
  }
  ingestionScheduler.setIntervalMinutes(intervalMinutes);
  res.json({
    message: `Autonomous scraping interval updated to every ${intervalMinutes} minutes`,
    intervalMinutes,
    nextSweepTimestamp: ingestionService.nextSweepTimestamp
  });
});

// GET /api/ingest/history - Recent ingestion execution logs
router.get('/history', (req, res) => {
  res.json(ingestionService.ingestionHistory);
});

export default router;
