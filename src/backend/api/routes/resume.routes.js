/**
 * Resume Routes
 * 
 * API routes for resume parsing and related operations
 */

const express = require('express');
const router = express.Router();
const { uploadAndParseResume } = require('../controllers/resume.controller');

/**
 * @route POST /api/resumes/parse
 * @desc Upload and parse a resume
 * @access Public
 */
router.post('/parse', uploadAndParseResume);

module.exports = router;