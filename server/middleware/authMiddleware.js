import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
}

export function authenticateToken(req, res, next) {
  const secret = process.env.JWT_SECRET || JWT_SECRET;
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
