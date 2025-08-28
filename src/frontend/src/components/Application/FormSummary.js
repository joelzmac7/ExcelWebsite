import React from 'react';
import { Button } from '../ui';

/**
 * FormSummary Component
 * 
 * A component for displaying a summary of form data before submission
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data to display
 * @param {Object} props.fieldLabels - Map of field names to display labels
 * @param {Array} props.sections - Sections to organize fields
 * @param {Function} props.onEdit - Function called when edit button is clicked
 * @param {boolean} props.showEditButtons - Whether to show edit buttons
 */
const FormSummary = ({
  formData,
  fieldLabels = {},
  sections = [],
  onEdit,
  showEditButtons = true
}) => {
  // If no sections are provided, create a default section with all fields
  const displaySections = sections.length > 0 
    ? sections 
    : [{ title: 'Summary', fields: Object.keys(formData) }];

  // Format value for display
  const formatValue = (name, value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">Not provided</span>;
    }

    // Handle different value types
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400">None</span>;
      }
      return (
        <ul className="list-disc list-inside">
          {value.map((item, index) => (
            <li key={index}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object') {
      if (value instanceof File) {
        return value.name;
      }
      return JSON.stringify(value);
    }

    return value;
  };

  // Handle edit button click
  const handleEditSection = (sectionIndex) => {
    if (onEdit) {
      onEdit(sectionIndex);
    }
  };

  return (
    <div className="form-summary">
      {displaySections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
            {showEditButtons && onEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleEditSection(sectionIndex)}
              >
                Edit
              </Button>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {section.fields.map((fieldName) => {
                // Skip fields that should not be displayed
                if (fieldName === 'agreeToTerms' || fieldName === 'resume') {
                  return null;
                }

                const label = fieldLabels[fieldName] || fieldName;
                const value = formData[fieldName];

                return (
                  <div key={fieldName} className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatValue(fieldName, value)}
                    </dd>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Resume file display */}
      {formData.resume && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Resume</h3>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{formData.resume.name}</p>
                <p className="text-xs text-gray-500">
                  {(formData.resume.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormSummary;