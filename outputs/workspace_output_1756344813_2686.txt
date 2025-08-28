import React, { useState, useEffect } from 'react';
import { Checkbox, Select, Button } from '../ui';

/**
 * JobFilters component for filtering job search results
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filters - Current filter values
 * @param {function} props.onFilterChange - Function to handle filter changes
 * @param {Array} props.specialties - List of specialties
 * @param {Array} props.states - List of states
 */
const JobFilters = ({
  filters,
  onFilterChange,
  specialties = [],
  states = [],
}) => {
  // Local state for filters
  const [localFilters, setLocalFilters] = useState(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle checkbox change
  const handleCheckboxChange = (name, value) => {
    const currentValues = localFilters[name] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    handleFilterChange(name, newValues);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    handleFilterChange(name, value);
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    const updatedFilters = {
      ...localFilters,
      [name]: value,
    };
    
    setLocalFilters(updatedFilters);
  };

  // Apply filters
  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  // Reset filters
  const resetFilters = () => {
    const resetValues = {
      ...filters,
      specialty: [],
      state: [],
      city: '',
      shiftType: [],
      minPay: '',
      maxPay: '',
    };
    
    setLocalFilters(resetValues);
    onFilterChange(resetValues);
  };

  // Sort options
  const sortOptions = [
    { value: 'updatedAt:desc', label: 'Most Recent' },
    { value: 'payRate:desc', label: 'Highest Pay' },
    { value: 'payRate:asc', label: 'Lowest Pay' },
    { value: 'startDate:asc', label: 'Earliest Start Date' },
    { value: 'startDate:desc', label: 'Latest Start Date' },
  ];

  // Shift type options
  const shiftTypes = [
    { id: 'day', label: 'Day' },
    { id: 'night', label: 'Night' },
    { id: 'evening', label: 'Evening' },
    { id: 'rotating', label: 'Rotating' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Mobile filter toggle */}
      <div className="md:hidden p-4 border-b border-gray-200">
        <button
          type="button"
          className="w-full flex justify-between items-center"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-base font-medium text-gray-900">Filters</span>
          <svg
            className={`h-5 w-5 text-gray-500 transform ${isExpanded ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Filter content */}
      <div className={`p-4 md:p-6 space-y-6 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        {/* Sort by */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Sort By</h3>
          <Select
            id="sort"
            name="sort"
            value={localFilters.sort || 'updatedAt:desc'}
            onChange={handleInputChange}
            options={sortOptions}
            className="w-full"
          />
        </div>

        {/* Specialty filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Specialty</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {specialties.slice(0, 10).map((specialty) => (
              <Checkbox
                key={specialty.name}
                id={`specialty-${specialty.name}`}
                name="specialty"
                label={`${specialty.name} (${specialty.count})`}
                checked={(localFilters.specialty || []).includes(specialty.name)}
                onChange={() => handleCheckboxChange('specialty', specialty.name)}
              />
            ))}
          </div>
          {specialties.length > 10 && (
            <button
              type="button"
              className="mt-2 text-sm text-primary-600 hover:text-primary-500"
            >
              Show more
            </button>
          )}
        </div>

        {/* State filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">State</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {states.slice(0, 10).map((state) => (
              <Checkbox
                key={state.state}
                id={`state-${state.state}`}
                name="state"
                label={`${state.state} (${state.count})`}
                checked={(localFilters.state || []).includes(state.state)}
                onChange={() => handleCheckboxChange('state', state.state)}
              />
            ))}
          </div>
          {states.length > 10 && (
            <button
              type="button"
              className="mt-2 text-sm text-primary-600 hover:text-primary-500"
            >
              Show more
            </button>
          )}
        </div>

        {/* Shift type filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Shift Type</h3>
          <div className="space-y-2">
            {shiftTypes.map((shift) => (
              <Checkbox
                key={shift.id}
                id={`shift-${shift.id}`}
                name="shiftType"
                label={shift.label}
                checked={(localFilters.shiftType || []).includes(shift.id)}
                onChange={() => handleCheckboxChange('shiftType', shift.id)}
              />
            ))}
          </div>
        </div>

        {/* Pay range filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Pay Range ($/hr)</h3>
          <div className="flex space-x-2">
            <div className="w-1/2">
              <input
                type="number"
                id="minPay"
                name="minPay"
                value={localFilters.minPay || ''}
                onChange={handleInputChange}
                placeholder="Min"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div className="w-1/2">
              <input
                type="number"
                id="maxPay"
                name="maxPay"
                value={localFilters.maxPay || ''}
                onChange={handleInputChange}
                placeholder="Max"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Filter actions */}
        <div className="pt-4 border-t border-gray-200 flex flex-col space-y-2">
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={applyFilters}
          >
            Apply Filters
          </Button>
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={resetFilters}
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobFilters;