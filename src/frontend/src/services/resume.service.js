/**
 * Resume Service
 * 
 * Handles resume parsing and related operations
 */
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Parse a resume file
 * @param {File} file - Resume file (PDF, DOC, DOCX)
 * @returns {Promise<Object>} - Parsed resume data
 */
export const parseResume = async (file) => {
  try {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await axios.post(`${API_URL}/api/resumes/parse`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error(error.response?.data?.message || 'Failed to parse resume');
  }
};

/**
 * Get parsed resume data by ID
 * @param {string} resumeId - Resume ID
 * @returns {Promise<Object>} - Parsed resume data
 */
export const getResumeById = async (resumeId) => {
  try {
    const response = await axios.get(`${API_URL}/api/resumes/${resumeId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting resume:', error);
    throw new Error(error.response?.data?.message || 'Failed to get resume');
  }
};

export default {
  parseResume,
  getResumeById
};