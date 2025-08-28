/**
 * Applications API Routes
 * Handles all application-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Logger } = require('../utils/logger');
const logger = new Logger({ service: 'ApplicationsAPI' });

// Submit a job application (protected route)
router.post('/', async (req, res, next) => {
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
      jobId,
      resumeId,
      candidateNotes,
      source = 'direct',
      referralId
    } = req.body;

    // Validate required fields
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

    // Check if user has already applied to this job
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId: userId
        }
      }
    });

    if (existingApplication) {
      return res.status(409).json({
        error: 'You have already applied to this job',
        data: {
          id: existingApplication.id,
          status: existingApplication.status,
          applicationDate: existingApplication.applicationDate
        }
      });
    }

    // Create the application
    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId: userId,
        resumeId,
        status: 'submitted',
        candidateNotes,
        source,
        referralId,
        matchScore: null // Will be calculated by the job matching service
      },
      include: {
        job: {
          include: {
            facility: true
          }
        }
      }
    });

    // Increment the job's application count
    await prisma.job.update({
      where: { id: jobId },
      data: {
        applicationsCount: {
          increment: 1
        }
      }
    });

    // Create a notification for the candidate
    await prisma.notification.create({
      data: {
        userId,
        type: 'application_submitted',
        title: 'Application Submitted',
        message: `Your application for ${job.title} at ${job.facilityName} has been submitted successfully.`,
        isRead: false,
        actionUrl: `/applications/${application.id}`
      }
    });

    // Create a notification for the recruiter if assigned
    if (job.recruiterId) {
      await prisma.notification.create({
        data: {
          userId: job.recruiterId,
          type: 'new_application',
          title: 'New Application',
          message: `A new application has been submitted for ${job.title} at ${job.facilityName}.`,
          isRead: false,
          actionUrl: `/recruiter/applications/${application.id}`
        }
      });
    }

    // Log the application event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'application_submitted',
        userId,
        jobId,
        applicationId: application.id,
        pageUrl: req.headers.referer,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        deviceType: 'unknown', // Would be determined from user agent
        eventData: {
          source,
          referralId
        }
      }
    });

    res.status(201).json({
      data: application,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get application by ID (protected route)
router.get('/:id', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        job: {
          include: {
            facility: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }

    // Check if user is authorized to view this application
    if (application.candidateId !== userId && application.job.recruiterId !== userId) {
      return res.status(403).json({
        error: 'You are not authorized to view this application'
      });
    }

    res.json({
      data: application
    });
  } catch (error) {
    next(error);
  }
});

// Update application status (protected route - recruiter only)
router.patch('/:id/status', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    // Only recruiters and admins can update application status
    if (userRole !== 'recruiter' && userRole !== 'admin') {
      return res.status(403).json({
        error: 'You are not authorized to update application status'
      });
    }

    const { status, recruiterNotes } = req.body;

    // Validate status
    const validStatuses = ['submitted', 'reviewing', 'interview', 'offered', 'placed', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }

    // Get the application
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        job: true
      }
    });

    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }

    // Check if user is authorized to update this application
    if (application.job.recruiterId !== userId && userRole !== 'admin') {
      return res.status(403).json({
        error: 'You are not authorized to update this application'
      });
    }

    // Update the application
    const updatedApplication = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        status,
        recruiterNotes: recruiterNotes || application.recruiterNotes,
        lastStatusChange: new Date()
      },
      include: {
        job: {
          include: {
            facility: true
          }
        }
      }
    });

    // Create a notification for the candidate
    await prisma.notification.create({
      data: {
        userId: application.candidateId,
        type: 'application_status_changed',
        title: 'Application Status Updated',
        message: `Your application for ${application.job.title} at ${application.job.facilityName} has been updated to ${status}.`,
        isRead: false,
        actionUrl: `/applications/${application.id}`
      }
    });

    // Log the status change event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'application_status_changed',
        userId,
        jobId: application.jobId,
        applicationId: application.id,
        eventData: {
          oldStatus: application.status,
          newStatus: status
        }
      }
    });

    res.json({
      data: updatedApplication,
      message: 'Application status updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Withdraw application (protected route - candidate only)
router.patch('/:id/withdraw', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    // For now, we'll assume the user ID is passed in the header for testing
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const { withdrawalReason } = req.body;

    // Get the application
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        job: true
      }
    });

    if (!application) {
      return res.status(404).json({
        error: 'Application not found'
      });
    }

    // Check if user is authorized to withdraw this application
    if (application.candidateId !== userId) {
      return res.status(403).json({
        error: 'You are not authorized to withdraw this application'
      });
    }

    // Check if application can be withdrawn
    if (['placed', 'rejected', 'withdrawn'].includes(application.status)) {
      return res.status(400).json({
        error: `Application cannot be withdrawn because it is already ${application.status}`
      });
    }

    // Update the application
    const updatedApplication = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        status: 'withdrawn',
        candidateNotes: withdrawalReason ? 
          `${application.candidateNotes || ''}\n\nWithdrawal reason: ${withdrawalReason}` : 
          application.candidateNotes,
        lastStatusChange: new Date()
      },
      include: {
        job: {
          include: {
            facility: true
          }
        }
      }
    });

    // Create a notification for the recruiter if assigned
    if (application.job.recruiterId) {
      await prisma.notification.create({
        data: {
          userId: application.job.recruiterId,
          type: 'application_withdrawn',
          title: 'Application Withdrawn',
          message: `An application for ${application.job.title} at ${application.job.facilityName} has been withdrawn.`,
          isRead: false,
          actionUrl: `/recruiter/applications/${application.id}`
        }
      });
    }

    // Log the withdrawal event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'application_withdrawn',
        userId,
        jobId: application.jobId,
        applicationId: application.id,
        eventData: {
          oldStatus: application.status,
          withdrawalReason
        }
      }
    });

    res.json({
      data: updatedApplication,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;