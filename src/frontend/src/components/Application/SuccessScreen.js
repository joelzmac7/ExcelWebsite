import React from 'react';
import { Button } from '../ui';
import Link from 'next/link';

/**
 * SuccessScreen Component
 * 
 * A component displayed after successful form submission
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Success message title
 * @param {string} props.message - Success message content
 * @param {Object} props.job - Job data (if applicable)
 * @param {Object} props.application - Application data
 * @param {Array} props.nextSteps - List of next steps
 * @param {Array} props.relatedJobs - List of related job recommendations
 * @param {Function} props.onViewApplication - Function to view application details
 * @param {Function} props.onBrowseJobs - Function to browse more jobs
 */
const SuccessScreen = ({
  title = 'Application Submitted Successfully!',
  message = 'Thank you for your application. Our team will review it and get back to you soon.',
  job,
  application,
  nextSteps = [],
  relatedJobs = [],
  onViewApplication,
  onBrowseJobs
}) => {
  // Default next steps if none provided
  const displayNextSteps = nextSteps.length > 0 ? nextSteps : [
    'Our team will review your application',
    'You will receive a confirmation email shortly',
    'A recruiter will contact you within 2 business days'
  ];

  return (
    <div className="success-screen text-center">
      {/* Success Icon */}
      <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
        <svg
          className="h-16 w-16 text-green-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-lg text-gray-600 mb-8">{message}</p>

      {/* Application Reference */}
      {application && (
        <div className="bg-gray-50 rounded-lg p-4 mb-8 inline-block">
          <p className="text-sm text-gray-500">Application Reference</p>
          <p className="text-lg font-semibold text-gray-900">
            {application.id || 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase()}
          </p>
        </div>
      )}

      {/* Job Details */}
      {job && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Job Details</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-left">
            <h4 className="text-lg font-medium text-gray-900">{job.title}</h4>
            <p className="text-gray-600">{job.facility || job.location}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.specialty && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {job.specialty}
                </span>
              )}
              {job.jobType && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {job.jobType}
                </span>
              )}
              {job.shift && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {job.shift}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Next Steps</h3>
        <div className="space-y-4">
          {displayNextSteps.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                  {index + 1}
                </div>
              </div>
              <div className="ml-4 text-left">
                <p className="text-gray-700">{step}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Jobs */}
      {relatedJobs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Similar Jobs You Might Like</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedJobs.slice(0, 4).map((relatedJob) => (
              <div
                key={relatedJob.id}
                className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
              >
                <h4 className="text-lg font-medium text-gray-900 truncate">
                  {relatedJob.title}
                </h4>
                <p className="text-gray-600 truncate">{relatedJob.facility || relatedJob.location}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {relatedJob.specialty && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {relatedJob.specialty}
                    </span>
                  )}
                  {relatedJob.jobType && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {relatedJob.jobType}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <Link href={`/jobs/${relatedJob.id}`}>
                    <a className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </a>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
        {onViewApplication && (
          <Button
            type="button"
            variant="secondary"
            onClick={onViewApplication}
          >
            View Application
          </Button>
        )}
        {onBrowseJobs && (
          <Button
            type="button"
            variant="primary"
            onClick={onBrowseJobs}
          >
            Browse More Jobs
          </Button>
        )}
      </div>
    </div>
  );
};

export default SuccessScreen;