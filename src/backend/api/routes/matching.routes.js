/**
 * Matching Routes
 * 
 * API routes for job matching and recommendations
 */

const express = require('express');
const router = express.Router();
const { 
  getJobRecommendations, 
  getCandidateRecommendations 
} = require('../controllers/matching.controller');

/**
 * @route GET /api/matching/candidates/:candidateId/jobs
 * @desc Get job recommendations for a candidate
 * @access Private
 */
router.get('/candidates/:candidateId/jobs', getJobRecommendations);

/**
 * @route GET /api/matching/jobs/:jobId/candidates
 * @desc Get candidate recommendations for a job
 * @access Private
 */
router.get('/jobs/:jobId/candidates', getCandidateRecommendations);

module.exports = router;