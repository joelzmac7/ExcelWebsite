/**
 * Resume Service
 * 
 * Handles resume parsing and related operations
 */
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Parse a resume file
 * @param {File} file - The resume file to parse
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
 * Map parsed resume data to application form fields
 * @param {Object} resumeData - Parsed resume data
 * @returns {Object} - Mapped form data
 */
export const mapResumeDataToFormFields = (resumeData) => {
  if (!resumeData) return {};
  
  return {
    firstName: resumeData.firstName || '',
    lastName: resumeData.lastName || '',
    email: resumeData.email || '',
    phone: resumeData.phone || '',
    specialty: resumeData.specialty || '',
    yearsExperience: resumeData.yearsExperience || '',
    licenses: resumeData.licenses || [],
    certifications: resumeData.certifications || [],
    // Don't map fields that require explicit user input
    coverLetter: '',
    availability: '',
    referralSource: '',
    agreeToTerms: false
  };
};

/**
 * Get job recommendations based on a resume
 * @param {File} file - The resume file
 * @returns {Promise<Object>} - Job recommendations
 */
export const getJobRecommendationsFromResume = async (file) => {
  try {
    // First parse the resume
    const parseResult = await parseResume(file);
    
    if (!parseResult.success) {
      throw new Error(parseResult.message || 'Failed to parse resume');
    }
    
    // Use the parsed data to get job recommendations
    const candidateData = parseResult.data;
    
    const response = await axios.post(`${API_URL}/api/matching/recommendations`, {
      candidate: candidateData
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting job recommendations:', error);
    throw new Error(error.response?.data?.message || 'Failed to get job recommendations');
  }
};

/**
 * Get recommended jobs based on resume data
 * @param {Object} resumeData - Parsed resume data
 * @returns {Promise<Array>} - Recommended jobs
 */
export const getRecommendedJobsFromResumeData = async (resumeData) => {
  try {
    const response = await axios.post(`${API_URL}/api/matching/jobs/recommend-from-resume`, resumeData);
    return response.data.data;
  } catch (error) {
    console.error('Error getting job recommendations:', error);
    throw new Error(error.response?.data?.message || 'Failed to get job recommendations');
  }
};

export default {
  parseResume,
  mapResumeDataToFormFields,
  getJobRecommendationsFromResume,
  getRecommendedJobsFromResumeData
};