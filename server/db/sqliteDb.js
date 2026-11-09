/**
 * Anusandhan - Persistent Relational Database Engine
 * Supports local durable SQLite on disk when available, and seamlessly
 * falls back to high-concurrency in-memory storage in serverless environments (e.g. Vercel, AWS Lambda).
 */
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'anusandhan.sqlite');

let sqlite3 = null;
try {
  sqlite3 = require('sqlite3');
} catch (e) {
  // Graceful fallback for serverless container GLIBC variations (e.g. AWS Lambda / Vercel)
  sqlite3 = null;
}

let dbInstance = null;

// In-Memory Fallback Store (Used in serverless or when native sqlite3 binary is unavailable)
const memoryStore = {
  users: new Map(),
  drafts: new Map(),
  orders: new Map(),
  claims: new Map()
};

function createMemoryDbMock() {
  return {
    run(sql, params, cb) {
      if (typeof params === 'function') {
        cb = params;
        params = [];
      }
      if (cb) setImmediate(() => cb.call({ lastID: 1, changes: 1 }, null));
    },
    get(sql, params, cb) {
      if (typeof params === 'function') {
        cb = params;
        params = [];
      }
      if (cb) setImmediate(() => cb(null, null));
    },
    all(sql, params, cb) {
      if (typeof params === 'function') {
        cb = params;
        params = [];
      }
      if (cb) setImmediate(() => cb(null, []));
    },
    serialize(fn) {
      if (fn) fn();
    }
  };
}

export function getSqliteDb() {
  if (dbInstance) return dbInstance;

  if (!sqlite3) {
    dbInstance = createMemoryDbMock();
    return dbInstance;
  }

  try {
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.warn('[Database] SQLite disk connection fallback to memory:', err.message);
      } else {
        console.log(`[Database] Connected to durable relational storage on disk: ${DB_PATH}`);
      }
    });

    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA synchronous = NORMAL;');
    db.run('PRAGMA cache_size = -64000;');
    db.run('PRAGMA temp_store = MEMORY;');
    db.run('PRAGMA foreign_keys = ON;');

    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          university TEXT DEFAULT 'Regional / State University',
          degree_level TEXT DEFAULT 'B.Tech / B.S.',
          current_year TEXT DEFAULT '3rd Year (Class of 2027)',
          cgpa REAL DEFAULT 8.5,
          target_domains TEXT DEFAULT '["Artificial Intelligence & ML"]',
          skills TEXT DEFAULT '["Python", "PyTorch", "Research Writing"]',
          rrs_score INTEGER DEFAULT 75,
          rrs_tier TEXT DEFAULT 'Junior Researcher',
          role TEXT DEFAULT 'student',
          credits_remaining INTEGER DEFAULT 10,
          tokens_balance INTEGER DEFAULT 5,
          login_streak INTEGER DEFAULT 1,
          xp_points INTEGER DEFAULT 100,
          daily_reward_claimed_today INTEGER DEFAULT 0,
          oauth_provider TEXT,
          is_pro INTEGER DEFAULT 0,
          is_verified INTEGER DEFAULT 1,
          is_institutional_verified INTEGER DEFAULT 0,
          institutional_email TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS outreach_drafts (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL,
          professor_id TEXT NOT NULL,
          professor_name TEXT NOT NULL,
          professor_university TEXT NOT NULL,
          paper_title TEXT NOT NULL,
          subject_line TEXT NOT NULL,
          body TEXT NOT NULL,
          status TEXT DEFAULT 'Drafted',
          days_since_sent INTEGER DEFAULT 0,
          sent_at TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS daily_claims (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          streak_day INTEGER NOT NULL,
          tokens_awarded INTEGER NOT NULL,
          credits_awarded INTEGER NOT NULL,
          claimed_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    });

    dbInstance = db;
    return dbInstance;
  } catch (err) {
    console.warn('[Database] Exception opening SQLite, operating in in-memory mode:', err.message);
    dbInstance = createMemoryDbMock();
    return dbInstance;
  }
}

export const dbRun = (sql, params = []) => {
  const db = getSqliteDb();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this?.lastID || 1, changes: this?.changes || 1 });
    });
  });
};

export const dbGet = (sql, params = []) => {
  const db = getSqliteDb();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

export const dbAll = (sql, params = []) => {
  const db = getSqliteDb();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

// High-Level Data Access Object (DAO) with transparent Memory Fallback
export const sqliteDao = {
  async getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();

    // Check memory store first if running in serverless
    if (!sqlite3 && memoryStore.users.has(cleanEmail)) {
      return memoryStore.users.get(cleanEmail);
    }

    try {
      const row = await dbGet('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [cleanEmail]);
      if (row) {
        return {
          id: row.id,
          _id: row.id,
          email: row.email,
          passwordHash: row.password_hash,
          fullName: row.full_name,
          university: row.university,
          degreeLevel: row.degree_level,
          currentYear: row.current_year,
          cgpa: row.cgpa,
          targetDomains: JSON.parse(row.target_domains || '[]'),
          skills: JSON.parse(row.skills || '[]'),
          rrsScore: row.rrs_score,
          rrsTier: row.rrs_tier,
          role: row.role,
          creditsRemaining: row.credits_remaining,
          tokensBalance: row.tokens_balance,
          loginStreak: row.login_streak,
          xpPoints: row.xp_points,
          dailyRewardClaimedToday: Boolean(row.daily_reward_claimed_today),
          oauthProvider: row.oauth_provider,
          isPro: Boolean(row.is_pro),
          isVerified: Boolean(row.is_verified),
          isInstitutionalVerified: Boolean(row.is_institutional_verified),
          institutionalEmail: row.institutional_email || null,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } catch {
      // Fallback to memory
    }

    return memoryStore.users.get(cleanEmail) || null;
  },

  async getUserById(id) {
    if (!id) return null;

    if (!sqlite3) {
      for (const u of memoryStore.users.values()) {
        if (u.id === id || u._id === id) return u;
      }
    }

    try {
      const row = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
      if (row) {
        return {
          id: row.id,
          _id: row.id,
          email: row.email,
          passwordHash: row.password_hash,
          fullName: row.full_name,
          university: row.university,
          degreeLevel: row.degree_level,
          currentYear: row.current_year,
          cgpa: row.cgpa,
          targetDomains: JSON.parse(row.target_domains || '[]'),
          skills: JSON.parse(row.skills || '[]'),
          rrsScore: row.rrs_score,
          rrsTier: row.rrs_tier,
          role: row.role,
          creditsRemaining: row.credits_remaining,
          tokensBalance: row.tokens_balance,
          loginStreak: row.login_streak,
          xpPoints: row.xp_points,
          dailyRewardClaimedToday: Boolean(row.daily_reward_claimed_today),
          oauthProvider: row.oauth_provider,
          isPro: Boolean(row.is_pro),
          isVerified: Boolean(row.is_verified),
          isInstitutionalVerified: Boolean(row.is_institutional_verified),
          institutionalEmail: row.institutional_email || null,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } catch {
      // Fallback
    }

    for (const u of memoryStore.users.values()) {
      if (u.id === id || u._id === id) return u;
    }
    return null;
  },

  async upsertUser(user) {
    const existing = (user.id || user._id) ? await this.getUserById(user.id || user._id) : (user.email ? await this.getUserByEmail(user.email) : null);
    const id = user.id || user._id || (existing ? existing.id : `usr_${Date.now()}`);
    const email = (user.email || (existing ? existing.email : '')).toLowerCase().trim();
    const passwordHash = user.passwordHash || (existing ? existing.passwordHash : '');
    const fullName = user.fullName || (existing ? existing.fullName : 'Scholar');
    const university = user.university || (existing ? existing.university : 'Regional / State University');
    const degreeLevel = user.degreeLevel || (existing ? existing.degreeLevel : 'B.Tech / B.S.');
    const currentYear = user.currentYear || (existing ? existing.currentYear : '3rd Year');
    const cgpa = user.cgpa !== undefined ? user.cgpa : (existing ? existing.cgpa : 8.5);
    const targetDomains = user.targetDomains || (existing ? existing.targetDomains : ['Artificial Intelligence & ML']);
    const skills = user.skills || (existing ? existing.skills : ['Python', 'PyTorch']);
    const rrsScore = user.rrsScore !== undefined ? user.rrsScore : (existing ? existing.rrsScore : 75);
    const rrsTier = user.rrsTier || (existing ? existing.rrsTier : 'Junior Researcher');
    const role = user.role || (existing ? existing.role : 'student');
    const creditsRemaining = user.creditsRemaining !== undefined ? user.creditsRemaining : (existing ? existing.creditsRemaining : 10);
    const tokensBalance = user.tokensBalance !== undefined ? user.tokensBalance : (existing ? existing.tokensBalance : 5);
    const loginStreak = user.loginStreak !== undefined ? user.loginStreak : (existing ? existing.loginStreak : 1);
    const xpPoints = user.xpPoints !== undefined ? user.xpPoints : (existing ? existing.xpPoints : 100);
    const dailyRewardClaimedToday = user.dailyRewardClaimedToday !== undefined ? Boolean(user.dailyRewardClaimedToday) : (existing ? Boolean(existing.dailyRewardClaimedToday) : false);
    const oauthProvider = user.oauthProvider !== undefined ? user.oauthProvider : (existing ? existing.oauthProvider : null);
    const isPro = user.isPro !== undefined ? Boolean(user.isPro) : (existing ? Boolean(existing.isPro) : false);
    const isVerified = user.isVerified !== undefined ? Boolean(user.isVerified) : (existing ? Boolean(existing.isVerified) : true);
    const isInstitutionalVerified = user.isInstitutionalVerified !== undefined ? Boolean(user.isInstitutionalVerified) : (existing ? Boolean(existing.isInstitutionalVerified) : false);
    const institutionalEmail = user.institutionalEmail !== undefined ? user.institutionalEmail : (existing ? existing.institutionalEmail : null);

    const fullUser = {
      id,
      _id: id,
      email,
      passwordHash,
      fullName,
      university,
      degreeLevel,
      currentYear,
      cgpa,
      targetDomains,
      skills,
      rrsScore,
      rrsTier,
      role,
      creditsRemaining,
      tokensBalance,
      loginStreak,
      xpPoints,
      dailyRewardClaimedToday,
      oauthProvider,
      isPro,
      isVerified,
      isInstitutionalVerified,
      institutionalEmail,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Always update in-memory cache
    if (email) memoryStore.users.set(email, fullUser);

    if (sqlite3) {
      try {
        if (existing) {
          await dbRun(`
            UPDATE users SET
              email = ?, password_hash = ?, full_name = ?, university = ?, degree_level = ?,
              current_year = ?, cgpa = ?, target_domains = ?, skills = ?, rrs_score = ?,
              rrs_tier = ?, role = ?, credits_remaining = ?, tokens_balance = ?, login_streak = ?,
              xp_points = ?, daily_reward_claimed_today = ?, oauth_provider = ?, is_pro = ?,
              is_verified = ?, is_institutional_verified = ?, institutional_email = ?,
              updated_at = datetime('now')
            WHERE id = ?
          `, [
            email, passwordHash, fullName, university, degreeLevel,
            currentYear, cgpa, JSON.stringify(targetDomains), JSON.stringify(skills), rrsScore,
            rrsTier, role, creditsRemaining, tokensBalance, loginStreak,
            xpPoints, dailyRewardClaimedToday ? 1 : 0, oauthProvider, isPro ? 1 : 0,
            isVerified ? 1 : 0, isInstitutionalVerified ? 1 : 0, institutionalEmail, id
          ]);
        } else {
          await dbRun(`
            INSERT INTO users (
              id, email, password_hash, full_name, university, degree_level,
              current_year, cgpa, target_domains, skills, rrs_score,
              rrs_tier, role, credits_remaining, tokens_balance, login_streak,
              xp_points, daily_reward_claimed_today, oauth_provider, is_pro,
              is_verified, is_institutional_verified, institutional_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            id, email, passwordHash, fullName, university, degreeLevel,
            currentYear, cgpa, JSON.stringify(targetDomains), JSON.stringify(skills), rrsScore,
            rrsTier, role, creditsRemaining, tokensBalance, loginStreak,
            xpPoints, dailyRewardClaimedToday ? 1 : 0, oauthProvider, isPro ? 1 : 0,
            isVerified ? 1 : 0, isInstitutionalVerified ? 1 : 0, institutionalEmail
          ]);
        }
      } catch {
        // Continue with memory store
      }
    }

    return fullUser;
  },

  async logDailyClaim(userId, streakDay, tokensAwarded, creditsAwarded) {
    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    memoryStore.claims.set(claimId, { id: claimId, userId, streakDay, tokensAwarded, creditsAwarded, claimedAt: new Date().toISOString() });
    if (sqlite3) {
      try {
        await dbRun(`
          INSERT INTO daily_claims (id, user_id, streak_day, tokens_awarded, credits_awarded)
          VALUES (?, ?, ?, ?, ?)
        `, [claimId, userId, streakDay, tokensAwarded, creditsAwarded]);
      } catch {
        // Fallback
      }
    }
    return claimId;
  },

  async getDraftsByStudent(studentId) {
    const memDrafts = Array.from(memoryStore.drafts.values()).filter(d => d.studentId === studentId);
    if (!sqlite3) return memDrafts;
    try {
      const rows = await dbAll('SELECT * FROM outreach_drafts WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
      return rows.length ? rows : memDrafts;
    } catch {
      return memDrafts;
    }
  },

  async saveDraft(draft) {
    memoryStore.drafts.set(draft.id, draft);
    if (sqlite3) {
      try {
        const existing = await dbGet('SELECT * FROM outreach_drafts WHERE id = ?', [draft.id]);
        if (existing) {
          await dbRun(`
            UPDATE outreach_drafts SET
              status = COALESCE(?, status),
              days_since_sent = COALESCE(?, days_since_sent),
              sent_at = COALESCE(?, sent_at),
              body = COALESCE(?, body),
              subject_line = COALESCE(?, subject_line),
              updated_at = datetime('now')
            WHERE id = ?
          `, [
            draft.status || null,
            draft.daysSinceSent !== undefined ? draft.daysSinceSent : null,
            draft.sentAt || null,
            draft.body || draft.body_text || null,
            draft.subjectLine || draft.subject_line || null,
            draft.id
          ]);
        } else {
          await dbRun(`
            INSERT INTO outreach_drafts (
              id, student_id, professor_id, professor_name, professor_university,
              paper_title, subject_line, body, status, days_since_sent, sent_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            draft.id,
            draft.studentId || draft.student_id || 'student_active',
            draft.professorId || draft.professor_id || 'prof_unknown',
            draft.professorName || draft.professor_name || 'Professor',
            draft.professorUniversity || draft.professor_university || 'University',
            draft.paperTitle || draft.paper_title || 'Research Publication',
            draft.subjectLine || draft.subject_line || 'Research Inquiry',
            draft.body || draft.body_text || '',
            draft.status || 'Drafted',
            draft.daysSinceSent || 0,
            draft.sentAt || null
          ]);
        }
      } catch {
        // In-memory already updated
      }
    }
  }
};

// Safe bootstrap
getSqliteDb();
