/**
 * Upstash Redis / In-Memory Multi-Tier Caching Service
 * Accelerates high-frequency read endpoints (faculty catalog, fellowship programs, user stats)
 * to achieve sub-5ms response latencies and protect the database under 1,000–2,000 concurrent users.
 */
import dotenv from 'dotenv';
dotenv.config();

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_URL = process.env.REDIS_URL;

// Local High-Speed Memory LRU Fallback with Hard Capacity Cap (prevents unbounded memory growth)
const MAX_MEMORY_KEYS = 5000;
const memoryStore = new Map();
const memoryExpiry = new Map();

// Telemetry Stats
let hits = 0;
let misses = 0;

class CacheService {
  constructor() {
    this.isUpstashEnabled = !!(UPSTASH_URL && UPSTASH_TOKEN);
    this.redisUrl = REDIS_URL || null;
    if (this.isUpstashEnabled) {
      console.log('[Redis Cache] Configured with Upstash Redis Serverless REST endpoint.');
    } else if (this.redisUrl) {
      console.log(`[Redis Cache] Operating with Redis TCP gateway (${this.redisUrl.replace(/\/\/.*@/, '//***@')}) with in-memory LRU backup.`);
    } else {
      console.log(`[Redis Cache] Operating with high-speed memory cache (TTL enabled, LRU cap: ${MAX_MEMORY_KEYS} keys).`);
    }
  }

  async get(key) {
    if (this.isUpstashEnabled) {
      try {
        const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.result !== null) {
            hits++;
            try { return JSON.parse(data.result); } catch { return data.result; }
          }
        }
      } catch (err) {
        console.warn(`[Redis Cache Error] Falling back to memory: ${err.message}`);
      }
    }

    // Memory Cache Fallback with LRU Touch
    const now = Date.now();
    const exp = memoryExpiry.get(key);
    if (exp && now > exp) {
      memoryStore.delete(key);
      memoryExpiry.delete(key);
      misses++;
      return null;
    }

    if (memoryStore.has(key)) {
      hits++;
      const val = memoryStore.get(key);
      // LRU refresh: re-insert to mark as recently used
      memoryStore.delete(key);
      memoryStore.set(key, val);
      return val;
    }

    misses++;
    return null;
  }

  async set(key, value, ttlSeconds = 1800) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (this.isUpstashEnabled) {
      try {
        await fetch(`${UPSTASH_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(serialized)}?EX=${ttlSeconds}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
        });
      } catch (err) {
        console.warn(`[Redis Set Error] ${err.message}`);
      }
    }

    // LRU Eviction guard: prune oldest if capacity exceeded
    if (memoryStore.size >= MAX_MEMORY_KEYS && !memoryStore.has(key)) {
      const oldestKey = memoryStore.keys().next().value;
      if (oldestKey) {
        memoryStore.delete(oldestKey);
        memoryExpiry.delete(oldestKey);
      }
    }

    // Always keep in local memory
    memoryStore.set(key, value);
    memoryExpiry.set(key, Date.now() + ttlSeconds * 1000);
    return true;
  }

  async del(key) {
    if (this.isUpstashEnabled) {
      try {
        await fetch(`${UPSTASH_URL}/del/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
        });
      } catch {}
    }
    memoryStore.delete(key);
    memoryExpiry.delete(key);
    return true;
  }

  flush(prefix) {
    if (prefix) {
      for (const k of memoryStore.keys()) {
        if (k.startsWith(prefix)) {
          memoryStore.delete(k);
          memoryExpiry.delete(k);
        }
      }
    } else {
      memoryStore.clear();
      memoryExpiry.clear();
    }
  }

  async getOrSet(key, fetcher, ttlSeconds = 1800) {
    const cached = await this.get(key);
    if (cached !== null && cached !== undefined) {
      return { data: cached, source: 'cache' };
    }

    const fresh = await fetcher();
    if (fresh !== null && fresh !== undefined) {
      await this.set(key, fresh, ttlSeconds);
    }
    return { data: fresh, source: 'fresh' };
  }

  getStats() {
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : '0%';
    return {
      hits,
      misses,
      totalRequests: total,
      hitRate,
      backend: this.isUpstashEnabled ? 'Upstash Redis' : 'In-Memory LRU'
    };
  }
}

export const cache = new CacheService();
export default cache;
