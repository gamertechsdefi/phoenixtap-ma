import jwt from 'jsonwebtoken';

export function generateToken(userData) {
  return jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}