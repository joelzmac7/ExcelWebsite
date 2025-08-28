import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import jobService from '../../services/jobService';
import { Button, Badge, Card } from '../../components/ui';

// Job detail page component
const JobDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [job, setJob] = useState(null);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [jobResponse, similarJobsResponse] = await Promise.all([
          jobService.getJobById(id),
          jobService.getSimilarJobs(id, 5)
        ]);
        
        setJob(jobResponse.data);
        setSimilarJobs(similarJobsResponse.data);
      } catch (error) {
        console.error('Error fetching job details:', error);
        setError('Failed to load job details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobDetails();
  }, [id]);
  
  // Handle share job
  const handleShareJob = () => {
    setShareModalOpen(true);
  };
  
  // Handle save job
  const handleSaveJob = () => {
    // This would be implemented with user authentication
    alert('Please log in to save jobs');
  };
  
  // Handle apply now
  const handleApplyNow = () => {
    router.push(`/jobs/${id}/apply`);
  };
  
  if (loading) {
    return <JobDetailSkeleton />;
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        <Link href="/jobs/search">
          <a className="text-primary-600 hover:text-primary-800">
            &larr; Back to job search
          </a>
        </Link>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Job not found. It may have been filled or removed.
              </p>
            </div>
          </div>
        </div>
        <Link href="/jobs/search">
          <a className="text-primary-600 hover:text-primary-800">
            &larr; Back to job search
          </a>
        </Link>
      </div>
    );
  }
  
  // Format dates
  const postedDate = job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : 'Recently';
  const startDate = job.startDate ? format(new Date(job.startDate), 'MMMM d, yyyy') : 'Flexible';
  const endDate = job.endDate ? format(new Date(job.endDate), 'MMMM d, yyyy') : 'To be determined';
  
  // Format pay rate
  const hourlyPayRate = job.payRate ? `$${job.payRate.toFixed(2)}/hr` : 'Competitive';
  const weeklyPayRate = job.payRate && job.weeklyHours ? `$${(job.payRate * job.weeklyHours).toFixed(0)}/week` : 'Competitive';
  
  // Calculate assignment duration
  let duration = 'Flexible';
  if (job.startDate && job.endDate) {
    const start = new Date(job.startDate);
    const end = new Date(job.endDate);
    const weeks = Math.ceil((end - start) / (7 * 24 * 60 * 60 * 1000));
    duration = `${weeks} weeks`;
  }
  
  // Get shift badge variant
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
    <>
      <Head>
        <title>{job.title} in {job.city}, {job.state} | Excel Medical Staffing</title>
        <meta name="description" content={job.seoDescription || `${job.title} position at ${job.facilityName} in ${job.city}, ${job.state}. ${job.weeklyHours} hours/week, ${hourlyPayRate}. Apply now with Excel Medical Staffing.`} />
        <meta property="og:title" content={`${job.title} in ${job.city}, ${job.state} | Excel Medical Staffing`} />
        <meta property="og:description" content={job.seoDescription || `${job.title} position at ${job.facilityName} in ${job.city}, ${job.state}. ${job.weeklyHours} hours/week, ${hourlyPayRate}. Apply now with Excel Medical Staffing.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://excelmedicalsolutions.com/jobs/${job.id}`} />
        <meta property="og:image" content="https://excelmedicalsolutions.com/images/job-share-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        
        {/* Schema.org job posting markup */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            "title": job.title,
            "description": job.description,
            "datePosted": job.createdAt,
            "validThrough": job.endDate,
            "employmentType": "CONTRACTOR",
            "hiringOrganization": {
              "@type": "Organization",
              "name": "Excel Medical Staffing",
              "sameAs": "https://excelmedicalsolutions.com",
              "logo": "https://excelmedicalsolutions.com/images/logo.png"
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": job.city,
                "addressRegion": job.state,
                "postalCode": job.zipCode,
                "addressCountry": "US"
              }
            },
            "baseSalary": {
              "@type": "MonetaryAmount",
              "currency": "USD",
              "value": {
                "@type": "QuantitativeValue",
                "value": job.payRate * job.weeklyHours,
                "unitText": "WEEK"
              }
            },
            "workHours": `${job.weeklyHours} hours per week`,
            "occupationalCategory": job.specialty,
            "skills": job.requirements,
            "industry": "Healthcare",
            "jobBenefits": job.benefits,
            "identifier": {
              "@type": "PropertyValue",
              "name": "Excel Medical Staffing Job ID",
              "value": job.externalId
            }
          })}
        </script>
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
                  <Link href="/jobs/search">
                    <a className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">Jobs</a>
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500 truncate max-w-xs">
                    {job.title}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              {/* Job header */}
              <Card className="mb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                    <p className="text-lg text-gray-600">{job.facilityName}</p>
                    <p className="text-gray-600">{job.city}, {job.state}</p>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={getShiftBadgeVariant(job.shiftType)} size="md">
                        {job.shiftType || 'Various Shifts'}
                      </Badge>
                      
                      <Badge variant="primary" size="md">
                        {job.specialty}
                      </Badge>
                      
                      {job.isUrgent && (
                        <Badge variant="urgent" size="md">
                          Urgent
                        </Badge>
                      )}
                      
                      {job.isFeatured && (
                        <Badge variant="featured" size="md">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 text-center md:text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {weeklyPayRate}
                    </div>
                    <div className="text-sm text-gray-600">
                      {hourlyPayRate} × {job.weeklyHours} hours
                    </div>
                    {job.housingStipend && (
                      <div className="text-sm text-gray-600">
                        +${job.housingStipend}/week housing
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                    <p className="mt-1 text-sm text-gray-900">{startDate}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                    <p className="mt-1 text-sm text-gray-900">{endDate}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                    <p className="mt-1 text-sm text-gray-900">{duration}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Shift</h3>
                    <p className="mt-1 text-sm text-gray-900">{job.shiftDetails}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Weekly Hours</h3>
                    <p className="mt-1 text-sm text-gray-900">{job.weeklyHours} hours</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p className="mt-1 text-sm text-gray-900">{job.city}, {job.state}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    Posted {postedDate} • {job.viewsCount || 0} views • {job.applicationsCount || 0} applications
                  </p>
                  
                  <div className="mt-3 sm:mt-0 flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveJob}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareJob}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </Button>
                  </div>
                </div>
              </Card>
              
              {/* Job description */}
              <Card className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Job Description</h2>
                <div className="prose max-w-none">
                  <p>{job.description}</p>
                </div>
              </Card>
              
              {/* Requirements */}
              <Card className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Requirements</h2>
                <div className="prose max-w-none">
                  {job.requirements.split('\n').map((requirement, index) => (
                    <p key={index}>{requirement}</p>
                  ))}
                </div>
              </Card>
              
              {/* Benefits */}
              <Card className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Benefits</h2>
                <div className="prose max-w-none">
                  {job.benefits.split('\n').map((benefit, index) => (
                    <p key={index}>{benefit}</p>
                  ))}
                </div>
              </Card>
              
              {/* Facility information */}
              {job.facility && (
                <Card className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">About the Facility</h2>
                  <div className="prose max-w-none mb-4">
                    <p>{job.facility.description || `${job.facilityName} is located in ${job.city}, ${job.state}.`}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {job.facility.type && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Facility Type</h3>
                        <p className="mt-1 text-sm text-gray-900">{job.facility.type}</p>
                      </div>
                    )}
                    
                    {job.facility.bedCount && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Bed Count</h3>
                        <p className="mt-1 text-sm text-gray-900">{job.facility.bedCount}</p>
                      </div>
                    )}
                    
                    {job.facility.traumaLevel && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Trauma Level</h3>
                        <p className="mt-1 text-sm text-gray-900">{job.facility.traumaLevel}</p>
                      </div>
                    )}
                    
                    {job.facility.specialties && job.facility.specialties.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Specialties</h3>
                        <p className="mt-1 text-sm text-gray-900">{job.facility.specialties.join(', ')}</p>
                      </div>
                    )}
                    
                    {job.facility.isTeachingHospital !== null && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Teaching Hospital</h3>
                        <p className="mt-1 text-sm text-gray-900">{job.facility.isTeachingHospital ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                    
                    {job.facility.isMagnetDesignated !== null && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Magnet Designated</h3>
                        <p className="mt-1 text-sm text-gray-900">{job.facility.isMagnetDesignated ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
              
              {/* Location information */}
              <Card className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Location</h2>
                
                {job.latitude && job.longitude && (
                  <div className="h-64 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBGCql0HlN4C_D7B2BcIIhtuFvjrdfvoew&q=${job.latitude},${job.longitude}`}
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">City</h3>
                    <p className="mt-1 text-sm text-gray-900">{job.city}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">State</h3>
                    <p className="mt-1 text-sm text-gray-900">{job.state}</p>
                  </div>
                  {job.zipCode && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">ZIP Code</h3>
                      <p className="mt-1 text-sm text-gray-900">{job.zipCode}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Apply button */}
              <Card className="mb-6">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleApplyNow}
                >
                  Apply Now
                </Button>
                
                <p className="mt-4 text-sm text-gray-500 text-center">
                  Quick application process - takes less than 2 minutes
                </p>
              </Card>
              
              {/* Similar jobs */}
              <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Similar Jobs</h2>
                
                {similarJobs.length > 0 ? (
                  <div className="space-y-4">
                    {similarJobs.map((similarJob) => (
                      <div key={similarJob.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                        <Link href={`/jobs/${similarJob.id}`}>
                          <a className="block hover:bg-gray-50 -m-2 p-2 rounded-md">
                            <h3 className="text-sm font-medium text-gray-900 hover:text-primary-600">{similarJob.title}</h3>
                            <p className="text-xs text-gray-500">{similarJob.facilityName}</p>
                            <p className="text-xs text-gray-500">{similarJob.city}, {similarJob.state}</p>
                            <div className="mt-1 flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-900">${(similarJob.payRate * similarJob.weeklyHours).toFixed(0)}/week</span>
                              <Badge variant={getShiftBadgeVariant(similarJob.shiftType)} size="sm">
                                {similarJob.shiftType || 'Various'}
                              </Badge>
                            </div>
                          </a>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No similar jobs found.</p>
                )}
                
                <div className="mt-4 text-center">
                  <Link href="/jobs/search">
                    <a className="text-sm text-primary-600 hover:text-primary-800">
                      View all jobs
                    </a>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Share modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Share this job
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-4">
                        Share this job with your network
                      </p>
                      
                      <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                        <a 
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://excelmedicalsolutions.com/jobs/${job.id}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                          </svg>
                        </a>
                        
                        <a 
                          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this ${job.title} job in ${job.city}, ${job.state}!`)}&url=${encodeURIComponent(`https://excelmedicalsolutions.com/jobs/${job.id}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-400 text-white p-2 rounded-full hover:bg-blue-500"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                        
                        <a 
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://excelmedicalsolutions.com/jobs/${job.id}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-700 text-white p-2 rounded-full hover:bg-blue-800"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </a>
                        
                        <a 
                          href={`mailto:?subject=${encodeURIComponent(`Job Opportunity: ${job.title} in ${job.city}, ${job.state}`)}&body=${encodeURIComponent(`Check out this job opportunity:\n\n${job.title} at ${job.facilityName} in ${job.city}, ${job.state}\n\nPay: ${weeklyPayRate}\nShift: ${job.shiftDetails}\nStart Date: ${startDate}\n\nApply here: https://excelmedicalsolutions.com/jobs/${job.id}`)}`}
                          className="bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600"
                        >
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </a>
                      </div>
                      
                      <div className="mt-6">
                        <label htmlFor="job-url" className="block text-sm font-medium text-gray-700">
                          Job URL
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="text"
                            name="job-url"
                            id="job-url"
                            className="focus:ring-primary-500 focus:border-primary-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                            value={`https://excelmedicalsolutions.com/jobs/${job.id}`}
                            readOnly
                          />
                          <button
                            type="button"
                            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            onClick={() => {
                              navigator.clipboard.writeText(`https://excelmedicalsolutions.com/jobs/${job.id}`);
                              alert('URL copied to clipboard!');
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShareModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Skeleton loader for job detail page
const JobDetailSkeleton = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs skeleton */}
        <div className="flex mb-6">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content skeleton */}
          <div className="lg:col-span-2">
            {/* Job header skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-start">
                <div className="w-3/4">
                  <div className="h-7 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
            
            {/* Content sections skeleton */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Sidebar skeleton */}
          <div className="lg:col-span-1">
            {/* Apply button skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="h-12 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
            
            {/* Similar jobs skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-1"></div>
                    <div className="mt-1 flex justify-between items-center">
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/5"></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-center">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;