import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import crypto from 'crypto';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'anusandhan-dev-jwt-secret-2026';
  }
}

export function authenticateToken(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Authentication service configuration error.' });
    }
    return res.status(500).json({ error: 'JWT_SECRET is not configured on the server.' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token.' });
    }
    req.user = user;
    next();
  });
}

/**
 * Role-Based Access Control (RBAC) middleware.
 * Verifies that the authenticated user possesses an authorized role.
 */
export function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const role = req.user.role || 'student';
    if (!allowedRoles.includes(role) && !allowedRoles.includes('*')) {
      return res.status(403).json({ error: `Forbidden: role '${role}' lacks required permission.` });
    }
    next();
  };
}
