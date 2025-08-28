/**
 * Applications Service
 * 
 * Handles job applications and application status tracking
 */
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Get all applications for the current user
 * @returns {Promise<Array>} - List of applications
 */
export const getApplications = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/applications`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch applications');
  }
};

/**
 * Get application details by ID
 * @param {string} applicationId - ID of the application
 * @returns {Promise<Object>} - Application details
 */
export const getApplicationById = async (applicationId) => {
  try {
    const response = await axios.get(`${API_URL}/api/applications/${applicationId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching application details:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch application details');
  }
};

/**
 * Submit a job application
 * @param {Object} applicationData - Application data
 * @returns {Promise<Object>} - Submitted application data
 */
export const submitApplication = async (applicationData) => {
  try {
    const formData = new FormData();
    
    // Add basic form fields
    Object.keys(applicationData).forEach(key => {
      if (key !== 'resume' && key !== 'licenses' && key !== 'certifications') {
        formData.append(key, applicationData[key]);
      }
    });
    
    // Add resume file if provided
    if (applicationData.resume) {
      formData.append('resume', applicationData.resume);
    }
    
    // Add licenses and certifications as JSON strings
    if (applicationData.licenses) {
      formData.append('licenses', JSON.stringify(applicationData.licenses));
    }
    
    if (applicationData.certifications) {
      formData.append('certifications', JSON.stringify(applicationData.certifications));
    }
    
    const response = await axios.post(`${API_URL}/api/applications`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error submitting application:', error);
    throw new Error(error.response?.data?.message || 'Failed to submit application');
  }
};

/**
 * Update application status
 * @param {string} applicationId - ID of the application
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated application data
 */
export const updateApplicationStatus = async (applicationId, status) => {
  try {
    const response = await axios.patch(`${API_URL}/api/applications/${applicationId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw new Error(error.response?.data?.message || 'Failed to update application status');
  }
};

/**
 * Withdraw an application
 * @param {string} applicationId - ID of the application
 * @returns {Promise<Object>} - Response data
 */
export const withdrawApplication = async (applicationId) => {
  try {
    const response = await axios.patch(`${API_URL}/api/applications/${applicationId}/withdraw`);
    return response.data;
  } catch (error) {
    console.error('Error withdrawing application:', error);
    throw new Error(error.response?.data?.message || 'Failed to withdraw application');
  }
};

/**
 * Get application status history
 * @param {string} applicationId - ID of the application
 * @returns {Promise<Array>} - Status history
 */
export const getApplicationStatusHistory = async (applicationId) => {
  try {
    const response = await axios.get(`${API_URL}/api/applications/${applicationId}/history`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching application history:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch application history');
  }
};

/**
 * Get application statistics
 * @returns {Promise<Object>} - Application statistics
 */
export const getApplicationStatistics = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/applications/statistics`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching application statistics:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch application statistics');
  }
};

export default {
  getApplications,
  getApplicationById,
  submitApplication,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationStatusHistory,
  getApplicationStatistics
};