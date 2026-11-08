/**
 * Anusandhan - Persistent SQLite Relational Database Engine
 * Provides durable, ACID-compliant local SQL storage on disk (anusandhan.sqlite)
 * when external PostgreSQL/MongoDB is not connected.
 */
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'anusandhan.sqlite');

let dbInstance = null;

export function getSqliteDb() {
  if (dbInstance) return dbInstance;

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('[SQLite] Failed to connect to local database:', err.message);
    } else {
      console.log(`[SQLite] Connected to durable relational database on disk: ${DB_PATH}`);
    }
  });

  // Enable WAL mode (Write-Ahead Logging) for superior concurrent read/write throughput
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA foreign_keys = ON;');

  // Initialize Tables
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
        skills TEXT DEFAULT '["Python", "PyTorch", "Git"]',
        rrs_score INTEGER DEFAULT 75,
        rrs_tier TEXT DEFAULT 'Junior Researcher',
        role TEXT DEFAULT 'student',
        credits_remaining INTEGER DEFAULT 10,
        tokens_balance INTEGER DEFAULT 5,
        login_streak INTEGER DEFAULT 1,
        xp_points INTEGER DEFAULT 100,
        daily_reward_claimed_today INTEGER DEFAULT 0,
        oauth_provider TEXT DEFAULT NULL,
        is_pro INTEGER DEFAULT 0,
        is_verified INTEGER DEFAULT 1,
        is_institutional_verified INTEGER DEFAULT 0,
        institutional_email TEXT DEFAULT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Non-destructive schema evolution migrations
    db.run(`ALTER TABLE users ADD COLUMN is_institutional_verified INTEGER DEFAULT 0;`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN institutional_email TEXT DEFAULT NULL;`, () => {});

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
      CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'INR',
        status TEXT DEFAULT 'created',
        gateway TEXT NOT NULL,
        payment_id TEXT,
        invoice_number TEXT,
        credits_allocated INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
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
    db.run(`CREATE INDEX IF NOT EXISTS idx_drafts_student ON outreach_drafts(student_id);`);
  });

  dbInstance = db;
  return dbInstance;
}

// Promisified Helper Methods
export const dbRun = (sql, params = []) => {
  const db = getSqliteDb();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  const db = getSqliteDb();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  const db = getSqliteDb();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// High-Level Data Access Object (DAO)
export const sqliteDao = {
  async getUserByEmail(email) {
    const row = await dbGet('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (!row) return null;
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
  },

  async getUserById(id) {
    const row = await dbGet('SELECT * FROM users WHERE id = ?', [id]);
    if (!row) return null;
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
  },

  async upsertUser(user) {
    const existing = await this.getUserById(user.id || user._id) || (user.email ? await this.getUserByEmail(user.email) : null);
    const id = user.id || user._id || (existing ? existing.id : `usr_${Date.now()}`);
    const email = user.email || (existing ? existing.email : '');
    const passwordHash = user.passwordHash || (existing ? existing.passwordHash : '');
    const fullName = user.fullName || (existing ? existing.fullName : 'Scholar');
    const university = user.university || (existing ? existing.university : 'Regional / State University');
    const degreeLevel = user.degreeLevel || (existing ? existing.degreeLevel : 'B.Tech / B.S.');
    const currentYear = user.currentYear || (existing ? existing.currentYear : '3rd Year');
    const cgpa = user.cgpa !== undefined ? user.cgpa : (existing ? existing.cgpa : 8.5);
    const targetDomains = JSON.stringify(user.targetDomains || (existing ? existing.targetDomains : ['Artificial Intelligence & ML']));
    const skills = JSON.stringify(user.skills || (existing ? existing.skills : ['Python', 'PyTorch']));
    const rrsScore = user.rrsScore !== undefined ? user.rrsScore : (existing ? existing.rrsScore : 75);
    const rrsTier = user.rrsTier || (existing ? existing.rrsTier : 'Junior Researcher');
    const role = user.role || (existing ? existing.role : 'student');
    const creditsRemaining = user.creditsRemaining !== undefined ? user.creditsRemaining : (existing ? existing.creditsRemaining : 10);
    const tokensBalance = user.tokensBalance !== undefined ? user.tokensBalance : (existing ? existing.tokensBalance : 5);
    const loginStreak = user.loginStreak !== undefined ? user.loginStreak : (existing ? existing.loginStreak : 1);
    const xpPoints = user.xpPoints !== undefined ? user.xpPoints : (existing ? existing.xpPoints : 100);
    const dailyRewardClaimedToday = user.dailyRewardClaimedToday !== undefined ? (user.dailyRewardClaimedToday ? 1 : 0) : (existing ? (existing.dailyRewardClaimedToday ? 1 : 0) : 0);
    const oauthProvider = user.oauthProvider !== undefined ? user.oauthProvider : (existing ? existing.oauthProvider : null);
    const isPro = user.isPro !== undefined ? (user.isPro ? 1 : 0) : (existing ? (existing.isPro ? 1 : 0) : 0);
    const isVerified = user.isVerified !== undefined ? (user.isVerified ? 1 : 0) : (existing ? (existing.isVerified ? 1 : 0) : 1);
    const isInstitutionalVerified = user.isInstitutionalVerified !== undefined ? (user.isInstitutionalVerified ? 1 : 0) : (existing ? (existing.isInstitutionalVerified ? 1 : 0) : 0);
    const institutionalEmail = user.institutionalEmail !== undefined ? user.institutionalEmail : (existing ? existing.institutionalEmail : null);

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
        currentYear, cgpa, targetDomains, skills, rrsScore,
        rrsTier, role, creditsRemaining, tokensBalance, loginStreak,
        xpPoints, dailyRewardClaimedToday, oauthProvider, isPro,
        isVerified, isInstitutionalVerified, institutionalEmail, id
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
        currentYear, cgpa, targetDomains, skills, rrsScore,
        rrsTier, role, creditsRemaining, tokensBalance, loginStreak,
        xpPoints, dailyRewardClaimedToday, oauthProvider, isPro,
        isVerified, isInstitutionalVerified, institutionalEmail
      ]);
    }

    return await this.getUserById(id);
  },

  async logDailyClaim(userId, streakDay, tokensAwarded, creditsAwarded) {
    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await dbRun(`
      INSERT INTO daily_claims (id, user_id, streak_day, tokens_awarded, credits_awarded)
      VALUES (?, ?, ?, ?, ?)
    `, [claimId, userId, streakDay, tokensAwarded, creditsAwarded]);
    return claimId;
  },

  async getDraftsByStudent(studentId) {
    return await dbAll('SELECT * FROM outreach_drafts WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
  },

  async saveDraft(draft) {
    const existing = await dbGet('SELECT id FROM outreach_drafts WHERE id = ?', [draft.id]);
    if (existing) {
      await dbRun(`
        UPDATE outreach_drafts SET
          status = ?, days_since_sent = ?, sent_at = ?, body = ?, subject_line = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [draft.status, draft.daysSinceSent || 0, draft.sentAt || null, draft.body, draft.subjectLine, draft.id]);
    } else {
      await dbRun(`
        INSERT INTO outreach_drafts (
          id, student_id, professor_id, professor_name, professor_university,
          paper_title, subject_line, body, status, days_since_sent, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        draft.id, draft.studentId, draft.professorId, draft.professorName, draft.professorUniversity,
        draft.paperTitle, draft.subjectLine, draft.body, draft.status || 'Drafted', draft.daysSinceSent || 0, draft.sentAt || null
      ]);
    }
  }
};

// Initialize DB schema on import
getSqliteDb();
