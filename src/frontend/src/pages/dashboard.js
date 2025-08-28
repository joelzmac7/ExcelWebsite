import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Button, Card } from '../components/ui';
import SavedJobsList from '../components/JobSearch/SavedJobsList';
import ApplicationsList from '../components/Application/ApplicationsList';
import useSavedJobs from '../hooks/useSavedJobs';
import useApplications from '../hooks/useApplications';

/**
 * Dashboard Component
 * 
 * A dashboard page for users to view their saved jobs, applications, and profile
 */
const Dashboard = () => {
  const {
    savedJobs,
    loading: savedJobsLoading,
    error: savedJobsError,
    unsaveJob
  } = useSavedJobs();
  
  const {
    applications,
    loading: applicationsLoading,
    error: applicationsError,
    statistics,
    withdrawApplication
  } = useApplications();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [profileCompletion, setProfileCompletion] = useState(0);
  
  // Calculate profile completion percentage
  useEffect(() => {
    // This would normally come from the API
    // For now, we'll simulate it
    const completionPercentage = 65;
    setProfileCompletion(completionPercentage);
  }, []);
  
  return (
    <>
      <Head>
        <title>Dashboard | Excel Medical Staffing</title>
        <meta name="description" content="View your saved jobs, applications, and profile at Excel Medical Staffing." />
      </Head>
      
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your job search, applications, and profile.
              </p>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Profile card */}
                <Card className="overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Profile</h2>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">John Doe</h3>
                        <p className="text-sm text-gray-500">Registered Nurse</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-medium text-gray-500">Profile Completion</h4>
                        <span className="text-xs font-medium text-gray-700">{profileCompletion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${profileCompletion}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Link href="/profile">
                        <Button variant="outline" size="sm" fullWidth>
                          Edit Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
                
                {/* Navigation */}
                <Card className="overflow-hidden">
                  <nav className="px-4 py-5 sm:p-6 space-y-1">
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                        activeTab === 'overview'
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveTab('overview')}
                    >
                      Overview
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                        activeTab === 'applications'
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveTab('applications')}
                    >
                      Applications
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                        activeTab === 'saved'
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveTab('saved')}
                    >
                      Saved Jobs
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                        activeTab === 'profile'
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveTab('profile')}
                    >
                      Profile
                    </button>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                        activeTab === 'settings'
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveTab('settings')}
                    >
                      Settings
                    </button>
                  </nav>
                </Card>
                
                {/* Quick links */}
                <Card className="overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Quick Links</h2>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <ul className="space-y-3">
                      <li>
                        <Link href="/jobs/search">
                          <a className="text-primary-600 hover:text-primary-800">
                            Search Jobs
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href="/applications">
                          <a className="text-primary-600 hover:text-primary-800">
                            View All Applications
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href="/saved-jobs">
                          <a className="text-primary-600 hover:text-primary-800">
                            View All Saved Jobs
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href="/profile/licenses">
                          <a className="text-primary-600 hover:text-primary-800">
                            Manage Licenses
                          </a>
                        </Link>
                      </li>
                      <li>
                        <Link href="/profile/certifications">
                          <a className="text-primary-600 hover:text-primary-800">
                            Manage Certifications
                          </a>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-3">
              {/* Overview tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Welcome message */}
                  <Card className="bg-primary-50 border-primary-200">
                    <div className="px-4 py-5 sm:p-6">
                      <h2 className="text-xl font-medium text-primary-800">Welcome back, John!</h2>
                      <p className="mt-1 text-primary-600">
                        Here's an overview of your job search activity.
                      </p>
                    </div>
                  </Card>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Applications</dt>
                      <dd className="mt-1 text-3xl font-semibold text-primary-600">
                        {statistics.pending + statistics.reviewed + statistics.interviewed + statistics.offered}
                      </dd>
                      <dd className="mt-3">
                        <Link href="/applications">
                          <a className="text-sm font-medium text-primary-600 hover:text-primary-800">
                            View all applications
                          </a>
                        </Link>
                      </dd>
                    </Card>
                    
                    <Card className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Saved Jobs</dt>
                      <dd className="mt-1 text-3xl font-semibold text-primary-600">
                        {savedJobs.length}
                      </dd>
                      <dd className="mt-3">
                        <Link href="/saved-jobs">
                          <a className="text-sm font-medium text-primary-600 hover:text-primary-800">
                            View saved jobs
                          </a>
                        </Link>
                      </dd>
                    </Card>
                    
                    <Card className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">Profile Completion</dt>
                      <dd className="mt-1 text-3xl font-semibold text-primary-600">
                        {profileCompletion}%
                      </dd>
                      <dd className="mt-3">
                        <Link href="/profile">
                          <a className="text-sm font-medium text-primary-600 hover:text-primary-800">
                            Complete your profile
                          </a>
                        </Link>
                      </dd>
                    </Card>
                  </div>
                  
                  {/* Recent applications */}
                  <Card className="overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                      <h2 className="text-lg font-medium text-gray-900">Recent Applications</h2>
                      <Link href="/applications">
                        <a className="text-sm font-medium text-primary-600 hover:text-primary-800">
                          View all
                        </a>
                      </Link>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      <ApplicationsList
                        applications={applications}
                        loading={applicationsLoading}
                        error={applicationsError}
                        onWithdraw={withdrawApplication}
                        compact={true}
                      />
                    </div>
                  </Card>
                  
                  {/* Saved jobs */}
                  <Card className="overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                      <h2 className="text-lg font-medium text-gray-900">Saved Jobs</h2>
                      <Link href="/saved-jobs">
                        <a className="text-sm font-medium text-primary-600 hover:text-primary-800">
                          View all
                        </a>
                      </Link>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      <SavedJobsList
                        jobs={savedJobs}
                        loading={savedJobsLoading}
                        error={savedJobsError}
                        onUnsaveJob={unsaveJob}
                        compact={true}
                      />
                    </div>
                  </Card>
                  
                  {/* Recommended jobs */}
                  <Card className="overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">Recommended Jobs</h2>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      <p className="text-sm text-gray-500">
                        Based on your profile and application history, we recommend these jobs for you.
                      </p>
                      <div className="mt-4">
                        <Link href="/jobs/search">
                          <Button variant="primary">
                            Browse Jobs
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
              
              {/* Applications tab */}
              {activeTab === 'applications' && (
                <Card className="overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Your Applications</h2>
                    <Link href="/applications">
                      <a className="text-sm font-medium text-primary-600 hover:text-primary-800">
                        View all
                      </a>
                    </Link>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <ApplicationsList
                      applications={applications}
                      loading={applicationsLoading}
                      error={applicationsError}
                      onWithdraw={withdrawApplication}
                    />
                  </div>
                </Card>
              )}
              
              {/* Saved jobs tab */}
              {activeTab === 'saved' && (
                <Card className="overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Your Saved Jobs</h2>
                    <Link href="/saved-jobs">
                      <a className="text-sm font-medium text-primary-600 hover:text-primary-800">
                        View all
                      </a>
                    </Link>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <SavedJobsList
                      jobs={savedJobs}
                      loading={savedJobsLoading}
                      error={savedJobsError}
                      onUnsaveJob={unsaveJob}
                    />
                  </div>
                </Card>
              )}
              
              {/* Profile tab */}
              {activeTab === 'profile' && (
                <Card className="overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Your Profile</h2>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="space-y-6">
                      {/* Profile completion */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-sm font-medium text-gray-700">Profile Completion</h3>
                          <span className="text-sm font-medium text-gray-700">{profileCompletion}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-primary-600 h-2.5 rounded-full" 
                            style={{ width: `${profileCompletion}%` }}
                          ></div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Complete your profile to improve your job matches and increase your chances of getting hired.
                        </p>
                      </div>
                      
                      {/* Personal information */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Personal Information</h3>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div className="sm:col-span-1">
                            <dt className="text-xs font-medium text-gray-500">Full Name</dt>
                            <dd className="mt-1 text-sm text-gray-900">John Doe</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-xs font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900">john.doe@example.com</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-xs font-medium text-gray-500">Phone</dt>
                            <dd className="mt-1 text-sm text-gray-900">(555) 123-4567</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-xs font-medium text-gray-500">Location</dt>
                            <dd className="mt-1 text-sm text-gray-900">San Francisco, CA</dd>
                          </div>
                        </dl>
                      </div>
                      
                      {/* Professional information */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Professional Information</h3>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div className="sm:col-span-1">
                            <dt className="text-xs font-medium text-gray-500">Specialty</dt>
                            <dd className="mt-1 text-sm text-gray-900">Registered Nurse</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-xs font-medium text-gray-500">Years of Experience</dt>
                            <dd className="mt-1 text-sm text-gray-900">5+ years</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs font-medium text-gray-500">Licenses</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              <ul className="list-disc pl-5 space-y-1">
                                <li>California RN License #12345678 (Expires: Dec 2025)</li>
                                <li>Texas RN License #87654321 (Expires: Jun 2026)</li>
                              </ul>
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs font-medium text-gray-500">Certifications</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              <ul className="list-disc pl-5 space-y-1">
                                <li>BLS (Expires: Mar 2026)</li>
                                <li>ACLS (Expires: Mar 2026)</li>
                                <li>PALS (Expires: Mar 2026)</li>
                              </ul>
                            </dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div className="pt-5 border-t border-gray-200">
                        <Link href="/profile">
                          <Button variant="primary">
                            Edit Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              
              {/* Settings tab */}
              {activeTab === 'settings' && (
                <Card className="overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Settings</h2>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="space-y-6">
                      {/* Account settings */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Account Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                              <p className="text-xs text-gray-500">Receive email notifications about new jobs, application updates, etc.</p>
                            </div>
                            <div className="flex items-center">
                              <button
                                type="button"
                                className="bg-primary-600 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                role="switch"
                                aria-checked="true"
                              >
                                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">SMS Notifications</p>
                              <p className="text-xs text-gray-500">Receive text message notifications about urgent updates.</p>
                            </div>
                            <div className="flex items-center">
                              <button
                                type="button"
                                className="bg-gray-200 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                role="switch"
                                aria-checked="false"
                              >
                                <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Job Recommendations</p>
                              <p className="text-xs text-gray-500">Receive personalized job recommendations based on your profile.</p>
                            </div>
                            <div className="flex items-center">
                              <button
                                type="button"
                                className="bg-primary-600 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                role="switch"
                                aria-checked="true"
                              >
                                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Privacy settings */}
                      <div className="pt-5 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Privacy Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Profile Visibility</p>
                              <p className="text-xs text-gray-500">Make your profile visible to recruiters and employers.</p>
                            </div>
                            <div className="flex items-center">
                              <button
                                type="button"
                                className="bg-primary-600 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                role="switch"
                                aria-checked="true"
                              >
                                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Data Sharing</p>
                              <p className="text-xs text-gray-500">Allow us to share your data with trusted partners.</p>
                            </div>
                            <div className="flex items-center">
                              <button
                                type="button"
                                className="bg-gray-200 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                role="switch"
                                aria-checked="false"
                              >
                                <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-5 border-t border-gray-200">
                        <Button variant="primary">
                          Save Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;