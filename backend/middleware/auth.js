const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'Invalid or inactive user',
        code: 'INVALID_USER'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '30d' }
  );
};

module.exports = {
  authenticateToken,
  generateToken,
  generateRefreshToken
};
