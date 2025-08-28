/**
 * Custom hook for managing saved jobs
 */
import { useState, useEffect, useCallback } from 'react';
import savedJobsService from '../services/savedJobsService';

/**
 * Hook for managing saved jobs
 * @returns {Object} - Saved jobs state and methods
 */
const useSavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch saved jobs on mount
  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is authenticated
        const isAuthenticated = localStorage.getItem('token') !== null;
        
        if (isAuthenticated) {
          const jobs = await savedJobsService.getSavedJobs();
          setSavedJobs(jobs);
        } else {
          // If not authenticated, get saved jobs from local storage
          const localSavedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
          setSavedJobs(localSavedJobs);
        }
      } catch (err) {
        console.error('Error fetching saved jobs:', err);
        setError(err.message || 'Failed to fetch saved jobs');
        
        // Fallback to local storage if API fails
        const localSavedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
        setSavedJobs(localSavedJobs);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSavedJobs();
  }, []);

  /**
   * Check if a job is saved
   * @param {string} jobId - ID of the job to check
   * @returns {boolean} - Whether the job is saved
   */
  const isJobSaved = useCallback((jobId) => {
    return savedJobs.some(job => job.id === jobId || job.jobId === jobId);
  }, [savedJobs]);

  /**
   * Save a job
   * @param {string} jobId - ID of the job to save
   * @param {Object} jobData - Job data to save
   * @returns {Promise<void>}
   */
  const saveJob = useCallback(async (jobId, jobData = {}) => {
    try {
      setError(null);
      
      // Check if user is authenticated
      const isAuthenticated = localStorage.getItem('token') !== null;
      
      if (isAuthenticated) {
        // Save job to API
        await savedJobsService.saveJob(jobId);
      }
      
      // Update local state
      setSavedJobs(prev => {
        // Check if job is already saved
        if (prev.some(job => job.id === jobId || job.jobId === jobId)) {
          return prev;
        }
        
        // Add job to saved jobs
        const newSavedJobs = [...prev, { id: jobId, jobId, ...jobData }];
        
        // Update local storage
        localStorage.setItem('savedJobs', JSON.stringify(newSavedJobs));
        
        return newSavedJobs;
      });
    } catch (err) {
      console.error('Error saving job:', err);
      setError(err.message || 'Failed to save job');
      throw err;
    }
  }, []);

  /**
   * Unsave a job
   * @param {string} jobId - ID of the job to unsave
   * @returns {Promise<void>}
   */
  const unsaveJob = useCallback(async (jobId) => {
    try {
      setError(null);
      
      // Check if user is authenticated
      const isAuthenticated = localStorage.getItem('token') !== null;
      
      if (isAuthenticated) {
        // Unsave job from API
        await savedJobsService.unsaveJob(jobId);
      }
      
      // Update local state
      setSavedJobs(prev => {
        const newSavedJobs = prev.filter(job => job.id !== jobId && job.jobId !== jobId);
        
        // Update local storage
        localStorage.setItem('savedJobs', JSON.stringify(newSavedJobs));
        
        return newSavedJobs;
      });
    } catch (err) {
      console.error('Error unsaving job:', err);
      setError(err.message || 'Failed to unsave job');
      throw err;
    }
  }, []);

  /**
   * Toggle saved status of a job
   * @param {string} jobId - ID of the job to toggle
   * @param {Object} jobData - Job data to save
   * @returns {Promise<boolean>} - New saved status
   */
  const toggleSavedJob = useCallback(async (jobId, jobData = {}) => {
    try {
      const isSaved = isJobSaved(jobId);
      
      if (isSaved) {
        await unsaveJob(jobId);
        return false;
      } else {
        await saveJob(jobId, jobData);
        return true;
      }
    } catch (err) {
      console.error('Error toggling job saved status:', err);
      setError(err.message || 'Failed to update saved status');
      throw err;
    }
  }, [isJobSaved, saveJob, unsaveJob]);

  return {
    savedJobs,
    loading,
    error,
    isJobSaved,
    saveJob,
    unsaveJob,
    toggleSavedJob
  };
};

export default useSavedJobs;