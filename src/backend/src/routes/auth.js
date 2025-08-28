/**
 * Authentication API Routes
 * Handles user authentication and authorization
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Logger } = require('../utils/logger');
const logger = new Logger({ service: 'AuthAPI' });
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Register a new user
router.post('/register', async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role = 'candidate', // Default role is candidate
      specialty,
      referralCode
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already in use'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate referral code
    const generatedReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Find referrer if referral code provided
    let referredById = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      });

      if (referrer) {
        referredById = referrer.id;
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone,
        role,
        specialty,
        referralCode: generatedReferralCode,
        referredById,
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
        profileCompletionPercentage: 30 // Basic profile is 30% complete
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        specialty: true,
        referralCode: true,
        createdAt: true
      }
    });

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // TODO: Store verification token in database
    // TODO: Send verification email

    // Create referral if applicable
    if (referredById) {
      await prisma.referral.create({
        data: {
          referrerId: referredById,
          referredEmail: email.toLowerCase(),
          referredName: `${firstName} ${lastName}`,
          referredPhone: phone,
          status: 'registered',
          invitationDate: new Date(),
          registrationDate: new Date(),
          referredUserId: user.id
        }
      });
    }

    // Log registration event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'user_registered',
        userId: user.id,
        pageUrl: req.headers.referer,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        deviceType: 'unknown', // Would be determined from user agent
        eventData: {
          role,
          referralCode: referralCode || null
        }
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'development_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    res.status(201).json({
      data: {
        user,
        token
      },
      message: 'Registration successful'
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account is inactive'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'development_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    // Log login event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'user_login',
        userId: user.id,
        pageUrl: req.headers.referer,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        deviceType: 'unknown', // Would be determined from user agent
      }
    });

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileCompletionPercentage: user.profileCompletionPercentage
        },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
});

// Forgot password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success even if user not found for security
    if (!user) {
      return res.json({
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // TODO: Store reset token in database
    // TODO: Send password reset email

    res.json({
      message: 'If your email is registered, you will receive a password reset link'
    });
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'Token and password are required'
      });
    }

    // TODO: Verify token from database
    // For now, we'll just return a mock response
    
    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // TODO: Update user password in database
    // TODO: Invalidate token

    res.json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    // TODO: Verify token from database
    // For now, we'll just return a mock response

    res.json({
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token is required'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_jwt_secret');

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'Invalid or expired token'
        });
      }

      // Generate new token
      const newToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'development_jwt_secret',
        { expiresIn: process.env.JWT_EXPIRATION || '24h' }
      );

      res.json({
        data: {
          token: newToken
        },
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Logout (client-side only, but we'll log the event)
router.post('/logout', async (req, res, next) => {
  try {
    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_jwt_secret');
        
        // Log logout event
        await prisma.analyticsEvent.create({
          data: {
            eventType: 'user_logout',
            userId: decoded.userId,
            pageUrl: req.headers.referer,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          }
        });
      } catch (error) {
        // Token verification failed, but we'll still return success
      }
    }

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;