import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { sqliteDao } from '../db/sqliteDb.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
}

// Resilient in-memory store for instant fallback if MongoDB is not locally running
const memoryUsers = new Map();

// Seed standard verified scholar accounts for instant evaluation & demo sign-in
async function seedDefaultUsers() {
  try {
    const hash = await hashPassword('scholar123');
    const demoScholars = [
      {
        id: 'usr_aarav_sharma',
        _id: 'usr_aarav_sharma',
        email: 'aarav.sharma@iisc.ac.in',
        passwordHash: hash,
        fullName: 'Aarav Sharma',
        university: 'Indian Institute of Science (IISc) Bangalore',
        degreeLevel: 'B.Tech / Undergraduate',
        cgpa: 9.4,
        targetDomains: ['Artificial Intelligence & ML'],
        skills: ['PyTorch', 'CUDA', 'Distributed Attention', 'C++'],
        rrsScore: 94,
        rrsTier: 'Elite Candidate',
        role: 'student',
        creditsRemaining: 24,
        tokensBalance: 14,
        loginStreak: 4,
        xpPoints: 340,
        dailyRewardClaimedToday: false,
        scholarBadges: ['Early Scholar', 'Consistent Researcher', 'Literature Grounded'],
        isVerified: true,
        isInstitutionalVerified: true,
        institutionalEmail: 'aarav.sharma@iisc.ac.in',
        linkedAccounts: {
          githubUrl: 'https://github.com/aarav-sharma-ml'
        },
        createdAt: new Date()
      },
      {
        id: 'usr_demo_scholar',
        _id: 'usr_demo_scholar',
        email: 'scholar@anusandhan.ai',
        passwordHash: hash,
        fullName: 'Scholar Demo',
        university: 'Indian Institute of Technology (IIT) Bombay',
        degreeLevel: 'Undergraduate Researcher',
        cgpa: 9.1,
        targetDomains: ['Artificial Intelligence & ML', 'Robotics & Autonomous Systems'],
        skills: ['Python', 'PyTorch', 'ROS2', 'LaTeX'],
        rrsScore: 91,
        rrsTier: 'Elite Candidate',
        role: 'student',
        creditsRemaining: 30,
        tokensBalance: 22,
        loginStreak: 6,
        xpPoints: 480,
        dailyRewardClaimedToday: false,
        scholarBadges: ['Early Scholar', 'Grant Hunter', 'Streak Master'],
        isVerified: true,
        isInstitutionalVerified: true,
        institutionalEmail: 'scholar@anusandhan.ai',
        linkedAccounts: {
          githubUrl: 'https://github.com/anusandhan-scholar'
        },
        createdAt: new Date()
      }
    ];

    for (const s of demoScholars) {
      memoryUsers.set(s.email, s);
      await sqliteDao.upsertUser(s).catch(() => {});
    }
    console.log('[Auth] Demo scholars seeded and persisted in SQLite database.');
  } catch (err) {
    console.warn('Failed to seed demo scholars:', err.message);
  }
}
seedDefaultUsers();

export async function findUserByEmail(email) {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  if (isDbConnected()) {
    try {
      const u = await User.findOne({ email: normalized });
      if (u) return u;
    } catch {}
  }
  try {
    const sqliteUser = await sqliteDao.getUserByEmail(normalized);
    if (sqliteUser) {
      memoryUsers.set(normalized, sqliteUser);
      return sqliteUser;
    }
  } catch {}
  return memoryUsers.get(normalized) || null;
}

export async function saveUser(user) {
  if (!user || !user.email) return;
  const normalized = user.email.toLowerCase().trim();
  memoryUsers.set(normalized, user);
  try {
    await sqliteDao.upsertUser(user);
  } catch (err) {
    console.warn('[SQLite] Failed to persist user:', err.message);
  }
  if (isDbConnected() && typeof user.save === 'function') {
    try {
      await user.save();
    } catch {}
  }
}

function createToken(payload) {
  const secret = process.env.JWT_SECRET || JWT_SECRET;
  if (!secret) {
    throw new Error('Cannot issue JWT: JWT_SECRET environment variable is not defined.');
  }
  return jwt.sign(payload, secret, { expiresIn: '14d' });
}

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
}

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * POST /api/auth/register
 * Creates a new student / researcher account with cryptographically hashed password.
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, university, fieldOfStudy, degreeLevel, cgpa } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const hashedPassword = await hashPassword(password);
    const userId = 'usr_' + Date.now().toString(36);

    const userData = {
      id: userId,
      _id: userId,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      fullName: fullName.trim(),
      university: university || 'State / Regional University',
      degreeLevel: degreeLevel || 'Undergraduate Student',
      cgpa: parseFloat(cgpa) || 8.2,
      targetDomains: fieldOfStudy ? [fieldOfStudy] : ['Artificial Intelligence & ML'],
      skills: ['Python', 'Data Structures', 'Research Methodology'],
      rrsScore: 72,
      rrsTier: 'Competitive Candidate',
      role: 'student',
      creditsRemaining: 10,
      tokensBalance: 5,
      loginStreak: 1,
      xpPoints: 100,
      dailyRewardClaimedToday: false,
      isVerified: false,
      isInstitutionalVerified: false,
      institutionalEmail: null,
      linkedAccounts: {},
      createdAt: new Date()
    };

    await saveUser(userData);
    const savedUser = userData;

    const token = createToken({
      id: savedUser._id || savedUser.id,
      email: normalizedEmail,
      fullName: savedUser.fullName
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: sanitizeUser(savedUser)
    });

  } catch (err) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

/**
 * POST /api/auth/login
 * Validates credentials and returns a secure JWT bearer token.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up user
    let user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email. Please check your credentials or register.' });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = createToken({
      id: user._id || user.id,
      email: normalizedEmail,
      fullName: user.fullName
    });

    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: sanitizeUser(user)
    });

  } catch (err) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ error: 'Sign in failed: ' + err.message });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current active user profile using JWT token.
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json({
      success: true,
      user: sanitizeUser(user)
    });

  } catch (err) {
    res.status(500).json({ error: 'Session verification failed: ' + err.message });
  }
});

/**
 * POST /api/auth/refresh-token
 * Rotates and re-issues a fresh session token
 */
router.post('/refresh-token', authenticateToken, (req, res) => {
  const refreshedToken = createToken({
    id: req.user.id,
    email: req.user.email,
    fullName: req.user.fullName
  });

  res.json({
    success: true,
    message: 'Token rotated successfully',
    token: refreshedToken
  });
});

/**
 * POST /api/auth/verify-institutional-email
 * Validates accredited university / national lab domain (.ac.in, .edu, .res.in)
 */
router.post('/verify-institutional-email', authenticateToken, async (req, res) => {
  try {
    const { institutionalEmail } = req.body;
    if (!institutionalEmail) {
      return res.status(400).json({ error: 'Institutional email is required' });
    }

    const normalizedEmail = (req.user?.email || '').toLowerCase().trim();
    if (!normalizedEmail) {
      return res.status(401).json({ error: 'Access token required.' });
    }

    // 1. Pre-check: Reject if account has already been verified
    let currentUser = null;
    if (isDbConnected()) {
      try {
        currentUser = await User.findOne({ email: normalizedEmail });
      } catch {
        currentUser = memoryUsers.get(normalizedEmail);
      }
    } else {
      currentUser = memoryUsers.get(normalizedEmail);
    }
    if (!currentUser) {
      currentUser = memoryUsers.get(normalizedEmail);
    }

    if (currentUser?.isInstitutionalVerified === true) {
      return res.status(400).json({
        verified: true,
        error: 'Institutional affiliation has already been verified for this account.'
      });
    }

    const domain = institutionalEmail.split('@')[1]?.toLowerCase()?.trim();
    const isAccredited = domain && (
      domain.endsWith('.ac.in') ||
      domain.endsWith('.edu') ||
      domain.endsWith('.res.in') ||
      domain.includes('iisc.') ||
      domain.includes('tifr.') ||
      domain.includes('mpg.de') ||
      domain.includes('ethz.ch') ||
      domain.includes('cern.ch')
    );

    if (!isAccredited) {
      return res.status(400).json({
        verified: false,
        message: 'Domain is not recognized as an accredited university or national research lab (.ac.in, .edu, .res.in).'
      });
    }

    // Award verified badge and bonus credits in memory / database
    const normalizedInstEmail = institutionalEmail.toLowerCase().trim();

    let updatedUserDoc = null;
    if (isDbConnected()) {
      try {
        updatedUserDoc = await User.findOneAndUpdate(
          { email: normalizedEmail, isInstitutionalVerified: { $ne: true } },
          {
            $set: {
              isVerified: true,
              isInstitutionalVerified: true,
              institutionalEmail: normalizedInstEmail,
              updatedAt: new Date()
            },
            $inc: { creditsRemaining: 10 }
          },
          { new: true }
        );
      } catch (dbErr) {
        console.error('[Auth Verify Institutional Error - DB]:', dbErr);
        throw dbErr;
      }

      if (!updatedUserDoc) {
        return res.status(400).json({
          verified: true,
          error: 'Institutional affiliation has already been verified for this account.'
        });
      }

      memoryUsers.set(normalizedEmail, updatedUserDoc.toObject ? updatedUserDoc.toObject() : updatedUserDoc);
    } else {
      // In-Memory store synchronization with atomic idempotency enforcement
      const user = memoryUsers.get(normalizedEmail);
      if (!user) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      if (user.isInstitutionalVerified === true) {
        return res.status(400).json({
          verified: true,
          error: 'Institutional affiliation has already been verified for this account.'
        });
      }

      user.isVerified = true;
      user.isInstitutionalVerified = true;
      user.institutionalEmail = normalizedInstEmail;
      user.creditsRemaining = (user.creditsRemaining || 10) + 10;
      user.updatedAt = new Date();
    }

    res.json({
      verified: true,
      domain,
      bonusCreditsAwarded: 10,
      message: 'Institutional scholar affiliation verified successfully! +10 outreach credits awarded.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Institutional verification failed: ' + err.message });
  }
});

/**
 * POST /api/auth/oauth
 * Universal OAuth login / registration supporting Google and LinkedIn
 */
router.post('/oauth', async (req, res) => {
  try {
    const { provider, email, fullName, avatarUrl, university, fieldOfStudy } = req.body;
    if (!provider || !['google', 'linkedin', 'github'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid OAuth provider. Expected "google", "linkedin", or "github".' });
    }

    const defaultEmail = provider === 'google' 
      ? 'scholar.google@gmail.com' 
      : (provider === 'github' ? 'scholar.github@octocat.io' : 'scholar.linkedin@alumni.edu');
    const defaultName = provider === 'google' 
      ? 'Google Scholar' 
      : (provider === 'github' ? 'GitHub Developer & Researcher' : 'LinkedIn Scholar');

    const normalizedEmail = (email || defaultEmail).toLowerCase().trim();
    const effectiveName = fullName || defaultName;

    let user = await findUserByEmail(normalizedEmail);
    if (!user) {
      user = {
        id: `usr_${provider}_${Date.now().toString(36)}`,
        _id: `usr_${provider}_${Date.now().toString(36)}`,
        email: normalizedEmail,
        fullName: effectiveName,
        university: university || (provider === 'github' ? 'International Institute of Information Technology (IIIT)' : (provider === 'linkedin' ? 'Indian Institute of Technology (IIT) Delhi' : 'Indian Institute of Science (IISc) Bangalore')),
        degreeLevel: 'Undergraduate Researcher',
        cgpa: 9.3,
        targetDomains: fieldOfStudy ? [fieldOfStudy] : ['Artificial Intelligence & ML'],
        skills: ['Python', 'PyTorch', 'Git', 'CUDA', 'Data Analysis'],
        rrsScore: 92,
        rrsTier: 'Elite Candidate',
        role: 'student',
        creditsRemaining: 30,
        tokensBalance: 15,
        loginStreak: 1,
        xpPoints: 200,
        dailyRewardClaimedToday: false,
        scholarBadges: [`${provider.charAt(0).toUpperCase() + provider.slice(1)} Verified`, 'Early Scholar'],
        oauthProvider: provider,
        avatarUrl: avatarUrl || (provider === 'github' ? 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' : (provider === 'google' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150')),
        isVerified: true,
        linkedAccounts: {
          [provider === 'google' ? 'googleScholarUrl' : (provider === 'github' ? 'githubUrl' : 'linkedinUrl')]: `https://${provider}.com/${effectiveName.toLowerCase().replace(/\s+/g, '-')}`
        },
        createdAt: new Date()
      };
    } else {
      user.oauthProvider = provider;
    }

    await saveUser(user);

    const token = createToken({
      id: user.id || user._id,
      email: normalizedEmail,
      fullName: user.fullName
    });

    res.json({
      success: true,
      provider,
      message: `Signed in successfully via ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    res.status(500).json({ error: 'OAuth authentication failed: ' + err.message });
  }
});

/**
 * POST /api/auth/claim-daily-reward
 * Awards daily login credits (+3 free credits) and 1–3 random Shodh tokens + streak increments
 */
router.post('/claim-daily-reward', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email?.toLowerCase()?.trim();
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (user.dailyRewardClaimedToday) {
      return res.status(400).json({
        claimed: true,
        message: 'Daily reward already claimed today. Come back tomorrow to maintain your streak!'
      });
    }

    // 1 to 3 random tokens
    const baseTokens = Math.floor(Math.random() * 3) + 1;
    const currentStreak = (user.loginStreak || 0) + 1;
    let bonusTokens = 0;

    // Milestone bonus: 3-day streak = +1 bonus token, 7-day streak = +3 bonus tokens
    if (currentStreak % 7 === 0) {
      bonusTokens = 3;
    } else if (currentStreak % 3 === 0) {
      bonusTokens = 1;
    }

    const totalTokensAwarded = baseTokens + bonusTokens;
    const creditsAwarded = currentStreak >= 7 ? 5 : 3;
    const xpAwarded = 50 + (currentStreak * 10);

    user.creditsRemaining = (user.creditsRemaining || 0) + creditsAwarded;
    user.tokensBalance = (user.tokensBalance || 0) + totalTokensAwarded;
    user.loginStreak = currentStreak;
    user.xpPoints = (user.xpPoints || 0) + xpAwarded;
    user.dailyRewardClaimedToday = true;
    user.lastLoginDate = new Date().toISOString();

    await saveUser(user);
    await sqliteDao.logDailyClaim(user.id || user._id, currentStreak, totalTokensAwarded, creditsAwarded).catch(() => {});

    res.json({
      success: true,
      creditsAwarded,
      tokensAwarded: totalTokensAwarded,
      baseTokens,
      bonusTokens,
      newStreak: currentStreak,
      totalCredits: user.creditsRemaining,
      totalTokens: user.tokensBalance,
      xpAwarded,
      user: sanitizeUser(user),
      message: `🎉 Claimed ${creditsAwarded} free credits and ${totalTokensAwarded} 🪙 Shodh Tokens! Streak: ${currentStreak} days.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to claim daily reward: ' + err.message });
  }
});

/**
 * POST /api/auth/redeem-tokens
 * Allows students to spend collected tokens to purchase Pro plans or credit packages
 */
router.post('/redeem-tokens', authenticateToken, async (req, res) => {
  try {
    const { planId, tokenCost, creditsToAdd } = req.body;
    if (!planId || !tokenCost || tokenCost <= 0) {
      return res.status(400).json({ error: 'Valid planId and tokenCost are required.' });
    }

    const email = req.user.email?.toLowerCase()?.trim();
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if ((user.tokensBalance || 0) < tokenCost) {
      return res.status(400).json({
        error: `Insufficient Shodh Tokens. You have ${user.tokensBalance || 0} tokens, but ${tokenCost} are required. Maintain your daily streak to earn more!`
      });
    }

    user.tokensBalance -= tokenCost;
    user.creditsRemaining = (user.creditsRemaining || 0) + (creditsToAdd || 50);
    user.isPro = true;
    user.proExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    user.scholarBadges = Array.from(new Set([...(user.scholarBadges || []), 'Pro Token Backer']));

    await saveUser(user);

    res.json({
      success: true,
      planId,
      tokenCost,
      remainingTokens: user.tokensBalance,
      creditsRemaining: user.creditsRemaining,
      isPro: true,
      user: sanitizeUser(user),
      message: `🌟 Successfully unlocked ${planId} with ${tokenCost} Shodh Tokens! +${creditsToAdd || 50} credits added.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to redeem tokens: ' + err.message });
  }
});

export default router;
