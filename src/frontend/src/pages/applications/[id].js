import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import ApplicationStatusTracker from '../../components/Application/ApplicationStatusTracker';
import useApplications from '../../hooks/useApplications';
import { Button, Badge } from '../../components/ui';

/**
 * ApplicationDetailPage Component
 * 
 * A page for displaying job application details
 */
const ApplicationDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const {
    applications,
    loading,
    error,
    getApplicationById,
    withdrawApplication,
    getApplicationStatusHistory
  } = useApplications();
  
  const [application, setApplication] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Fetch application details when ID is available
  useEffect(() => {
    if (id && applications.length > 0) {
      const app = getApplicationById(id);
      setApplication(app);
      
      if (app) {
        // Fetch status history
        setHistoryLoading(true);
        setHistoryError(null);
        
        getApplicationStatusHistory(id)
          .then(history => {
            setStatusHistory(history);
          })
          .catch(err => {
            console.error('Error fetching application history:', err);
            setHistoryError('Failed to load application history');
          })
          .finally(() => {
            setHistoryLoading(false);
          });
      }
    }
  }, [id, applications, getApplicationById, getApplicationStatusHistory]);

  // Handle withdraw application
  const handleWithdraw = async (applicationId) => {
    try {
      await withdrawApplication(applicationId);
      // Refresh page after withdrawal
      router.reload();
    } catch (err) {
      console.error('Error withdrawing application:', err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  };

  // If loading, show skeleton
  if (loading || !application) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <Link href="/applications">
            <a className="text-blue-600 hover:text-blue-800">
              &larr; Back to applications
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Application for {application.jobTitle} | Excel Medical Staffing</title>
        <meta name="description" content={`Track your application for ${application.jobTitle} at ${application.facilityName}.`} />
      </Head>

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div>
                  <Link href="/">
                    <a className="text-gray-400 hover:text-gray-500">
                      <svg className="flex-shrink-0 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      <span className="sr-only">Home</span>
                    </a>
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <Link href="/applications">
                    <a className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                      My Applications
                    </a>
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500 truncate max-w-xs">
                    {application.jobTitle}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              {application.jobTitle} at {application.facilityName}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              {/* Application Status Tracker */}
              <div className="mb-8">
                <ApplicationStatusTracker
                  application={application}
                  statusHistory={statusHistory}
                  onWithdraw={handleWithdraw}
                />
              </div>

              {/* Application Details */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Application Information
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Submitted on {formatDate(application.createdAt)}
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {application.firstName} {application.lastName}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                      <dd className="mt-1 text-sm text-gray-900">{application.email}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{application.phone}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Specialty</dt>
                      <dd className="mt-1 text-sm text-gray-900">{application.specialty || 'Not specified'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Years of Experience</dt>
                      <dd className="mt-1 text-sm text-gray-900">{application.yearsExperience || 'Not specified'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Availability</dt>
                      <dd className="mt-1 text-sm text-gray-900">{application.availability || 'Not specified'}</dd>
                    </div>

                    {/* Licenses */}
                    {application.licenses && application.licenses.length > 0 && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Licenses</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                            {application.licenses.map((license, index) => (
                              <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                <div className="w-0 flex-1 flex items-center">
                                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                  <span className="ml-2 flex-1 w-0 truncate">
                                    {license.state} - {license.licenseNumber}
                                  </span>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                  <span className="font-medium text-gray-900">
                                    {license.expirationDate ? `Expires: ${formatDate(license.expirationDate)}` : 'No expiration date'}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}

                    {/* Certifications */}
                    {application.certifications && application.certifications.length > 0 && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Certifications</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                            {application.certifications.map((cert, index) => (
                              <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                <div className="w-0 flex-1 flex items-center">
                                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="ml-2 flex-1 w-0 truncate">
                                    {cert.name} - {cert.issuingOrganization}
                                  </span>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                  <span className="font-medium text-gray-900">
                                    {cert.expirationDate ? `Expires: ${formatDate(cert.expirationDate)}` : 'No expiration date'}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}

                    {/* Cover Letter / Additional Information */}
                    {application.coverLetter && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Additional Information</dt>
                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                          {application.coverLetter}
                        </dd>
                      </div>
                    )}

                    {/* Resume */}
                    {application.resumeUrl && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Resume</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <a
                            href={application.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Resume
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Job Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Job Information
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <h4 className="text-base font-medium text-gray-900">{application.jobTitle}</h4>
                  <p className="mt-1 text-sm text-gray-500">{application.facilityName}</p>
                  <p className="text-sm text-gray-500">{application.city}, {application.state}</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                      {application.payRate && (
                        <div className="sm:col-span-1">
                          <dt className="text-xs font-medium text-gray-500">Pay Rate</dt>
                          <dd className="mt-1 text-sm text-gray-900">${application.payRate}/hr</dd>
                        </div>
                      )}
                      {application.startDate && (
                        <div className="sm:col-span-1">
                          <dt className="text-xs font-medium text-gray-500">Start Date</dt>
                          <dd className="mt-1 text-sm text-gray-900">{formatDate(application.startDate)}</dd>
                        </div>
                      )}
                      {application.endDate && (
                        <div className="sm:col-span-1">
                          <dt className="text-xs font-medium text-gray-500">End Date</dt>
                          <dd className="mt-1 text-sm text-gray-900">{formatDate(application.endDate)}</dd>
                        </div>
                      )}
                      {application.shiftType && (
                        <div className="sm:col-span-1">
                          <dt className="text-xs font-medium text-gray-500">Shift Type</dt>
                          <dd className="mt-1 text-sm text-gray-900">{application.shiftType}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  <div className="mt-6">
                    <Link href={`/jobs/${application.jobId}`}>
                      <Button variant="primary" size="sm" fullWidth>
                        View Job Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Actions
                  </h3>
                  <div className="space-y-3">
                    <Link href="/applications">
                      <Button variant="outline" size="sm" fullWidth>
                        Back to Applications
                      </Button>
                    </Link>
                    
                    {['pending', 'reviewed'].includes(application.status) && (
                      <Button
                        variant="danger"
                        size="sm"
                        fullWidth
                        onClick={() => handleWithdraw(application.id)}
                      >
                        Withdraw Application
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationDetailPage;