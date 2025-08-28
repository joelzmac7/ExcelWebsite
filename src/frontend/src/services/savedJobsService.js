/**
 * Saved Jobs Service
 * 
 * Handles saving, unsaving, and retrieving saved jobs
 */
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Get all saved jobs for the current user
 * @returns {Promise<Array>} - List of saved jobs
 */
export const getSavedJobs = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/saved-jobs`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch saved jobs');
  }
};

/**
 * Save a job
 * @param {string} jobId - ID of the job to save
 * @returns {Promise<Object>} - Saved job data
 */
export const saveJob = async (jobId) => {
  try {
    const response = await axios.post(`${API_URL}/api/saved-jobs`, { jobId });
    return response.data;
  } catch (error) {
    console.error('Error saving job:', error);
    throw new Error(error.response?.data?.message || 'Failed to save job');
  }
};

/**
 * Unsave a job
 * @param {string} jobId - ID of the job to unsave
 * @returns {Promise<Object>} - Response data
 */
export const unsaveJob = async (jobId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/saved-jobs/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error unsaving job:', error);
    throw new Error(error.response?.data?.message || 'Failed to unsave job');
  }
};

/**
 * Check if a job is saved
 * @param {string} jobId - ID of the job to check
 * @returns {Promise<boolean>} - Whether the job is saved
 */
export const isJobSaved = async (jobId) => {
  try {
    const response = await axios.get(`${API_URL}/api/saved-jobs/${jobId}`);
    return response.data.saved;
  } catch (error) {
    // If 404, job is not saved
    if (error.response?.status === 404) {
      return false;
    }
    console.error('Error checking if job is saved:', error);
    throw new Error(error.response?.data?.message || 'Failed to check if job is saved');
  }
};

/**
 * Toggle saved status of a job
 * @param {string} jobId - ID of the job to toggle
 * @param {boolean} currentSavedStatus - Current saved status
 * @returns {Promise<Object>} - Updated saved status
 */
export const toggleSavedJob = async (jobId, currentSavedStatus) => {
  try {
    if (currentSavedStatus) {
      await unsaveJob(jobId);
      return { saved: false };
    } else {
      await saveJob(jobId);
      return { saved: true };
    }
  } catch (error) {
    console.error('Error toggling job saved status:', error);
    throw new Error(error.response?.data?.message || 'Failed to update saved status');
  }
};

export default {
  getSavedJobs,
  saveJob,
  unsaveJob,
  isJobSaved,
  toggleSavedJob
};