import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import JobSearchForm from '../../components/JobSearch/JobSearchForm';
import JobList from '../../components/JobSearch/JobList';
import JobFilters from '../../components/JobSearch/JobFilters';
import jobService from '../../services/jobService';

const JobSearchPage = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [locations, setLocations] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Parse filters from URL query parameters
  const [filters, setFilters] = useState({
    keyword: '',
    specialty: [],
    state: [],
    city: '',
    shiftType: [],
    minPay: '',
    maxPay: '',
    sort: 'updatedAt:desc',
    page: 1,
    limit: 10
  });
  
  // Update filters when URL changes
  useEffect(() => {
    if (router.isReady) {
      const { 
        keyword, specialty, state, city, shiftType, 
        minPay, maxPay, sort, page = 1, limit = 10 
      } = router.query;
      
      setFilters({
        keyword: keyword || '',
        specialty: specialty ? specialty.split(',') : [],
        state: state ? state.split(',') : [],
        city: city || '',
        shiftType: shiftType ? shiftType.split(',') : [],
        minPay: minPay || '',
        maxPay: maxPay || '',
        sort: sort || 'updatedAt:desc',
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      setCurrentPage(parseInt(page) || 1);
    }
  }, [router.isReady, router.query]);
  
  // Fetch specialties and locations on component mount
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [specialtiesResponse, locationsResponse] = await Promise.all([
          jobService.getSpecialties(),
          jobService.getLocations()
        ]);
        
        setSpecialties(specialtiesResponse.data);
        setLocations(locationsResponse.data);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };
    
    fetchFilterData();
  }, []);
  
  // Fetch jobs based on filters
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Convert filters to API parameters
        const params = {
          search: filters.keyword,
          specialty: filters.specialty.length > 0 ? filters.specialty.join(',') : undefined,
          state: filters.state.length > 0 ? filters.state.join(',') : undefined,
          city: filters.city || undefined,
          shiftType: filters.shiftType.length > 0 ? filters.shiftType.join(',') : undefined,
          minPay: filters.minPay || undefined,
          maxPay: filters.maxPay || undefined,
          sort: filters.sort,
          page: filters.page,
          limit: filters.limit
        };
        
        const response = await jobService.getJobs(params);
        
        setJobs(response.data);
        setTotalJobs(response.meta.total);
        setTotalPages(response.meta.total_pages);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to load jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (router.isReady) {
      fetchJobs();
    }
  }, [filters, router.isReady]);
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    // Reset to page 1 when filters change
    const updatedFilters = { ...newFilters, page: 1 };
    
    // Update URL with new filters
    const queryParams = new URLSearchParams();
    
    if (updatedFilters.keyword) {
      queryParams.append('keyword', updatedFilters.keyword);
    }
    
    if (updatedFilters.specialty && updatedFilters.specialty.length > 0) {
      queryParams.append('specialty', updatedFilters.specialty.join(','));
    }
    
    if (updatedFilters.state && updatedFilters.state.length > 0) {
      queryParams.append('state', updatedFilters.state.join(','));
    }
    
    if (updatedFilters.city) {
      queryParams.append('city', updatedFilters.city);
    }
    
    if (updatedFilters.shiftType && updatedFilters.shiftType.length > 0) {
      queryParams.append('shiftType', updatedFilters.shiftType.join(','));
    }
    
    if (updatedFilters.minPay) {
      queryParams.append('minPay', updatedFilters.minPay);
    }
    
    if (updatedFilters.maxPay) {
      queryParams.append('maxPay', updatedFilters.maxPay);
    }
    
    if (updatedFilters.sort) {
      queryParams.append('sort', updatedFilters.sort);
    }
    
    // Update URL without refreshing the page
    router.push(`/jobs/search?${queryParams.toString()}`, undefined, { shallow: true });
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    const updatedFilters = { ...filters, page };
    
    // Update URL with new page
    const queryParams = new URLSearchParams(router.query);
    queryParams.set('page', page);
    
    // Update URL without refreshing the page
    router.push(`/jobs/search?${queryParams.toString()}`, undefined, { shallow: true });
  };
  
  return (
    <>
      <Head>
        <title>Search Healthcare Jobs | Excel Medical Staffing</title>
        <meta name="description" content="Search thousands of healthcare jobs across the United States. Find travel nursing, allied health, and permanent positions with Excel Medical Staffing." />
      </Head>
      
      <div className="bg-gray-50 min-h-screen">
        {/* Search form */}
        <div className="bg-primary-600 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-white mb-6">Search Healthcare Jobs</h1>
            <JobSearchForm 
              initialValues={{
                keyword: filters.keyword,
                specialty: filters.specialty.length === 1 ? filters.specialty[0] : '',
                location: filters.city || (filters.state.length === 1 ? filters.state[0] : '')
              }}
            />
          </div>
        </div>
        
        {/* Results section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Filters sidebar */}
            <div className="md:col-span-1">
              <JobFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
                specialties={specialties}
                states={locations}
              />
            </div>
            
            {/* Job listings */}
            <div className="md:col-span-3">
              <JobList 
                jobs={jobs}
                loading={loading}
                error={error}
                totalJobs={totalJobs}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobSearchPage;