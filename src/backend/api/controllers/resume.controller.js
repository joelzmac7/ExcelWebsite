/**
 * Resume Controller
 * 
 * Handles resume parsing and related operations
 */

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { parseResume } = require('../../../ai/resume-parser');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../../uploads/resumes'));
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only PDF, DOC, DOCX files
  const allowedFileTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Upload and parse a resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function uploadAndParseResume(req, res) {
  try {
    // Handle file upload using multer
    upload.single('resume')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      try {
        // Parse the resume
        const filePath = req.file.path;
        const parsedData = await parseResume(filePath);
        
        // Store the parsed data in MongoDB
        // This would be implemented with a MongoDB service
        
        // Return the parsed data
        res.status(200).json({
          success: true,
          data: parsedData,
          message: 'Resume parsed successfully'
        });
      } catch (error) {
        console.error('Error parsing resume:', error);
        
        // Clean up the uploaded file if parsing fails
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
        
        res.status(500).json({
          success: false,
          message: 'Failed to parse resume'
        });
      }
    });
  } catch (error) {
    console.error('Error in uploadAndParseResume:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

module.exports = {
  uploadAndParseResume
};