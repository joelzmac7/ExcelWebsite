import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, Badge } from '../design-system';
import JobCard from './JobCard';
import JobListSkeleton from './JobListSkeleton';

/**
 * JobMatchingInterface Component
 * 
 * A component that displays job recommendations based on user profile and preferences
 * 
 * @param {Object} props - Component props
 * @param {Object} props.candidateProfile - User's candidate profile
 * @param {Array} props.matchedJobs - List of matched jobs
 * @param {boolean} props.loading - Whether jobs are loading
 * @param {string} props.error - Error message if any
 * @param {Function} props.onRefresh - Function to refresh job matches
 * @param {Function} props.onUpdatePreferences - Function to update matching preferences
 */
const JobMatchingInterface = ({
  candidateProfile,
  matchedJobs = [],
  loading = false,
  error = null,
  onRefresh,
  onUpdatePreferences
}) => {
  const [activeTab, setActiveTab] = useState('bestMatches');
  const [showMatchDetails, setShowMatchDetails] = useState({});
  
  // Filter jobs based on active tab
  const filteredJobs = matchedJobs.filter(job => {
    if (activeTab === 'bestMatches') {
      return job.matchScore >= 80;
    } else if (activeTab === 'location') {
      return job.locationScore >= 90;
    } else if (activeTab === 'pay') {
      return job.payScore >= 90;
    } else if (activeTab === 'specialty') {
      return job.specialtyScore >= 90;
    } else {
      return true;
    }
  });

  // Toggle match details for a job
  const toggleMatchDetails = (jobId) => {
    setShowMatchDetails(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  // Render match score indicator
  const renderMatchScore = (score) => {
    let colorClass = 'bg-gray-200';
    
    if (score >= 90) {
      colorClass = 'bg-green-500';
    } else if (score >= 80) {
      colorClass = 'bg-green-400';
    } else if (score >= 70) {
      colorClass = 'bg-yellow-400';
    } else if (score >= 60) {
      colorClass = 'bg-yellow-500';
    } else {
      colorClass = 'bg-gray-400';
    }
    
    return (
      <div className="flex items-center">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${colorClass}`} 
            style={{ width: `${score}%` }}
          ></div>
        </div>
        <span className="ml-2 text-sm font-medium">{score}%</span>
      </div>
    );
  };

  // Render match details
  const renderMatchDetails = (job) => {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Match Details</h4>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Overall Match</span>
              <span className="text-xs font-medium text-gray-700">{job.matchScore}%</span>
            </div>
            {renderMatchScore(job.matchScore)}
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Specialty Match</span>
              <span className="text-xs font-medium text-gray-700">{job.specialtyScore}%</span>
            </div>
            {renderMatchScore(job.specialtyScore)}
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Location Match</span>
              <span className="text-xs font-medium text-gray-700">{job.locationScore}%</span>
            </div>
            {renderMatchScore(job.locationScore)}
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Pay Match</span>
              <span className="text-xs font-medium text-gray-700">{job.payScore}%</span>
            </div>
            {renderMatchScore(job.payScore)}
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Experience Match</span>
              <span className="text-xs font-medium text-gray-700">{job.experienceScore}%</span>
            </div>
            {renderMatchScore(job.experienceScore)}
          </div>
        </div>
        
        {job.matchNotes && (
          <div className="mt-3 text-xs text-gray-600">
            <p className="font-medium">Match Notes:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {job.matchNotes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // If loading, show skeleton
  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Your Job Matches</h2>
          <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
        </div>
        <JobListSkeleton count={5} />
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-red-800 mb-2">Unable to load job matches</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={onRefresh}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // If no matched jobs, show empty state
  if (matchedJobs.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-blue-800 mb-2">No job matches found</h3>
        <p className="text-blue-600 mb-4">
          We couldn't find any jobs matching your profile. Try updating your preferences or check back later.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button
            variant="outline"
            onClick={onUpdatePreferences}
          >
            Update Preferences
          </Button>
          <Button
            variant="primary"
            onClick={onRefresh}
          >
            Refresh Matches
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your Job Matches</h2>
          <p className="text-sm text-gray-600 mt-1">
            Based on your profile and preferences
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUpdatePreferences}
          >
            Update Preferences
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bestMatches'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('bestMatches')}
          >
            Best Matches
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'location'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('location')}
          >
            Location
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pay'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('pay')}
          >
            Pay
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'specialty'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('specialty')}
          >
            Specialty
          </button>
        </nav>
      </div>

      {/* Job List */}
      <div className="space-y-6">
        {filteredJobs.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">
              No jobs found in this category. Try another filter.
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="relative">
              <div className="absolute top-4 right-4 z-10">
                <Badge variant="primary" rounded>
                  {job.matchScore}% Match
                </Badge>
              </div>
              <JobCard job={job} />
              <div className="mt-2 flex justify-end">
                <button
                  className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
                  onClick={() => toggleMatchDetails(job.id)}
                >
                  {showMatchDetails[job.id] ? (
                    <>
                      <span>Hide Match Details</span>
                      <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Show Match Details</span>
                      <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              {showMatchDetails[job.id] && renderMatchDetails(job)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

JobMatchingInterface.propTypes = {
  candidateProfile: PropTypes.object,
  matchedJobs: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
  onUpdatePreferences: PropTypes.func
};

export default JobMatchingInterface;