import React from 'react';
import JobCard from './JobCard';
import JobListSkeleton from './JobListSkeleton';
import { Button } from '../ui';

/**
 * JobList component for displaying a list of jobs with pagination
 * 
 * @param {Object} props - Component props
 * @param {Array} props.jobs - List of jobs to display
 * @param {boolean} props.loading - Whether jobs are loading
 * @param {string} props.error - Error message if any
 * @param {number} props.totalJobs - Total number of jobs
 * @param {number} props.currentPage - Current page number
 * @param {number} props.totalPages - Total number of pages
 * @param {function} props.onPageChange - Function to handle page change
 */
const JobList = ({
  jobs = [],
  loading = false,
  error = null,
  totalJobs = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  // Generate pagination array
  const generatePagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than or equal to maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);
      
      // Calculate start and end of page range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust start and end to always show 3 pages in the middle
      if (start === 2) {
        end = Math.min(totalPages - 1, start + 2);
      }
      if (end === totalPages - 1) {
        start = Math.max(2, end - 2);
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Always include last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page !== '...' && page !== currentPage) {
      onPageChange(page);
      
      // Scroll to top of the page
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  // If loading, show skeleton
  if (loading) {
    return <JobListSkeleton count={10} />;
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
        <p className="text-red-700">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // If no jobs found, show message
  if (jobs.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-8 text-center">
        <h3 className="text-lg font-medium text-blue-800 mb-2">No jobs found</h3>
        <p className="text-blue-600 mb-4">
          We couldn't find any jobs matching your search criteria. Try adjusting your filters or search terms.
        </p>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Results count */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing <span className="font-medium">{jobs.length}</span> of{' '}
          <span className="font-medium">{totalJobs}</span> jobs
        </p>
      </div>

      {/* Job cards */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* Previous page button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Previous</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Page numbers */}
            {generatePagination().map((page, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(page)}
                disabled={page === '...'}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                    : page === '...'
                    ? 'bg-white border-gray-300 text-gray-500 cursor-default'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Next page button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Next</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default JobList;