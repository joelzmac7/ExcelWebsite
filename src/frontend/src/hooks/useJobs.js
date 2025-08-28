import { useState, useEffect, useCallback } from 'react';
import jobService from '../services/jobService';

/**
 * Custom hook for job-related data fetching
 */
const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * Fetch jobs with filtering and pagination
   * 
   * @param {Object} params - Query parameters
   */
  const fetchJobs = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await jobService.getJobs(params);
      setJobs(response.data);
      setTotalJobs(response.meta.total);
      setTotalPages(response.meta.total_pages);
    } catch (error) {
      console.error('Error in fetchJobs:', error);
      setError('Failed to load jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch a single job by ID
   * 
   * @param {string} id - Job ID
   * @returns {Promise<Object>} - Job data
   */
  const fetchJobById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await jobService.getJobById(id);
      return response.data;
    } catch (error) {
      console.error(`Error in fetchJobById for ID ${id}:`, error);
      setError('Failed to load job details. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch featured jobs
   * 
   * @param {number} [limit=6] - Number of jobs to return
   */
  const fetchFeaturedJobs = useCallback(async (limit = 6) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await jobService.getFeaturedJobs(limit);
      setFeaturedJobs(response.data);
    } catch (error) {
      console.error('Error in fetchFeaturedJobs:', error);
      setError('Failed to load featured jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch recent jobs
   * 
   * @param {number} [limit=10] - Number of jobs to return
   */
  const fetchRecentJobs = useCallback(async (limit = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await jobService.getRecentJobs(limit);
      setRecentJobs(response.data);
    } catch (error) {
      console.error('Error in fetchRecentJobs:', error);
      setError('Failed to load recent jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch similar jobs
   * 
   * @param {string} id - Job ID
   * @param {number} [limit=5] - Number of jobs to return
   * @returns {Promise<Array>} - Similar jobs data
   */
  const fetchSimilarJobs = useCallback(async (id, limit = 5) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await jobService.getSimilarJobs(id, limit);
      return response.data;
    } catch (error) {
      console.error(`Error in fetchSimilarJobs for job ID ${id}:`, error);
      setError('Failed to load similar jobs. Please try again later.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch job specialties
   */
  const fetchSpecialties = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await jobService.getSpecialties();
      setSpecialties(response.data);
    } catch (error) {
      console.error('Error in fetchSpecialties:', error);
      setError('Failed to load job specialties. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch job locations
   */
  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await jobService.getLocations();
      setLocations(response.data);
    } catch (error) {
      console.error('Error in fetchLocations:', error);
      setError('Failed to load job locations. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load specialties and locations on initial mount
  useEffect(() => {
    fetchSpecialties();
    fetchLocations();
  }, [fetchSpecialties, fetchLocations]);

  return {
    jobs,
    featuredJobs,
    recentJobs,
    specialties,
    locations,
    loading,
    error,
    totalJobs,
    totalPages,
    fetchJobs,
    fetchJobById,
    fetchFeaturedJobs,
    fetchRecentJobs,
    fetchSimilarJobs,
    fetchSpecialties,
    fetchLocations,
  };
};

export default useJobs;