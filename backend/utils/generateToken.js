import jwt from 'jsonwebtoken';

/**
 * Signs a JWT for the given user id.
 * Expiry is configurable via JWT_EXPIRE (defaults to 7 days).
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export default generateToken;
