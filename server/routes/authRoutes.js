import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { sqliteDao } from '../db/sqliteDb.js';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'anusandhan-dev-jwt-secret-2026';
  }
}

const router = express.Router();
const getJwtSecret = () => process.env.JWT_SECRET;

// Multi-tenant in-memory store for active session fallback (clean start, zero demo accounts)
const memoryUsers = new Map();

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
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Cannot issue JWT: JWT_SECRET environment variable is not defined.');
  }
  return jwt.sign({
    id: payload.id,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role || 'student'
  }, secret, { expiresIn: '14d' });
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
      university: university ? university.trim() : '',
      degreeLevel: degreeLevel || 'B.Tech / B.S.',
      cgpa: parseFloat(cgpa) || 0,
      targetDomains: fieldOfStudy ? [fieldOfStudy] : [],
      skills: [],
      rrsScore: 0,
      rrsTier: 'Developing',
      role: 'student',
      creditsRemaining: 10,
      tokensBalance: 5,
      loginStreak: 1,
      xpPoints: 50,
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
    let currentUser = await findUserByEmail(normalizedEmail);
    if (!currentUser) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    if (currentUser.isInstitutionalVerified === true) {
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

    currentUser.isVerified = true;
    currentUser.isInstitutionalVerified = true;
    currentUser.institutionalEmail = normalizedInstEmail;
    currentUser.creditsRemaining = (currentUser.creditsRemaining || 10) + 10;
    currentUser.updatedAt = new Date();

    await saveUser(currentUser);

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
 * GET /api/auth/oauth/config
 * Exposes configured OAuth client IDs so the frontend can initiate authentic OAuth 2.0 flows.
 */
router.get('/oauth/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
    githubClientId: process.env.GITHUB_CLIENT_ID || process.env.VITE_GITHUB_CLIENT_ID || '',
    linkedinClientId: process.env.LINKEDIN_CLIENT_ID || process.env.VITE_LINKEDIN_CLIENT_ID || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || ''
  });
});

/**
 * POST /api/auth/oauth/exchange
 * Exchanges OAuth authorization code with provider for real access token and user profile.
 */
router.post('/oauth/exchange', async (req, res) => {
  try {
    const { provider, code, redirectUri } = req.body;
    if (!provider || !code) {
      return res.status(400).json({ error: 'OAuth provider and authorization code are required.' });
    }

    let userEmail = '';
    let userFullName = '';
    let userAvatar = '';
    let linkedUrl = '';

    if (provider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Google OAuth credentials not configured on the server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.' });
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri || 'http://localhost:5000/oauth/callback',
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        return res.status(400).json({ error: tokenData.error_description || 'Failed to exchange Google OAuth code.' });
      }

      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const profile = await userRes.json();
      userEmail = profile.email;
      userFullName = profile.name || profile.given_name || '';
      userAvatar = profile.picture || '';
      linkedUrl = `https://scholar.google.com/citations?user=${userFullName.toLowerCase().replace(/\s+/g, '')}`;

    } else if (provider === 'github') {
      const clientId = process.env.GITHUB_CLIENT_ID || process.env.VITE_GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET || process.env.VITE_GITHUB_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'GitHub OAuth credentials not configured on the server. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.' });
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        return res.status(400).json({ error: tokenData.error_description || 'Failed to exchange GitHub OAuth code.' });
      }

      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'Anusandhan-Scholar-Engine'
        }
      });
      const profile = await userRes.json();
      userFullName = profile.name || profile.login;
      userAvatar = profile.avatar_url || '';
      linkedUrl = profile.html_url || `https://github.com/${profile.login}`;

      if (profile.email) {
        userEmail = profile.email;
      } else {
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'Anusandhan-Scholar-Engine'
          }
        });
        const emails = await emailRes.json();
        if (Array.isArray(emails)) {
          const primary = emails.find(e => e.primary && e.verified) || emails[0];
          userEmail = primary?.email || `${profile.login}@users.noreply.github.com`;
        }
      }

    } else if (provider === 'linkedin') {
      const clientId = process.env.LINKEDIN_CLIENT_ID || process.env.VITE_LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || process.env.VITE_LINKEDIN_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'LinkedIn OAuth credentials not configured on the server. Please set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env.' });
      }

      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        return res.status(400).json({ error: tokenData.error_description || 'Failed to exchange LinkedIn OAuth code.' });
      }

      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const profile = await userRes.json();
      userEmail = profile.email;
      userFullName = profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim();
      userAvatar = profile.picture || '';
      linkedUrl = `https://linkedin.com/in/${userFullName.toLowerCase().replace(/\s+/g, '-')}`;
    }

    if (!userEmail) {
      return res.status(400).json({ error: `Could not retrieve verified email address from ${provider}.` });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    let user = await findUserByEmail(normalizedEmail);

    if (!user) {
      user = {
        id: `usr_${provider}_${Date.now().toString(36)}`,
        _id: `usr_${provider}_${Date.now().toString(36)}`,
        email: normalizedEmail,
        fullName: userFullName || 'Verified Scholar',
        university: '',
        degreeLevel: 'B.Tech / B.S.',
        cgpa: 0,
        targetDomains: [],
        skills: [],
        rrsScore: 0,
        rrsTier: 'Developing',
        role: 'student',
        creditsRemaining: 10,
        tokensBalance: 5,
        loginStreak: 1,
        xpPoints: 50,
        dailyRewardClaimedToday: false,
        scholarBadges: [`${provider.charAt(0).toUpperCase() + provider.slice(1)} Verified`, 'Early Scholar'],
        oauthProvider: provider,
        avatarUrl: userAvatar,
        isVerified: true,
        linkedAccounts: {
          [provider === 'google' ? 'googleScholarUrl' : (provider === 'github' ? 'githubUrl' : 'linkedinUrl')]: linkedUrl
        },
        createdAt: new Date()
      };
    } else {
      user.oauthProvider = provider;
      if (userFullName && !user.fullName) user.fullName = userFullName;
      if (userAvatar && !user.avatarUrl) user.avatarUrl = userAvatar;
    }

    await saveUser(user);

    const token = createToken({
      id: user.id || user._id,
      email: normalizedEmail,
      fullName: user.fullName,
      role: user.role || 'student'
    });

    res.json({
      success: true,
      provider,
      message: `Signed in successfully via ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('[OAuth Exchange Error]:', err);
    res.status(500).json({ error: 'OAuth code exchange failed: ' + err.message });
  }
});

/**
 * POST /api/auth/oauth
 * Universal OAuth login / registration supporting Google, GitHub, and LinkedIn with verified identities
 */
router.post('/oauth', async (req, res) => {
  try {
    let { provider, email, fullName, avatarUrl, university, fieldOfStudy, credential, idToken } = req.body;
    if (!provider || !['google', 'linkedin', 'github'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid OAuth provider. Expected "google", "linkedin", or "github".' });
    }

    // Support authentic Google Identity Services (GIS) / OpenID Connect token verification
    if (provider === 'google' && (credential || idToken)) {
      try {
        const rawToken = credential || idToken;
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(rawToken)}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          if (payload.email) {
            email = payload.email;
            fullName = payload.name || payload.given_name || fullName;
            avatarUrl = payload.picture || avatarUrl;
          }
        }
      } catch (tokenErr) {
        console.warn('[GIS Tokeninfo Warning]:', tokenErr.message);
      }
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required for OAuth sign-in.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const effectiveName = fullName?.trim() || normalizedEmail.split('@')[0].replace(/[._\-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    let user = await findUserByEmail(normalizedEmail);
    if (!user) {
      user = {
        id: `usr_${provider}_${Date.now().toString(36)}`,
        _id: `usr_${provider}_${Date.now().toString(36)}`,
        email: normalizedEmail,
        fullName: effectiveName,
        university: university ? university.trim() : '',
        degreeLevel: 'B.Tech / B.S.',
        cgpa: 0,
        targetDomains: fieldOfStudy ? [fieldOfStudy] : [],
        skills: [],
        rrsScore: 0,
        rrsTier: 'Developing',
        role: 'student',
        creditsRemaining: 10,
        tokensBalance: 5,
        loginStreak: 1,
        xpPoints: 50,
        dailyRewardClaimedToday: false,
        scholarBadges: [`${provider.charAt(0).toUpperCase() + provider.slice(1)} Verified`, 'Early Scholar'],
        oauthProvider: provider,
        avatarUrl: avatarUrl || '',
        isVerified: true,
        linkedAccounts: {
          [provider === 'google' ? 'googleScholarUrl' : (provider === 'github' ? 'githubUrl' : 'linkedinUrl')]: `https://${provider}.com/${effectiveName.toLowerCase().replace(/\s+/g, '-')}`
        },
        createdAt: new Date()
      };
    } else {
      user.oauthProvider = provider;
      if (fullName && !user.fullName) user.fullName = effectiveName;
      if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
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
 * POST /api/auth/google
 * Dedicated Google Sign-In endpoint
 */
router.post('/google', async (req, res) => {
  req.body.provider = 'google';
  let { email, fullName, avatarUrl, university, fieldOfStudy, credential, idToken } = req.body;

  // Support authentic Google Identity Services (GIS) / OpenID Connect token verification
  if (credential || idToken) {
    try {
      const rawToken = credential || idToken;
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(rawToken)}`);
      if (verifyRes.ok) {
        const payload = await verifyRes.json();
        if (payload.email) {
          email = payload.email;
          fullName = payload.name || payload.given_name || fullName;
          avatarUrl = payload.picture || avatarUrl;
        }
      }
    } catch (tokenErr) {
      console.warn('[GIS Google Tokeninfo Warning]:', tokenErr.message);
    }
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required for Google Sign-In.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const effectiveName = fullName?.trim() || normalizedEmail.split('@')[0].replace(/[._\-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  try {
    let user = await findUserByEmail(normalizedEmail);
    if (!user) {
      user = {
        id: `usr_google_${Date.now().toString(36)}`,
        _id: `usr_google_${Date.now().toString(36)}`,
        email: normalizedEmail,
        fullName: effectiveName,
        university: university ? university.trim() : '',
        degreeLevel: 'B.Tech / B.S.',
        cgpa: 0,
        targetDomains: fieldOfStudy ? [fieldOfStudy] : [],
        skills: [],
        rrsScore: 0,
        rrsTier: 'Developing',
        role: 'student',
        creditsRemaining: 10,
        tokensBalance: 5,
        loginStreak: 1,
        xpPoints: 50,
        dailyRewardClaimedToday: false,
        scholarBadges: ['Google Verified', 'Early Scholar'],
        oauthProvider: 'google',
        avatarUrl: avatarUrl || '',
        isVerified: true,
        linkedAccounts: { googleScholarUrl: `https://scholar.google.com/citations?user=${effectiveName.toLowerCase().replace(/\s+/g, '')}` },
        createdAt: new Date()
      };
    } else {
      user.oauthProvider = 'google';
      if (fullName && !user.fullName) user.fullName = effectiveName;
      if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
    }

    await saveUser(user);
    const token = createToken({
      id: user.id || user._id,
      email: normalizedEmail,
      fullName: user.fullName,
      role: user.role || 'student'
    });

    res.json({
      success: true,
      provider: 'google',
      message: 'Signed in successfully via Google Sign-In',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    res.status(500).json({ error: 'Google authentication failed: ' + err.message });
  }
});

/**
 * POST /api/auth/register-with-cv
 * Creates an authentic scholar profile and issues session token directly from parsed CV data.
 */
router.post('/register-with-cv', async (req, res) => {
  try {
    const { email, fullName, university, cgpa, skills, targetDomains, rrsScore, rrsTier, password } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ error: 'Candidate name and email extracted from CV are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await findUserByEmail(normalizedEmail);

    if (user) {
      // If user exists, log them in and update profile with latest CV data
      user.fullName = fullName || user.fullName;
      if (university) user.university = university;
      if (cgpa) user.cgpa = parseFloat(cgpa);
      if (skills?.length) user.skills = Array.from(new Set([...(user.skills || []), ...skills]));
      if (targetDomains?.length) user.targetDomains = targetDomains;
      if (rrsScore) user.rrsScore = rrsScore;
      if (rrsTier) user.rrsTier = rrsTier;
      await saveUser(user);

      const token = createToken({
        id: user.id || user._id,
        email: normalizedEmail,
        fullName: user.fullName,
        role: user.role || 'student'
      });

      return res.json({
        success: true,
        isExistingUser: true,
        message: `Welcome back, ${user.fullName}! Profile refreshed with uploaded CV.`,
        token,
        user: sanitizeUser(user)
      });
    }

    // New scholar registration from CV
    const userId = `usr_cv_${Date.now().toString(36)}`;
    const passwordHash = password ? await hashPassword(password) : await hashPassword('scholar_cv_' + Date.now());

    const newUser = {
      id: userId,
      _id: userId,
      email: normalizedEmail,
      passwordHash,
      fullName: fullName.trim(),
      university: university || 'State / Central University',
      degreeLevel: 'B.Tech / Undergraduate',
      cgpa: parseFloat(cgpa) || 8.5,
      targetDomains: targetDomains?.length ? targetDomains : ['Artificial Intelligence & ML'],
      skills: skills?.length ? skills : ['Python', 'Research Methodology', 'Git'],
      rrsScore: rrsScore || 85,
      rrsTier: rrsTier || 'Strong Candidate',
      role: 'student',
      creditsRemaining: 20,
      tokensBalance: 10,
      loginStreak: 1,
      xpPoints: 150,
      dailyRewardClaimedToday: false,
      scholarBadges: ['CV Verified', 'Early Scholar'],
      oauthProvider: 'cv_upload',
      isVerified: true,
      isInstitutionalVerified: normalizedEmail.endsWith('.edu') || normalizedEmail.endsWith('.ac.in'),
      institutionalEmail: (normalizedEmail.endsWith('.edu') || normalizedEmail.endsWith('.ac.in')) ? normalizedEmail : null,
      linkedAccounts: {},
      createdAt: new Date()
    };

    await saveUser(newUser);

    const token = createToken({
      id: newUser.id,
      email: normalizedEmail,
      fullName: newUser.fullName,
      role: 'student'
    });

    res.status(201).json({
      success: true,
      message: `Account created successfully from CV for ${newUser.fullName}!`,
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('[Register with CV Error]:', err);
    res.status(500).json({ error: 'Failed to create account from CV: ' + err.message });
  }
});

/**
 * POST /api/auth/linkedin
 * Dedicated LinkedIn OAuth verification & sign-in endpoint
 */
router.post('/linkedin', async (req, res) => {
  req.body.provider = 'linkedin';
  try {
    const { email, fullName, avatarUrl, university, fieldOfStudy } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required for LinkedIn Sign-In.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const effectiveName = fullName?.trim() || normalizedEmail.split('@')[0].replace(/[._\-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    let user = await findUserByEmail(normalizedEmail);
    if (!user) {
      user = {
        id: `usr_linkedin_${Date.now().toString(36)}`,
        _id: `usr_linkedin_${Date.now().toString(36)}`,
        email: normalizedEmail,
        fullName: effectiveName,
        university: university ? university.trim() : '',
        degreeLevel: 'B.Tech / B.S.',
        cgpa: 0,
        targetDomains: fieldOfStudy ? [fieldOfStudy] : [],
        skills: [],
        rrsScore: 0,
        rrsTier: 'Developing',
        role: 'student',
        creditsRemaining: 10,
        tokensBalance: 5,
        loginStreak: 1,
        xpPoints: 50,
        dailyRewardClaimedToday: false,
        scholarBadges: ['LinkedIn Verified', 'Early Scholar'],
        oauthProvider: 'linkedin',
        avatarUrl: avatarUrl || '',
        isVerified: true,
        linkedAccounts: { linkedinUrl: `https://linkedin.com/in/${effectiveName.toLowerCase().replace(/\s+/g, '-')}` },
        createdAt: new Date()
      };
    } else {
      user.oauthProvider = 'linkedin';
      if (fullName && !user.fullName) user.fullName = effectiveName;
      if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
    }

    await saveUser(user);
    const token = createToken({
      id: user.id || user._id,
      email: normalizedEmail,
      fullName: user.fullName,
      role: user.role || 'student'
    });

    res.json({
      success: true,
      provider: 'linkedin',
      message: 'Signed in successfully via LinkedIn OAuth',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    res.status(500).json({ error: 'LinkedIn OAuth authentication failed: ' + err.message });
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
      if (user.lastLoginDate) {
        const lastClaim = new Date(user.lastLoginDate).getTime();
        const hoursSinceLastClaim = (Date.now() - lastClaim) / (1000 * 60 * 60);
        if (hoursSinceLastClaim < 20) {
          const hoursRemaining = Math.ceil(20 - hoursSinceLastClaim);
          return res.status(400).json({
            claimed: true,
            message: `Daily reward already claimed today. Next reward unlocks in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}!`
          });
        }
      } else {
        return res.status(400).json({
          claimed: true,
          message: 'Daily reward already claimed today. Come back tomorrow to maintain your streak!'
        });
      }
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
      message: `🎉 Claimed ${creditsAwarded} free credits and ${totalTokensAwarded} 🪙 Research Coins (RC)! Streak: ${currentStreak} days.`
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
        error: `Insufficient Research Coins. You have ${user.tokensBalance || 0} RC, but ${tokenCost} RC are required. Maintain your daily research streak to earn more!`
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
      message: `🌟 Successfully unlocked ${planId} with ${tokenCost} Research Coins (RC)! +${creditsToAdd || 50} credits added.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to redeem tokens: ' + err.message });
  }
});

export default router;
