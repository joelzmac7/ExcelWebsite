import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { Button, Card, Badge } from '../ui';
import JobCard from './JobCard';
import useSavedJobs from '../../hooks/useSavedJobs';

/**
 * SavedJobsList Component
 * 
 * A component for displaying a list of saved jobs
 * 
 * @param {Object} props - Component props
 * @param {Array} props.jobs - List of jobs to display (optional, will use hook if not provided)
 * @param {boolean} props.loading - Whether jobs are loading (optional, will use hook if not provided)
 * @param {string} props.error - Error message if any (optional, will use hook if not provided)
 * @param {Function} props.onUnsaveJob - Function to call when a job is unsaved
 * @param {boolean} props.compact - Whether to display in compact mode
 */
const SavedJobsList = ({
  jobs,
  loading,
  error,
  onUnsaveJob,
  compact = false
}) => {
  // Use the saved jobs hook if jobs are not provided
  const {
    savedJobs: hookSavedJobs,
    loading: hookLoading,
    error: hookError,
    unsaveJob
  } = useSavedJobs();

  // Use provided props or hook values
  const savedJobs = jobs || hookSavedJobs;
  const isLoading = loading !== undefined ? loading : hookLoading;
  const errorMessage = error || hookError;

  // Handle unsave job
  const handleUnsaveJob = async (jobId) => {
    try {
      await (onUnsaveJob ? onUnsaveJob(jobId) : unsaveJob(jobId));
    } catch (err) {
      console.error('Error unsaving job:', err);
    }
  };

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(compact ? 3 : 5)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  // If error, show error message
  if (errorMessage) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-700">{errorMessage}</p>
      </div>
    );
  }

  // If no saved jobs, show empty state
  if (savedJobs.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No saved jobs</h3>
        <p className="mt-1 text-sm text-gray-500">
          Jobs you save will appear here for easy access.
        </p>
        <div className="mt-6">
          <Link href="/jobs/search">
            <Button variant="primary">Browse Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Compact view for dashboard
  if (compact) {
    return (
      <div className="space-y-4">
        {savedJobs.slice(0, 3).map((job) => (
          <Card key={job.id || job.jobId} className="p-4">
            <div className="flex justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  <Link href={`/jobs/${job.id || job.jobId}`} className="hover:text-primary-600">
                    {job.title}
                  </Link>
                </h3>
                <p className="text-xs text-gray-500">{job.facilityName} • {job.city}, {job.state}</p>
                <div className="mt-1">
                  {job.payRate && (
                    <Badge variant="success" size="sm">
                      ${job.payRate}/hr
                    </Badge>
                  )}
                  {job.specialty && (
                    <Badge variant="primary" size="sm" className="ml-2">
                      {job.specialty}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <button
                  onClick={() => handleUnsaveJob(job.id || job.jobId)}
                  className="text-gray-400 hover:text-red-500"
                  aria-label="Unsave job"
                >
                  <svg
                    className="h-5 w-5 text-red-500 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </Card>
        ))}
        
        {savedJobs.length > 3 && (
          <div className="text-center">
            <Link href="/saved-jobs">
              <Button variant="outline" size="sm">
                View All Saved Jobs ({savedJobs.length})
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-4">
      {savedJobs.map((job) => (
        <div key={job.id || job.jobId} className="relative">
          <JobCard job={job} />
          <button
            onClick={() => handleUnsaveJob(job.id || job.jobId)}
            className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-sm border border-gray-200 text-gray-400 hover:text-red-500"
            aria-label="Unsave job"
          >
            <svg
              className="h-5 w-5 text-red-500 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

SavedJobsList.propTypes = {
  jobs: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onUnsaveJob: PropTypes.func,
  compact: PropTypes.bool
};

export default SavedJobsList;