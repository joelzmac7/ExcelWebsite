/**
 * Jobs API Routes
 */

const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller');

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with filtering and pagination
 * @access  Public
 */
router.get('/', jobsController.getJobs);

/**
 * @route   GET /api/jobs/featured
 * @desc    Get featured jobs
 * @access  Public
 */
router.get('/featured', jobsController.getFeaturedJobs);

/**
 * @route   GET /api/jobs/recent
 * @desc    Get recent jobs
 * @access  Public
 */
router.get('/recent', jobsController.getRecentJobs);

/**
 * @route   GET /api/jobs/specialties
 * @desc    Get job specialties
 * @access  Public
 */
router.get('/specialties', jobsController.getSpecialties);

/**
 * @route   GET /api/jobs/locations
 * @desc    Get job locations
 * @access  Public
 */
router.get('/locations', jobsController.getLocations);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get job by ID
 * @access  Public
 */
router.get('/:id', jobsController.getJobById);

/**
 * @route   GET /api/jobs/:id/similar
 * @desc    Get similar jobs
 * @access  Public
 */
router.get('/:id/similar', jobsController.getSimilarJobs);

module.exports = router;