/**
 * Users API Routes
 * Handles all user-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Logger } = require('../utils/logger');
const logger = new Logger({ service: 'UsersAPI' });
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Get current user (protected route)
router.get('/me', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        specialty: true,
        yearsExperience: true,
        preferredStates: true,
        preferredCities: true,
        preferredPayRangeMin: true,
        preferredPayRangeMax: true,
        preferredShiftType: true,
        licenseStates: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        profileCompletionPercentage: true,
        avatarUrl: true,
        referralCode: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Update current user (protected route)
router.put('/me', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    // Don't allow updating sensitive fields
    const {
      passwordHash,
      role,
      isActive,
      emailVerified,
      phoneVerified,
      ...updateData
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        specialty: true,
        yearsExperience: true,
        preferredStates: true,
        preferredCities: true,
        preferredPayRangeMin: true,
        preferredPayRangeMax: true,
        preferredShiftType: true,
        licenseStates: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        profileCompletionPercentage: true,
        avatarUrl: true,
        referralCode: true
      }
    });

    res.json({
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Get user's saved jobs (protected route)
router.get('/me/saved-jobs', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const savedJobs = await prisma.savedJob.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            facility: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      data: savedJobs.map(savedJob => ({
        id: savedJob.id,
        job: savedJob.job,
        notes: savedJob.notes,
        savedAt: savedJob.createdAt
      })),
      meta: {
        count: savedJobs.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Save a job (protected route)
router.post('/me/saved-jobs', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const { jobId, notes } = req.body;

    if (!jobId) {
      return res.status(400).json({
        error: 'Job ID is required'
      });
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    // Check if already saved
    const existingSavedJob = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      }
    });

    if (existingSavedJob) {
      return res.status(409).json({
        error: 'Job already saved',
        data: {
          id: existingSavedJob.id,
          savedAt: existingSavedJob.createdAt
        }
      });
    }

    // Save the job
    const savedJob = await prisma.savedJob.create({
      data: {
        userId,
        jobId,
        notes
      },
      include: {
        job: {
          include: {
            facility: true
          }
        }
      }
    });

    res.status(201).json({
      data: {
        id: savedJob.id,
        job: savedJob.job,
        notes: savedJob.notes,
        savedAt: savedJob.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Remove a saved job (protected route)
router.delete('/me/saved-jobs/:jobId', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const { jobId } = req.params;

    // Check if saved job exists
    const savedJob = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      }
    });

    if (!savedJob) {
      return res.status(404).json({
        error: 'Saved job not found'
      });
    }

    // Delete the saved job
    await prisma.savedJob.delete({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get user's applications (protected route)
router.get('/me/applications', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const applications = await prisma.application.findMany({
      where: { candidateId: userId },
      include: {
        job: {
          include: {
            facility: true
          }
        }
      },
      orderBy: {
        applicationDate: 'desc'
      }
    });

    res.json({
      data: applications,
      meta: {
        count: applications.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's licenses (protected route)
router.get('/me/licenses', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const licenses = await prisma.license.findMany({
      where: { userId },
      orderBy: {
        expirationDate: 'asc'
      }
    });

    res.json({
      data: licenses,
      meta: {
        count: licenses.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Add a license (protected route)
router.post('/me/licenses', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const {
      licenseType,
      licenseNumber,
      state,
      issueDate,
      expirationDate,
      documentUrl
    } = req.body;

    // Validate required fields
    if (!licenseType || !licenseNumber || !state || !issueDate || !expirationDate) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Create the license
    const license = await prisma.license.create({
      data: {
        userId,
        licenseType,
        licenseNumber,
        state,
        issueDate: new Date(issueDate),
        expirationDate: new Date(expirationDate),
        status: 'pending',
        documentUrl
      }
    });

    res.status(201).json({
      data: license
    });
  } catch (error) {
    next(error);
  }
});

// Get user's certifications (protected route)
router.get('/me/certifications', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const certifications = await prisma.certification.findMany({
      where: { userId },
      orderBy: {
        expirationDate: 'asc'
      }
    });

    res.json({
      data: certifications,
      meta: {
        count: certifications.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Add a certification (protected route)
router.post('/me/certifications', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const {
      certificationName,
      issuingOrganization,
      issueDate,
      expirationDate,
      credentialId,
      documentUrl
    } = req.body;

    // Validate required fields
    if (!certificationName || !issuingOrganization || !issueDate) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Create the certification
    const certification = await prisma.certification.create({
      data: {
        userId,
        certificationName,
        issuingOrganization,
        issueDate: new Date(issueDate),
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        credentialId,
        documentUrl,
        status: 'pending'
      }
    });

    res.status(201).json({
      data: certification
    });
  } catch (error) {
    next(error);
  }
});

// Get user's work experience (protected route)
router.get('/me/work-experience', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const workExperiences = await prisma.workExperience.findMany({
      where: { userId },
      orderBy: [
        { isCurrent: 'desc' },
        { endDate: 'desc' }
      ]
    });

    res.json({
      data: workExperiences,
      meta: {
        count: workExperiences.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Add work experience (protected route)
router.post('/me/work-experience', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const {
      employer,
      position,
      startDate,
      endDate,
      isCurrent,
      city,
      state,
      responsibilities,
      specialty,
      facilityType
    } = req.body;

    // Validate required fields
    if (!employer || !position || !startDate) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Create the work experience
    const workExperience = await prisma.workExperience.create({
      data: {
        userId,
        employer,
        position,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent || false,
        city,
        state,
        responsibilities,
        specialty,
        facilityType
      }
    });

    res.status(201).json({
      data: workExperience
    });
  } catch (error) {
    next(error);
  }
});

// Get user's job alerts (protected route)
router.get('/me/job-alerts', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const jobAlerts = await prisma.jobAlert.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      data: jobAlerts,
      meta: {
        count: jobAlerts.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create a job alert (protected route)
router.post('/me/job-alerts', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const {
      name,
      specialties,
      states,
      cities,
      minPayRate,
      shiftTypes,
      frequency
    } = req.body;

    // Validate required fields
    if (!name || !frequency || (!specialties && !states && !cities)) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Create the job alert
    const jobAlert = await prisma.jobAlert.create({
      data: {
        userId,
        name,
        specialties: specialties || [],
        states: states || [],
        cities: cities || [],
        minPayRate,
        shiftTypes: shiftTypes || [],
        frequency,
        isActive: true
      }
    });

    res.status(201).json({
      data: jobAlert
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;