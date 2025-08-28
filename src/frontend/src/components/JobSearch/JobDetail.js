import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { Button, Badge, Card } from '../design-system';

/**
 * JobDetail Component
 * 
 * A component for displaying detailed information about a job
 * 
 * @param {Object} props - Component props
 * @param {Object} props.job - Job data
 * @param {Object} props.matchInfo - Job match information (if available)
 * @param {boolean} props.loading - Whether job data is loading
 * @param {Function} props.onApply - Function called when apply button is clicked
 * @param {Function} props.onSave - Function called when save button is clicked
 * @param {boolean} props.isSaved - Whether the job is saved
 * @param {Array} props.similarJobs - List of similar jobs
 */
const JobDetail = ({
  job,
  matchInfo,
  loading = false,
  onApply,
  onSave,
  isSaved = false,
  similarJobs = []
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  
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
  
  // Format pay rate with dollar sign and commas
  const formatPayRate = (rate) => {
    if (!rate) return 'Competitive';
    return `$${rate.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };
  
  // Format weekly pay
  const formatWeeklyPay = (hourlyRate, hours = 36) => {
    if (!hourlyRate) return 'Competitive';
    const weekly = hourlyRate * hours;
    return `$${weekly.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
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
  
  // If loading, show skeleton
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-24 bg-gray-200 rounded mb-6"></div>
        
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-24 bg-gray-200 rounded mb-6"></div>
        
        <div className="h-12 bg-gray-200 rounded w-48 mb-4"></div>
      </div>
    );
  }
  
  // If no job data, show message
  if (!job) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Job Not Found</h3>
        <p className="text-yellow-600 mb-4">
          The job you're looking for may have been filled or removed.
        </p>
        <Link href="/jobs">
          <Button variant="primary">Browse Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="job-detail">
      {/* Job Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="mt-1 text-gray-600">
              {job.facilityName} • {job.city}, {job.state}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.jobType && (
                <Badge variant="primary" rounded>
                  {job.jobType}
                </Badge>
              )}
              {job.specialty && (
                <Badge variant="secondary" rounded>
                  {job.specialty}
                </Badge>
              )}
              {job.shiftType && (
                <Badge variant="info" rounded>
                  {job.shiftType}
                </Badge>
              )}
              {job.isUrgent && (
                <Badge variant="danger" rounded>
                  Urgent
                </Badge>
              )}
            </div>
          </div>
          
          {/* Match Score (if available) */}
          {matchInfo && (
            <div className="mt-4 md:mt-0 bg-blue-50 border border-blue-100 rounded-lg p-4 md:w-64">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-800">Match Score</span>
                <span className="text-lg font-bold text-blue-800">{matchInfo.matchScore}%</span>
              </div>
              {renderMatchScore(matchInfo.matchScore)}
              <button
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                onClick={() => setShowMatchDetails(!showMatchDetails)}
              >
                {showMatchDetails ? (
                  <>
                    <span>Hide Details</span>
                    <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>View Details</span>
                    <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Match Details (if available and expanded) */}
        {matchInfo && showMatchDetails && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-3">Match Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">Specialty Match</span>
                  <span className="text-xs font-medium text-gray-700">{matchInfo.specialtyScore}%</span>
                </div>
                {renderMatchScore(matchInfo.specialtyScore)}
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">Location Match</span>
                  <span className="text-xs font-medium text-gray-700">{matchInfo.locationScore}%</span>
                </div>
                {renderMatchScore(matchInfo.locationScore)}
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">Pay Match</span>
                  <span className="text-xs font-medium text-gray-700">{matchInfo.payScore}%</span>
                </div>
                {renderMatchScore(matchInfo.payScore)}
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">Experience Match</span>
                  <span className="text-xs font-medium text-gray-700">{matchInfo.experienceScore}%</span>
                </div>
                {renderMatchScore(matchInfo.experienceScore)}
              </div>
            </div>
            
            {matchInfo.matchNotes && (
              <div className="mt-3 text-xs text-gray-600">
                <p className="font-medium">Match Notes:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {matchInfo.matchNotes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Job Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pay Information */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pay</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="font-medium">{formatPayRate(job.payRate)}/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weekly Pay:</span>
                <span className="font-medium">{formatWeeklyPay(job.payRate)}</span>
              </div>
              {job.housingStipend && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Housing Stipend:</span>
                  <span className="font-medium">${job.housingStipend}/week</span>
                </div>
              )}
              {job.travelAllowance && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Travel Allowance:</span>
                  <span className="font-medium">${job.travelAllowance}</span>
                </div>
              )}
              {job.signOnBonus && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sign-on Bonus:</span>
                  <span className="font-medium">${job.signOnBonus}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
        
        {/* Schedule Information */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">{formatDate(job.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Date:</span>
                <span className="font-medium">{formatDate(job.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{job.duration || '13'} weeks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shift:</span>
                <span className="font-medium">{job.shiftType || 'Varies'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hours:</span>
                <span className="font-medium">{job.hoursPerWeek || '36'} hrs/week</span>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Requirements Information */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Specialty:</span>
                <span className="font-medium">{job.specialty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">License:</span>
                <span className="font-medium">{job.licenseRequired || `${job.state} License`}</span>
              </div>
              {job.certifications && job.certifications.length > 0 && (
                <div>
                  <span className="text-gray-600">Certifications:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {job.certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary" size="sm">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {job.experienceRequired && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-medium">{job.experienceRequired}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
      
      {/* Job Description */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
        <div className={`prose max-w-none ${!showFullDescription && 'line-clamp-6'}`}>
          <p>{job.description}</p>
        </div>
        {job.description && job.description.length > 300 && (
          <button
            className="mt-2 text-sm text-primary-600 hover:text-primary-800 flex items-center"
            onClick={() => setShowFullDescription(!showFullDescription)}
          >
            {showFullDescription ? (
              <>
                <span>Show Less</span>
                <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                <span>Show More</span>
                <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Facility Information */}
      {job.facilityDescription && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Facility</h2>
          <div className="prose max-w-none">
            <p>{job.facilityDescription}</p>
          </div>
        </div>
      )}
      
      {/* Location Information */}
      {job.locationDescription && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Location</h2>
          <div className="prose max-w-none">
            <p>{job.locationDescription}</p>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Button
          variant="primary"
          size="lg"
          onClick={onApply}
        >
          Apply Now
        </Button>
        <Button
          variant={isSaved ? "secondary" : "outline"}
          size="lg"
          onClick={onSave}
        >
          {isSaved ? 'Saved' : 'Save Job'}
        </Button>
      </div>
      
      {/* Similar Jobs */}
      {similarJobs && similarJobs.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Similar Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {similarJobs.map((similarJob) => (
              <Card key={similarJob.id} hoverable>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    <Link href={`/jobs/${similarJob.id}`} className="hover:text-primary-600">
                      {similarJob.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {similarJob.facilityName} • {similarJob.city}, {similarJob.state}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {similarJob.jobType && (
                      <Badge variant="primary" size="sm">
                        {similarJob.jobType}
                      </Badge>
                    )}
                    {similarJob.specialty && (
                      <Badge variant="secondary" size="sm">
                        {similarJob.specialty}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {formatPayRate(similarJob.payRate)}/hr
                    </span>
                    <Link href={`/jobs/${similarJob.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

JobDetail.propTypes = {
  job: PropTypes.object,
  matchInfo: PropTypes.object,
  loading: PropTypes.bool,
  onApply: PropTypes.func,
  onSave: PropTypes.func,
  isSaved: PropTypes.bool,
  similarJobs: PropTypes.array
};

export default JobDetail;