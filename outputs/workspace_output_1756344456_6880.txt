import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import jobService from '../../services/jobService';
import { TextField, Select, Button } from '../ui';

const JobSearchForm = ({ initialValues = {}, className = '' }) => {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState({
    keyword: initialValues.keyword || '',
    specialty: initialValues.specialty || '',
    location: initialValues.location || '',
    radius: initialValues.radius || '50',
  });
  const [specialties, setSpecialties] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update form when URL params change
  useEffect(() => {
    if (Object.keys(router.query).length > 0) {
      setSearchParams({
        keyword: router.query.keyword || '',
        specialty: router.query.specialty || '',
        location: router.query.location || '',
        radius: router.query.radius || '50',
      });
    }
  }, [router.query]);

  // Fetch specialties and locations on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [specialtiesResponse, locationsResponse] = await Promise.all([
          jobService.getSpecialties(),
          jobService.getLocations()
        ]);
        
        setSpecialties(specialtiesResponse.data);
        setLocations(locationsResponse.data);
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Failed to load search options. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (searchParams.keyword) {
      queryParams.append('keyword', searchParams.keyword);
    }
    
    if (searchParams.specialty) {
      queryParams.append('specialty', searchParams.specialty);
    }
    
    if (searchParams.location) {
      queryParams.append('location', searchParams.location);
    }
    
    if (searchParams.radius && searchParams.location) {
      queryParams.append('radius', searchParams.radius);
    }
    
    // Navigate to search results page
    router.push(`/jobs/search?${queryParams.toString()}`);
  };

  // Format specialty options for Select component
  const specialtyOptions = [
    { value: '', label: 'All Specialties' },
    ...(specialties.map(specialty => ({
      value: specialty.name,
      label: `${specialty.name} (${specialty.count})`
    })))
  ];

  // Create location datalist options
  const getLocationOptions = () => {
    const options = [];
    
    // Add state options
    locations.forEach(location => {
      options.push({
        value: location.state,
        label: `${location.state} (${location.count})`
      });
      
      // Add city options
      location.cities.forEach(city => {
        options.push({
          value: `${city.name}, ${location.state}`,
          label: `${city.name}, ${location.state} (${city.count})`
        });
      });
    });
    
    return options;
  };

  // Create radius options
  const radiusOptions = [
    { value: '10', label: '10 miles' },
    { value: '25', label: '25 miles' },
    { value: '50', label: '50 miles' },
    { value: '100', label: '100 miles' },
    { value: '250', label: '250 miles' }
  ];

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Keyword Search */}
        <div className="flex-1">
          <TextField
            id="keyword"
            name="keyword"
            value={searchParams.keyword}
            onChange={handleChange}
            placeholder="Job title or keyword"
            startIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>

        {/* Specialty Dropdown */}
        <div className="flex-1">
          <Select
            id="specialty"
            name="specialty"
            value={searchParams.specialty}
            onChange={handleChange}
            options={specialtyOptions}
            placeholder="All Specialties"
            disabled={loading}
            leadingIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>

        {/* Location Search */}
        <div className="flex-1">
          <TextField
            id="location"
            name="location"
            value={searchParams.location}
            onChange={handleChange}
            placeholder="City, state, or zip"
            list="location-options"
            disabled={loading}
            startIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            }
          />
          <datalist id="location-options">
            {getLocationOptions().map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </datalist>
        </div>

        {/* Search Button */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full md:w-auto"
          >
            Search Jobs
          </Button>
        </div>
      </div>

      {/* Radius Filter (only shown when location is provided) */}
      {searchParams.location && (
        <div className="mt-3 flex items-center">
          <label htmlFor="radius" className="mr-2 text-sm text-gray-600">
            Within:
          </label>
          <Select
            id="radius"
            name="radius"
            value={searchParams.radius}
            onChange={handleChange}
            options={radiusOptions}
            className="text-sm"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </form>
  );
};

export default JobSearchForm;