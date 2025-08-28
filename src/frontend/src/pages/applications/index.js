import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ApplicationsList from '../../components/Application/ApplicationsList';
import useApplications from '../../hooks/useApplications';

/**
 * ApplicationsPage Component
 * 
 * A page for displaying all job applications
 */
const ApplicationsPage = () => {
  const {
    applications,
    loading,
    error,
    statistics,
    withdrawApplication
  } = useApplications();

  return (
    <>
      <Head>
        <title>My Applications | Excel Medical Staffing</title>
        <meta name="description" content="View and manage your job applications at Excel Medical Staffing." />
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
                  <span className="ml-4 text-sm font-medium text-gray-500">My Applications</span>
                </div>
              </li>
            </ol>
          </nav>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and manage your job applications.
            </p>
          </div>

          {/* Application Statistics */}
          {!loading && !error && applications.length > 0 && (
            <div className="mb-6 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Application Summary</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-4">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Applications</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{statistics.total}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Active Applications</dt>
                  <dd className="mt-1 text-3xl font-semibold text-primary-600">
                    {statistics.pending + statistics.reviewed + statistics.interviewed + statistics.offered}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Interviews</dt>
                  <dd className="mt-1 text-3xl font-semibold text-blue-600">{statistics.interviewed}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Offers</dt>
                  <dd className="mt-1 text-3xl font-semibold text-green-600">{statistics.offered + statistics.hired}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Applications List */}
          <div className="bg-white shadow rounded-lg p-6">
            <ApplicationsList
              applications={applications}
              loading={loading}
              error={error}
              onWithdraw={withdrawApplication}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationsPage;