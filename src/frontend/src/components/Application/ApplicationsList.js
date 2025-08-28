import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button, Card, Badge } from '../ui';

/**
 * ApplicationsList Component
 * 
 * A component for displaying a list of job applications
 * 
 * @param {Object} props - Component props
 * @param {Array} props.applications - List of applications to display
 * @param {boolean} props.loading - Whether applications are loading
 * @param {string} props.error - Error message if any
 * @param {Function} props.onWithdraw - Function to call when withdrawing an application
 * @param {boolean} props.compact - Whether to display in compact mode
 */
const ApplicationsList = ({
  applications = [],
  loading = false,
  error = null,
  onWithdraw,
  compact = false
}) => {
  const [filter, setFilter] = useState('all');

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewed':
        return 'info';
      case 'interviewed':
        return 'primary';
      case 'offered':
        return 'success';
      case 'hired':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'withdrawn':
        return 'default';
      default:
        return 'default';
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'reviewed':
        return 'Application Reviewed';
      case 'interviewed':
        return 'Interview Completed';
      case 'offered':
        return 'Job Offered';
      case 'hired':
        return 'Hired';
      case 'rejected':
        return 'Not Selected';
      case 'withdrawn':
        return 'Application Withdrawn';
      default:
        return 'Unknown Status';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Handle withdraw application
  const handleWithdraw = (applicationId) => {
    if (onWithdraw && window.confirm('Are you sure you want to withdraw this application?')) {
      onWithdraw(applicationId);
    }
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['rejected', 'withdrawn', 'hired'].includes(app.status);
    if (filter === 'completed') return ['rejected', 'withdrawn', 'hired'].includes(app.status);
    return app.status === filter;
  });

  // If loading, show skeleton
  if (loading) {
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
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  // If no applications, show empty state
  if (applications.length === 0) {
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
        <p className="mt-1 text-sm text-gray-500">
          You haven't applied to any jobs yet.
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
        {filteredApplications.slice(0, 3).map((application) => (
          <Card key={application.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  <Link href={`/jobs/${application.jobId}`}>
                    <a className="hover:text-primary-600">{application.jobTitle}</a>
                  </Link>
                </h3>
                <p className="text-xs text-gray-500">{application.facilityName}</p>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(application.status)} size="sm">
                    {getStatusLabel(application.status)}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Applied {formatDate(application.createdAt)}
              </div>
            </div>
            
            <div className="mt-3 flex justify-between items-center">
              <Link href={`/applications/${application.id}`}>
                <a className="text-xs text-primary-600 hover:text-primary-800">
                  View Details
                </a>
              </Link>
              
              {['pending', 'reviewed'].includes(application.status) && (
                <button
                  onClick={() => handleWithdraw(application.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Withdraw
                </button>
              )}
            </div>
          </Card>
        ))}
        
        {applications.length > 3 && (
          <div className="text-center">
            <Link href="/applications">
              <Button variant="outline" size="sm">
                View All Applications ({applications.length})
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              filter === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setFilter('all')}
          >
            All Applications
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              filter === 'active'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              filter === 'completed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </nav>
      </div>

      {/* Applications list */}
      {filteredApplications.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-500">No applications match the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      <Link href={`/jobs/${application.jobId}`}>
                        <a className="hover:text-primary-600">{application.jobTitle}</a>
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-500">{application.facilityName}</p>
                    <p className="text-sm text-gray-500">
                      {application.city}, {application.state}
                    </p>
                  </div>
                  
                  <div className="mt-2 md:mt-0 flex flex-col items-start md:items-end">
                    <Badge variant={getStatusBadgeVariant(application.status)} size="md">
                      {getStatusLabel(application.status)}
                    </Badge>
                    <p className="mt-1 text-sm text-gray-500">
                      Applied {formatDate(application.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/applications/${application.id}`}>
                    <Button variant="primary" size="sm">
                      View Details
                    </Button>
                  </Link>
                  
                  <Link href={`/jobs/${application.jobId}`}>
                    <Button variant="outline" size="sm">
                      View Job
                    </Button>
                  </Link>
                  
                  {['pending', 'reviewed'].includes(application.status) && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleWithdraw(application.id)}
                    >
                      Withdraw Application
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

ApplicationsList.propTypes = {
  applications: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onWithdraw: PropTypes.func,
  compact: PropTypes.bool
};

export default ApplicationsList;