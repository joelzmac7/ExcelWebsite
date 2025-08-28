/**
 * Facilities API Routes
 * Handles all facility-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Logger } = require('../utils/logger');
const logger = new Logger({ service: 'FacilitiesAPI' });
const { FacilityRepository } = require('../repositories/facility.repository');
const facilityRepository = new FacilityRepository(prisma, logger);

// Get all facilities with pagination and filtering
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      state,
      city,
      type,
      name,
      sort
    } = req.query;

    const searchParams = {
      page: parseInt(page),
      limit: parseInt(limit),
      state: state ? state.split(',') : undefined,
      city: city ? city.split(',') : undefined,
      type: type ? type.split(',') : undefined,
      name,
      sort
    };

    const { facilities, total } = await facilityRepository.findByParams(searchParams);

    res.json({
      data: facilities,
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

// Get facility by ID
router.get('/:id', async (req, res, next) => {
  try {
    const facility = await facilityRepository.findById(req.params.id);

    if (!facility) {
      return res.status(404).json({
        error: 'Facility not found'
      });
    }

    res.json({
      data: facility
    });
  } catch (error) {
    next(error);
  }
});

// Get jobs at a facility
router.get('/:id/jobs', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'active',
      sort
    } = req.query;

    const { jobs, total } = await facilityRepository.findJobs(
      req.params.id,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sort
      }
    );

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

// Create a new facility (protected route)
router.post('/', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    const facility = await facilityRepository.create(req.body);

    res.status(201).json({
      data: facility
    });
  } catch (error) {
    next(error);
  }
});

// Update a facility (protected route)
router.put('/:id', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    const facility = await facilityRepository.update(req.params.id, req.body);

    res.json({
      data: facility
    });
  } catch (error) {
    next(error);
  }
});

// Delete a facility (protected route)
router.delete('/:id', async (req, res, next) => {
  try {
    // TODO: Add authentication middleware
    const success = await facilityRepository.delete(req.params.id);

    if (!success) {
      return res.status(404).json({
        error: 'Facility not found'
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;