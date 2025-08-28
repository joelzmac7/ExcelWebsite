/**
 * Custom hook for managing job applications
 */
import { useState, useEffect, useCallback } from 'react';
import applicationsService from '../services/applicationsService';

/**
 * Hook for managing job applications
 * @returns {Object} - Applications state and methods
 */
const useApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    interviewed: 0,
    offered: 0,
    hired: 0,
    rejected: 0,
    withdrawn: 0
  });

  // Fetch applications on mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is authenticated
        const isAuthenticated = localStorage.getItem('token') !== null;
        
        if (isAuthenticated) {
          const [applicationsData, statsData] = await Promise.all([
            applicationsService.getApplications(),
            applicationsService.getApplicationStatistics()
          ]);
          
          setApplications(applicationsData);
          setStatistics(statsData);
        } else {
          // If not authenticated, get applications from local storage
          const localApplications = JSON.parse(localStorage.getItem('applications') || '[]');
          setApplications(localApplications);
          
          // Calculate statistics from local applications
          const stats = {
            total: localApplications.length,
            pending: localApplications.filter(app => app.status === 'pending').length,
            reviewed: localApplications.filter(app => app.status === 'reviewed').length,
            interviewed: localApplications.filter(app => app.status === 'interviewed').length,
            offered: localApplications.filter(app => app.status === 'offered').length,
            hired: localApplications.filter(app => app.status === 'hired').length,
            rejected: localApplications.filter(app => app.status === 'rejected').length,
            withdrawn: localApplications.filter(app => app.status === 'withdrawn').length
          };
          
          setStatistics(stats);
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError(err.message || 'Failed to fetch applications');
        
        // Fallback to local storage if API fails
        const localApplications = JSON.parse(localStorage.getItem('applications') || '[]');
        setApplications(localApplications);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, []);

  /**
   * Get application by ID
   * @param {string} applicationId - ID of the application
   * @returns {Object|null} - Application data or null if not found
   */
  const getApplicationById = useCallback((applicationId) => {
    return applications.find(app => app.id === applicationId) || null;
  }, [applications]);

  /**
   * Submit a job application
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>} - Submitted application data
   */
  const submitApplication = useCallback(async (applicationData) => {
    try {
      setError(null);
      
      // Check if user is authenticated
      const isAuthenticated = localStorage.getItem('token') !== null;
      
      let submittedApplication;
      
      if (isAuthenticated) {
        // Submit application to API
        const response = await applicationsService.submitApplication(applicationData);
        submittedApplication = response.data;
      } else {
        // Create a local application object
        submittedApplication = {
          id: `local-${Date.now()}`,
          ...applicationData,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      // Update local state
      setApplications(prev => {
        const newApplications = [...prev, submittedApplication];
        
        // Update local storage
        localStorage.setItem('applications', JSON.stringify(newApplications));
        
        return newApplications;
      });
      
      // Update statistics
      setStatistics(prev => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1
      }));
      
      return submittedApplication;
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application');
      throw err;
    }
  }, []);

  /**
   * Update application status
   * @param {string} applicationId - ID of the application
   * @param {string} status - New status
   * @returns {Promise<Object>} - Updated application data
   */
  const updateApplicationStatus = useCallback(async (applicationId, status) => {
    try {
      setError(null);
      
      // Check if user is authenticated
      const isAuthenticated = localStorage.getItem('token') !== null;
      
      let updatedApplication;
      
      if (isAuthenticated) {
        // Update application status in API
        const response = await applicationsService.updateApplicationStatus(applicationId, status);
        updatedApplication = response.data;
      } else {
        // Update local application status
        updatedApplication = {
          ...getApplicationById(applicationId),
          status,
          updatedAt: new Date().toISOString()
        };
      }
      
      // Update local state
      setApplications(prev => {
        const newApplications = prev.map(app => 
          app.id === applicationId ? updatedApplication : app
        );
        
        // Update local storage
        localStorage.setItem('applications', JSON.stringify(newApplications));
        
        return newApplications;
      });
      
      // Update statistics
      setStatistics(prev => {
        const oldApp = getApplicationById(applicationId);
        const oldStatus = oldApp ? oldApp.status : null;
        
        if (oldStatus === status) return prev;
        
        return {
          ...prev,
          [oldStatus]: prev[oldStatus] > 0 ? prev[oldStatus] - 1 : 0,
          [status]: prev[status] + 1
        };
      });
      
      return updatedApplication;
    } catch (err) {
      console.error('Error updating application status:', err);
      setError(err.message || 'Failed to update application status');
      throw err;
    }
  }, [getApplicationById]);

  /**
   * Withdraw an application
   * @param {string} applicationId - ID of the application
   * @returns {Promise<Object>} - Withdrawn application data
   */
  const withdrawApplication = useCallback(async (applicationId) => {
    try {
      setError(null);
      
      // Check if user is authenticated
      const isAuthenticated = localStorage.getItem('token') !== null;
      
      if (isAuthenticated) {
        // Withdraw application in API
        await applicationsService.withdrawApplication(applicationId);
      }
      
      // Update local state
      return updateApplicationStatus(applicationId, 'withdrawn');
    } catch (err) {
      console.error('Error withdrawing application:', err);
      setError(err.message || 'Failed to withdraw application');
      throw err;
    }
  }, [updateApplicationStatus]);

  /**
   * Get application status history
   * @param {string} applicationId - ID of the application
   * @returns {Promise<Array>} - Status history
   */
  const getApplicationStatusHistory = useCallback(async (applicationId) => {
    try {
      setError(null);
      
      // Check if user is authenticated
      const isAuthenticated = localStorage.getItem('token') !== null;
      
      if (isAuthenticated) {
        // Get application history from API
        const response = await applicationsService.getApplicationStatusHistory(applicationId);
        return response;
      } else {
        // For local applications, create a simple history
        const app = getApplicationById(applicationId);
        
        if (!app) {
          throw new Error('Application not found');
        }
        
        return [
          {
            id: `history-${Date.now()}`,
            applicationId,
            status: app.status,
            createdAt: app.createdAt,
            notes: 'Application submitted'
          }
        ];
      }
    } catch (err) {
      console.error('Error fetching application history:', err);
      setError(err.message || 'Failed to fetch application history');
      throw err;
    }
  }, [getApplicationById]);

  return {
    applications,
    loading,
    error,
    statistics,
    getApplicationById,
    submitApplication,
    updateApplicationStatus,
    withdrawApplication,
    getApplicationStatusHistory
  };
};

export default useApplications;