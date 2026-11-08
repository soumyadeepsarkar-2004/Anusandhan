/**
 * Production Sliding-Window Rate Limiting Middleware
 * Protects APIs, Auth, and AI endpoints against abuse and DDoS attacks.
 * Calibrated for up to 1,000 active concurrent university scholars and students.
 */
import { cache } from '../services/redisCache.js';
import jwt from 'jsonwebtoken';

export const createRateLimiter = ({
  windowSeconds = 60,
  maxRequests = 100,
  prefix = 'rl',
  message = 'Too many requests. Please slow down and try again later.',
  keyGenerator = null
}) => {
  return async (req, res, next) => {
    // 1. Secure Client IP Extraction:
    // If 'trust proxy' is disabled or unconfigured, rely strictly on physical socket remoteAddress
    // to prevent direct clients from forging X-Forwarded-For headers.
    let rawIp = (req.app?.get('trust proxy') ? req.ip : null) || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    if (typeof rawIp === 'string' && rawIp.startsWith('::ffff:')) {
      rawIp = rawIp.slice(7);
    }
    const ip = rawIp === '::1' ? '127.0.0.1' : rawIp;

    // 2. Identifier: Supports per-user rate limiting if authenticated, falling back to verified IP.
    // If req.user was not yet populated (e.g. rate limiter ran before route-level auth middleware),
    // extract and verify the bearer token defensively to enforce per-user throttling.
    let userId = req.user?.id;
    if (!userId && req.headers['authorization']) {
      try {
        const authHeader = req.headers['authorization'];
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice(7).trim();
          const secret = process.env.JWT_SECRET;
          if (token && secret) {
            const decoded = jwt.verify(token, secret);
            if (decoded && decoded.id) {
              userId = decoded.id;
              if (!req.user) req.user = decoded;
            }
          }
        }
      } catch {
        // Fall back to IP identifier on token decode failure; route auth will handle rejection
      }
    }

    let key;
    if (keyGenerator) {
      const generated = keyGenerator(req);
      key = (generated && generated.startsWith('auth:')) ? generated : `${prefix}:${generated}`;
    } else {
      const identifier = userId ? `usr:${userId}` : `ip:${ip}`;
      key = `${prefix}:${identifier}`;
    }
    const now = Math.floor(Date.now() / 1000);

    try {
      const entry = (await cache.get(key)) || { count: 0, reset: now + windowSeconds };

      if (now > entry.reset) {
        entry.count = 0;
        entry.reset = now + windowSeconds;
      }

      entry.count += 1;
      await cache.set(key, entry, Math.max(1, entry.reset - now));

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
      res.setHeader('X-RateLimit-Reset', entry.reset);

      if (entry.count > maxRequests) {
        res.setHeader('Retry-After', entry.reset - now);
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message,
          retryAfterSeconds: entry.reset - now
        });
      }

      next();
    } catch (err) {
      // In case of any rate-limiter failure, fail open to avoid service outage
      next();
    }
  };
};

// 1. Strict Auth Limiter (Prevents credential brute-forcing; calibrated for 1,000 users / campus NATs)
export const authLimiter = createRateLimiter({
  windowSeconds: 900, // 15 minutes
  maxRequests: process.env.RATE_LIMIT_MAX_AUTH ? parseInt(process.env.RATE_LIMIT_MAX_AUTH, 10) : 120,
  prefix: 'rl:auth',
  keyGenerator: (req) => {
    // 1. If caller has an authenticated session/token, isolate quota per user session
    if (req.user?.id) {
      return `usr:${req.user.id}`;
    }
    // 2. For login attempts with email, key on account email to prevent campus IP throttling
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : null;
    const isLogin = req.path?.includes('login') || req.originalUrl?.includes('/login') || req.url?.includes('login');
    if (email && isLogin) {
      return `auth:login:${email}`;
    }
    // 3. Fallback to client IP
    let rawIp = (req.app?.get('trust proxy') ? req.ip : null) || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    if (typeof rawIp === 'string' && rawIp.startsWith('::ffff:')) {
      rawIp = rawIp.slice(7);
    }
    const ip = rawIp === '::1' ? '127.0.0.1' : rawIp;
    return `ip:${ip}`;
  },
  message: 'Too many authentication attempts. Please try again in 15 minutes.'
});

// 2. AI & Voice Endpoint Limiter (Protects LLM/TTS quotas while permitting interactive sessions)
export const aiLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: process.env.RATE_LIMIT_MAX_AI ? parseInt(process.env.RATE_LIMIT_MAX_AI, 10) : 30,
  prefix: 'rl:ai',
  message: 'AI reasoning queue is currently busy. Please wait a few seconds.'
});

// 3. Public Read Limiter (High-throughput for cached faculty catalog, fellowship searches, health checks)
export const publicReadLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: process.env.RATE_LIMIT_MAX_PUBLIC ? parseInt(process.env.RATE_LIMIT_MAX_PUBLIC, 10) : 1200,
  prefix: 'rl:public',
  message: 'High read volume detected. Please slow down.'
});

// 4. General API Limiter (Standard traffic shaping for state mutations and general endpoints)
export const apiLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: process.env.RATE_LIMIT_MAX_API ? parseInt(process.env.RATE_LIMIT_MAX_API, 10) : 600,
  prefix: 'rl:api',
  message: 'Traffic threshold reached. Please throttle requests.'
});

export default { createRateLimiter, authLimiter, aiLimiter, publicReadLimiter, apiLimiter };
