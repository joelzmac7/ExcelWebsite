import React from 'react';
import Link from 'next/link';
import { Badge, Button, Card } from '../ui';

/**
 * JobCard component for displaying job information
 * 
 * @param {Object} props - Component props
 * @param {Object} props.job - Job data
 */
const JobCard = ({ job }) => {
  // Format pay rate with dollar sign and commas
  const formatPayRate = (rate) => {
    return `$${rate.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  // Format date to display in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'Flexible';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Determine badge variant based on shift type
  const getShiftBadgeVariant = (shiftType) => {
    switch (shiftType?.toLowerCase()) {
      case 'day':
        return 'primary';
      case 'night':
        return 'info';
      case 'evening':
        return 'warning';
      case 'rotating':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Card hover className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Job details */}
        <div className="flex-1 p-4 md:p-6">
          {/* Job header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                <Link href={`/jobs/${job.id}`} className="hover:text-primary-600">
                  {job.title}
                </Link>
              </h3>
              <p className="mt-1 text-sm text-gray-600">{job.facilityName} • {job.city}, {job.state}</p>
            </div>
            <div className="mt-2 sm:mt-0 flex flex-wrap gap-2">
              {job.isUrgent && (
                <Badge variant="urgent" size="sm" rounded="full">
                  Urgent
                </Badge>
              )}
              {job.isFeatured && (
                <Badge variant="featured" size="sm" rounded="full">
                  Featured
                </Badge>
              )}
              {job.shiftType && (
                <Badge variant={getShiftBadgeVariant(job.shiftType)} size="sm" rounded="full">
                  {job.shiftType}
                </Badge>
              )}
            </div>
          </div>

          {/* Job details */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm text-gray-700">
                <span className="font-semibold">{formatPayRate(job.payRate)}</span>/hr
                {job.housingStipend && ` + $${job.housingStipend}/week housing`}
              </span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-700">
                {formatDate(job.startDate)} - {formatDate(job.endDate)}
              </span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700">{job.shiftDetails}</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm text-gray-700">{job.specialty}</span>
            </div>
          </div>

          {/* Job description preview */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {job.description}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-row md:flex-col justify-between md:justify-center items-center border-t md:border-t-0 md:border-l border-gray-200 p-4 md:p-6 bg-gray-50 md:w-48">
          <Button
            variant="primary"
            size="md"
            fullWidth
            as={Link}
            href={`/jobs/${job.id}`}
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="md"
            fullWidth
            as={Link}
            href={`/jobs/${job.id}/apply`}
            className="mt-0 md:mt-3"
          >
            Apply Now
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default JobCard;