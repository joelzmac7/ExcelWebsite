import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../ui';

/**
 * ResumePreview Component
 * 
 * A component for displaying a preview of parsed resume data
 * 
 * @param {Object} props - Component props
 * @param {Object} props.parsedData - Parsed resume data
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onApplyData - Function to apply parsed data to form
 * @param {Function} props.onEdit - Function to edit parsed data
 * @param {boolean} props.loading - Whether data is loading
 */
const ResumePreview = ({
  parsedData,
  formData,
  onApplyData,
  onEdit,
  loading = false
}) => {
  const [activeSection, setActiveSection] = useState('personal');
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }
  
  if (!parsedData) {
    return null;
  }

  // Sections to display
  const sections = {
    personal: {
      title: 'Personal Information',
      fields: [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'address', label: 'Address' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'zipCode', label: 'ZIP Code' }
      ]
    },
    professional: {
      title: 'Professional Information',
      fields: [
        { key: 'specialty', label: 'Specialty' },
        { key: 'yearsExperience', label: 'Years of Experience' },
        { key: 'currentTitle', label: 'Current Title' },
        { key: 'currentEmployer', label: 'Current Employer' }
      ]
    },
    licenses: {
      title: 'Licenses',
      isArray: true,
      arrayKey: 'licenses',
      fields: [
        { key: 'state', label: 'State' },
        { key: 'licenseNumber', label: 'License Number' },
        { key: 'expirationDate', label: 'Expiration Date' }
      ]
    },
    certifications: {
      title: 'Certifications',
      isArray: true,
      arrayKey: 'certifications',
      fields: [
        { key: 'name', label: 'Name' },
        { key: 'issuingOrganization', label: 'Issuing Organization' },
        { key: 'expirationDate', label: 'Expiration Date' }
      ]
    },
    skills: {
      title: 'Skills',
      isArray: true,
      arrayKey: 'skills',
      fields: [
        { key: 'name', label: 'Skill' },
        { key: 'level', label: 'Level' }
      ]
    }
  };

  // Handle apply data
  const handleApplyData = () => {
    if (onApplyData) {
      onApplyData(parsedData);
    }
  };

  // Handle edit data
  const handleEdit = (section, index, field, value) => {
    if (!onEdit) return;
    
    const updatedData = { ...parsedData };
    
    if (sections[section].isArray) {
      const arrayKey = sections[section].arrayKey;
      if (!updatedData[arrayKey]) {
        updatedData[arrayKey] = [];
      }
      
      if (!updatedData[arrayKey][index]) {
        updatedData[arrayKey][index] = {};
      }
      
      updatedData[arrayKey][index][field] = value;
    } else {
      updatedData[field] = value;
    }
    
    onEdit(updatedData);
  };

  // Check if a section has data
  const sectionHasData = (section) => {
    if (sections[section].isArray) {
      const arrayKey = sections[section].arrayKey;
      return parsedData[arrayKey] && parsedData[arrayKey].length > 0;
    }
    
    return sections[section].fields.some(field => parsedData[field.key]);
  };

  // Get available sections
  const availableSections = Object.keys(sections).filter(sectionHasData);

  // If no data available, show message
  if (availableSections.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data extracted</h3>
          <p className="mt-1 text-sm text-gray-500">
            We couldn't extract any data from your resume.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Resume Preview
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Review the information extracted from your resume.
        </p>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px overflow-x-auto">
          {availableSections.map((section) => (
            <button
              key={section}
              className={`py-4 px-4 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                activeSection === section
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveSection(section)}
            >
              {sections[section].title}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {activeSection && sections[activeSection] && (
          <div>
            {sections[activeSection].isArray ? (
              <div>
                {parsedData[sections[activeSection].arrayKey]?.length > 0 ? (
                  <div className="space-y-4">
                    {parsedData[sections[activeSection].arrayKey].map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          {sections[activeSection].title} #{index + 1}
                        </h4>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                          {sections[activeSection].fields.map((field) => (
                            <div key={field.key} className="sm:col-span-1">
                              <dt className="text-xs font-medium text-gray-500">{field.label}</dt>
                              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                                <span className="flex-grow">{item[field.key] || 'Not specified'}</span>
                                {onEdit && (
                                  <button
                                    type="button"
                                    className="ml-2 text-primary-600 hover:text-primary-800 text-xs"
                                    onClick={() => {
                                      const newValue = prompt(`Edit ${field.label}:`, item[field.key] || '');
                                      if (newValue !== null) {
                                        handleEdit(activeSection, index, field.key, newValue);
                                      }
                                    }}
                                  >
                                    Edit
                                  </button>
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No {sections[activeSection].title.toLowerCase()} found.</p>
                )}
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                {sections[activeSection].fields.map((field) => (
                  <div key={field.key} className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center">
                      <span className="flex-grow">{parsedData[field.key] || 'Not specified'}</span>
                      {onEdit && (
                        <button
                          type="button"
                          className="ml-2 text-primary-600 hover:text-primary-800 text-xs"
                          onClick={() => {
                            const newValue = prompt(`Edit ${field.label}:`, parsedData[field.key] || '');
                            if (newValue !== null) {
                              handleEdit(activeSection, null, field.key, newValue);
                            }
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </div>
      
      <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            Print Preview
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={handleApplyData}
          >
            Apply to Form
          </Button>
        </div>
      </div>
    </div>
  );
};

ResumePreview.propTypes = {
  parsedData: PropTypes.object,
  formData: PropTypes.object,
  onApplyData: PropTypes.func,
  onEdit: PropTypes.func,
  loading: PropTypes.bool
};

export default ResumePreview;