/**
 * Supabase PostgreSQL Client with PgBouncer Connection Pooling
 * Designed for 1,000–2,000 concurrent user sessions over 20 physical connections.
 * Includes graceful in-memory fallback when DATABASE_URL is not set.
 */
import pg from 'pg';
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const { Pool } = pg;

// Supabase Transaction Pooler URL (Port 6543 with PgBouncer)
const connectionString = process.env.DATABASE_URL;

let pool = null;

if (connectionString) {
  try {
    pool = new Pool({
      connectionString,
      max: 20, // Max physical connections multiplexed by PgBouncer
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
      ssl: { rejectUnauthorized: false }
    });

    // Handle unexpected idle client disconnection without crashing the Node gateway
    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Unexpected Error]:', err.message);
    });

    console.log('[Database] Supabase PgBouncer connection pool configured (Max 20 physical sockets).');
  } catch (err) {
    console.warn('[Database] Failed to initialize PostgreSQL pool:', err.message);
  }
} else {
  console.log('[Database] Notice: DATABASE_URL not set. Operating with high-speed in-memory store.');
}

export const checkHealth = async () => {
  if (!pool) return { status: 'in-memory-fallback', latencyMs: 0 };
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return { status: 'healthy', latencyMs: Date.now() - start };
  } catch (err) {
    return { status: 'unhealthy', error: err.message };
  }
};

export const query = async (text, params = []) => {
  if (!pool) {
    return null;
  }
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 150) {
      console.warn(`[Database Slow Query] ${duration}ms: ${text.slice(0, 80)}...`);
    }
    return res;
  } catch (err) {
    console.error(`[Database Query Error]:`, err.message);
    throw err;
  }
};

export const getClient = async () => {
  if (!pool) return null;
  return await pool.connect();
};

export { pool };
export default { query, getClient, pool, checkHealth };
