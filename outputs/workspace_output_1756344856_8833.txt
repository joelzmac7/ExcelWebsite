import React, { useState, useRef } from 'react';
import { Button } from '../ui';
import useResumeParser from '../../hooks/useResumeParser';

/**
 * ResumeUpload Component
 * 
 * A component for uploading and parsing resumes
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onChange - Function to update form data
 * @param {Object} props.errors - Form validation errors
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @param {Function} props.onParseComplete - Callback when parsing is complete
 */
const ResumeUpload = ({
  formData,
  onChange,
  errors,
  isSubmitting,
  onParseComplete
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Use the resume parser hook
  const {
    parsing,
    parseError,
    parsedData,
    handleResumeUpload,
    resetParser
  } = useResumeParser();

  // Handle file selection
  const handleFileChange = async (event) => {
    // Simulate upload progress
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    // Process the file
    await handleResumeUpload(event, formData, (newData) => {
      onChange(newData);
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Show preview after a short delay
      setTimeout(() => {
        setShowPreview(true);
        if (onParseComplete) {
          onParseComplete(newData);
        }
      }, 500);
    });
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Create a synthetic event object
      const syntheticEvent = {
        target: {
          files: files
        }
      };
      handleFileChange(syntheticEvent);
    }
  };

  // Handle button click
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  // Handle remove file
  const handleRemoveFile = () => {
    onChange({ ...formData, resume: null });
    resetParser();
    setShowPreview(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get file name and size
  const fileName = formData.resume?.name || '';
  const fileSize = formData.resume ? formatFileSize(formData.resume.size) : '';

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="resume-upload">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx"
        className="hidden"
        disabled={isSubmitting || parsing}
      />

      {/* Upload area */}
      {!formData.resume ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : errors?.resume
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="space-y-2">
            <div className="mx-auto flex justify-center">
              <svg
                className={`h-12 w-12 ${
                  isDragging ? 'text-blue-500' : 'text-gray-400'
                }`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span>Upload your resume</span>
              </label>{' '}
              or drag and drop
            </div>
            <p className="text-xs text-gray-500">PDF or Word up to 5MB</p>
            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleButtonClick}
                disabled={isSubmitting || parsing}
              >
                Select File
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          {/* File preview */}
          <div className="flex items-center justify-between">
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
                <p className="text-sm font-medium text-gray-900">{fileName}</p>
                <p className="text-xs text-gray-500">{fileSize}</p>
              </div>
            </div>
            <div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleRemoveFile}
                disabled={isSubmitting || parsing}
              >
                Remove
              </Button>
            </div>
          </div>

          {/* Upload progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${uploadProgress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-300"
                  ></div>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Parsing status */}
          {parsing && (
            <div className="mt-2 text-sm text-blue-600">
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Parsing resume...
              </div>
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="mt-2 text-sm text-red-600">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 mr-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {parseError}
              </div>
            </div>
          )}

          {/* Parse success */}
          {showPreview && !parsing && !parseError && (
            <div className="mt-2 text-sm text-green-600">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 mr-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Resume parsed successfully! Form fields have been pre-filled.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {errors?.resume && (
        <p className="mt-1 text-sm text-red-600">{errors.resume}</p>
      )}
    </div>
  );
};

export default ResumeUpload;