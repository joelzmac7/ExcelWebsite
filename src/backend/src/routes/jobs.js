/**
 * Jobs API Routes
 * Handles all job-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Logger } = require('../utils/logger');
const logger = new Logger({ service: 'JobsAPI' });
const { JobRepository } = require('../repositories/job.repository');
const jobRepository = new JobRepository(prisma, logger);

// Get all jobs with pagination and filtering
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      specialty,
      state,
      city,
      minPay,
      maxPay,
      shiftType,
      status = 'active',
      sort
    } = req.query;

    const searchParams = {
      page: parseInt(page),
      limit: parseInt(limit),
      specialty: specialty ? specialty.split(',') : undefined,
      state: state ? state.split(',') : undefined,
      city: city ? city.split(',') : undefined,
      minPay: minPay ? parseFloat(minPay) : undefined,
      maxPay: maxPay ? parseFloat(maxPay) : undefined,
      shiftType: shiftType ? shiftType.split(',') : undefined,
      status,
      sort
    };

    const { jobs, total } = await jobRepository.findByParams(searchParams);

    res.json({
      data: jobs,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get featured jobs
router.get('/featured', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const jobs = await jobRepository.findFeatured(limit);

    res.json({
      data: jobs,
      meta: {
        count: jobs.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get recent jobs
router.get('/recent', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await jobRepository.findRecent(limit);

    res.json({
      data: jobs,
      meta: {
        count: jobs.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get job by ID
router.get('/:id', async (req, res, next) => {
  try {
    const job = await jobRepository.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    // Increment view count
    await jobRepository.incrementViewCount(req.params.id);

    res.json({
      data: job
    });
  } catch (error) {
    next(error);
  }
});

// Get similar jobs
router.get('/:id/similar', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const similarJobs = await jobRepository.findSimilar(req.params.id, limit);

    res.json({
      data: similarJobs,
      meta: {
        count: similarJobs.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create a new job (protected route)
router.post('/', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    const job = await jobRepository.create(req.body);

    res.status(201).json({
      data: job
    });
  } catch (error) {
    next(error);
  }
});

// Update a job (protected route)
router.put('/:id', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    const job = await jobRepository.update(req.params.id, req.body);

    res.json({
      data: job
    });
  } catch (error) {
    next(error);
  }
});

// Delete a job (protected route)
router.delete('/:id', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    const success = await jobRepository.delete(req.params.id);

    if (!success) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;