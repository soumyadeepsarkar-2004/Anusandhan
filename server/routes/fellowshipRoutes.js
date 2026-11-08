import express from 'express';
import { cache } from '../services/redisCache.js';
import { ingestionService } from '../services/dataIngestionService.js';

const router = express.Router();

// GET /api/fellowships - High concurrency cached endpoint with lifecycle categorization
router.get('/', async (req, res) => {
  const { scope, featured, q, status } = req.query;
  const cacheKey = `fellowships:list:${scope || 'all'}:${featured || 'all'}:${status || 'all'}:${q || 'all'}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  let results = [...ingestionService.getFellowships()];

  if (scope && scope !== 'all') {
    results = results.filter(f => f.scope.toLowerCase() === scope.toLowerCase());
  }

  if (status && status !== 'all') {
    results = results.filter(f => f.status && f.status.toLowerCase() === status.toLowerCase());
  }

  if (featured === 'true') {
    results = results.filter(f => f.featured === true);
  }

  if (q) {
    const term = q.toLowerCase();
    results = results.filter(f => 
      f.name.toLowerCase().includes(term) ||
      f.hostInstitutions.toLowerCase().includes(term) ||
      f.hostCountry.toLowerCase().includes(term) ||
      (f.statusLabel && f.statusLabel.toLowerCase().includes(term)) ||
      (f.tags && f.tags.some(t => t.toLowerCase().includes(term)))
    );
  }

  // Cache for 30 minutes (1800s)
  await cache.set(cacheKey, results, 1800);
  res.setHeader('X-Cache', 'MISS');
  res.json(results);
});

// GET /api/fellowships/:id - Single fellowship lookup
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `fellowships:${id}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const fellowship = ingestionService.getFellowships().find(f => f.id === id);
  if (!fellowship) {
    return res.status(404).json({ error: 'Fellowship program not found' });
  }

  await cache.set(cacheKey, fellowship, 3600);
  res.setHeader('X-Cache', 'MISS');
  res.json(fellowship);
});

export default router;
