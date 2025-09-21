const express = require('express');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();


router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken',
        code: 'USER_EXISTS'
      });
    }

    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // auto login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        credits: user.credits,
        plan: user.plan,
        preferences: user.preferences
      },
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        credits: user.credits,
        plan: user.plan,
        preferences: user.preferences,
        lastLogin: user.lastLogin
      },
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'fallback-secret');
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Invalid user',
        code: 'INVALID_USER'
      });
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      message: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        credits: user.credits,
        plan: user.plan,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(401).json({
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
});

module.exports = router;
