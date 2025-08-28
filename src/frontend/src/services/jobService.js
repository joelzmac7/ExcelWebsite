import api from './api';

/**
 * Job Service
 * Handles all job-related API calls
 */
const jobService = {
  /**
   * Get jobs with filtering and pagination
   * 
   * @param {Object} params - Query parameters
   * @param {string} [params.keyword] - Search keyword
   * @param {string|string[]} [params.specialty] - Job specialty
   * @param {string|string[]} [params.state] - Job state
   * @param {string} [params.city] - Job city
   * @param {number} [params.minPay] - Minimum pay rate
   * @param {number} [params.maxPay] - Maximum pay rate
   * @param {string|string[]} [params.shiftType] - Shift type
   * @param {string} [params.sort] - Sort field and direction (e.g., 'payRate:desc')
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Items per page
   * @returns {Promise<Object>} - Jobs data and metadata
   */
  getJobs: async (params = {}) => {
    try {
      const response = await api.get('/api/jobs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  /**
   * Get job by ID
   * 
   * @param {string} id - Job ID
   * @returns {Promise<Object>} - Job data
   */
  getJobById: async (id) => {
    try {
      const response = await api.get(`/api/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get featured jobs
   * 
   * @param {number} [limit=6] - Number of jobs to return
   * @returns {Promise<Object>} - Featured jobs data
   */
  getFeaturedJobs: async (limit = 6) => {
    try {
      const response = await api.get('/api/jobs/featured', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching featured jobs:', error);
      throw error;
    }
  },

  /**
   * Get recent jobs
   * 
   * @param {number} [limit=10] - Number of jobs to return
   * @returns {Promise<Object>} - Recent jobs data
   */
  getRecentJobs: async (limit = 10) => {
    try {
      const response = await api.get('/api/jobs/recent', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
      throw error;
    }
  },

  /**
   * Get similar jobs
   * 
   * @param {string} id - Job ID
   * @param {number} [limit=5] - Number of jobs to return
   * @returns {Promise<Object>} - Similar jobs data
   */
  getSimilarJobs: async (id, limit = 5) => {
    try {
      const response = await api.get(`/api/jobs/${id}/similar`, { params: { limit } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching similar jobs for job ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get job specialties
   * 
   * @returns {Promise<Object>} - Job specialties data
   */
  getSpecialties: async () => {
    try {
      const response = await api.get('/api/jobs/specialties');
      return response.data;
    } catch (error) {
      console.error('Error fetching job specialties:', error);
      throw error;
    }
  },

  /**
   * Get job locations
   * 
   * @returns {Promise<Object>} - Job locations data
   */
  getLocations: async () => {
    try {
      const response = await api.get('/api/jobs/locations');
      return response.data;
    } catch (error) {
      console.error('Error fetching job locations:', error);
      throw error;
    }
  },
};

export default jobService;