import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_repair_token_123';

/**
 * Middleware: verifies the Bearer JWT and attaches `req.user` (payload).
 * Returns 401 if the token is missing or invalid.
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;  // { id }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};
