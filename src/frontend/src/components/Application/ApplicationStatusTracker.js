import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button, Badge } from '../ui';

/**
 * ApplicationStatusTracker Component
 * 
 * A component for tracking job application status
 * 
 * @param {Object} props - Component props
 * @param {Object} props.application - Application data
 * @param {Array} props.statusHistory - Application status history
 * @param {Function} props.onWithdraw - Function to call when withdrawing an application
 * @param {boolean} props.compact - Whether to display in compact mode
 */
const ApplicationStatusTracker = ({
  application,
  statusHistory = [],
  onWithdraw,
  compact = false
}) => {
  if (!application) {
    return null;
  }

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
  const handleWithdraw = () => {
    if (onWithdraw && window.confirm('Are you sure you want to withdraw this application?')) {
      onWithdraw(application.id);
    }
  };

  // Determine if application can be withdrawn
  const canWithdraw = ['pending', 'reviewed'].includes(application.status);

  // Compact view for dashboard
  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
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
          
          {canWithdraw && (
            <button
              onClick={handleWithdraw}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Withdraw
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Application header */}
      <div className="bg-gray-50 px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex items-center justify-between flex-wrap sm:flex-nowrap">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Application Status
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Applied {formatDate(application.createdAt)}
            </p>
          </div>
          <div>
            <Badge variant={getStatusBadgeVariant(application.status)} size="lg">
              {getStatusLabel(application.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Status timeline */}
      <div className="px-4 py-5 sm:px-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {statusHistory.map((status, index) => (
              <li key={status.id || index}>
                <div className="relative pb-8">
                  {index < statusHistory.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    ></span>
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          getStatusBadgeVariant(status.status) === 'success'
                            ? 'bg-green-500'
                            : getStatusBadgeVariant(status.status) === 'danger'
                            ? 'bg-red-500'
                            : getStatusBadgeVariant(status.status) === 'warning'
                            ? 'bg-yellow-500'
                            : getStatusBadgeVariant(status.status) === 'info'
                            ? 'bg-blue-500'
                            : getStatusBadgeVariant(status.status) === 'primary'
                            ? 'bg-primary-500'
                            : 'bg-gray-500'
                        }`}
                      >
                        <svg
                          className="h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          {getStatusLabel(status.status)}
                        </p>
                        {status.notes && (
                          <p className="text-sm text-gray-500">{status.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {formatDate(status.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between">
          <Link href={`/jobs/${application.jobId}`}>
            <Button variant="outline" size="sm">
              View Job
            </Button>
          </Link>
          
          {canWithdraw && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleWithdraw}
            >
              Withdraw Application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

ApplicationStatusTracker.propTypes = {
  application: PropTypes.object.isRequired,
  statusHistory: PropTypes.array,
  onWithdraw: PropTypes.func,
  compact: PropTypes.bool
};

export default ApplicationStatusTracker;