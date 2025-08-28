import React from 'react';
import { useResumeParser } from '../../hooks/useResumeParser';

/**
 * Resume upload form with parsing functionality
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data
 * @param {Function} props.setFormData - Function to update form data
 * @returns {JSX.Element} - Resume upload form component
 */
const ResumeUploadForm = ({ formData, setFormData }) => {
  const { 
    parsing, 
    parseError, 
    handleResumeUpload 
  } = useResumeParser();

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
          Resume/CV
        </label>
        <div className="mt-1">
          <input
            type="file"
            name="resume"
            id="resume"
            accept=".pdf,.doc,.docx"
            onChange={(e) => handleResumeUpload(e, formData, setFormData)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Upload your resume to automatically fill out the application form. Accepted formats: PDF, DOC, DOCX. Maximum size: 5MB.
        </p>
        
        {parsing && (
          <div className="mt-2 flex items-center text-sm text-blue-600">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Parsing resume...
          </div>
        )}
        
        {parseError && (
          <div className="mt-2 text-sm text-red-600">
            {parseError}
          </div>
        )}
        
        {formData.resume && !parsing && !parseError && (
          <div className="mt-2 text-sm text-green-600">
            Resume uploaded successfully. Form fields have been pre-filled where possible.
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploadForm;