/**
 * Custom hook for resume parsing and form pre-filling
 */
import { useState, useCallback } from 'react';
import { parseResume, mapResumeDataToFormFields } from '../services/resumeService';

/**
 * Hook for parsing resumes and pre-filling form data
 * @returns {Object} - Resume parsing state and methods
 */
const useResumeParser = () => {
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  /**
   * Parse a resume file and extract data
   * @param {File} file - Resume file to parse
   * @returns {Promise<Object>} - Parsed resume data
   */
  const parseResumeFile = useCallback(async (file) => {
    if (!file) {
      setParseError('No file provided');
      return null;
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setParseError('Invalid file type. Please upload a PDF or Word document.');
      return null;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setParseError('File size exceeds 5MB limit.');
      return null;
    }

    try {
      setParsing(true);
      setParseError(null);

      const result = await parseResume(file);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to parse resume');
      }
      
      setParsedData(result.data);
      return result.data;
    } catch (error) {
      console.error('Error parsing resume:', error);
      setParseError(error.message || 'Failed to parse resume');
      return null;
    } finally {
      setParsing(false);
    }
  }, []);

  /**
   * Pre-fill form data with parsed resume data
   * @param {Object} formData - Current form data
   * @param {Object} resumeData - Parsed resume data
   * @returns {Object} - Updated form data
   */
  const preFillFormData = useCallback((formData, resumeData) => {
    if (!resumeData) {
      return formData;
    }

    // Map resume data to form fields
    const mappedData = mapResumeDataToFormFields(resumeData);
    
    // Merge with existing form data, keeping the resume file reference
    return {
      ...mappedData,
      resume: formData.resume
    };
  }, []);

  /**
   * Handle resume file upload and form pre-filling
   * @param {Event} event - File input change event
   * @param {Object} formData - Current form data
   * @param {Function} setFormData - Function to update form data
   * @returns {Promise<void>}
   */
  const handleResumeUpload = useCallback(async (event, formData, setFormData) => {
    const file = event.target.files[0];
    if (!file) return;

    // Update form data with the file
    setFormData({
      ...formData,
      resume: file
    });

    // Parse the resume
    const parsedResumeData = await parseResumeFile(file);
    
    // Pre-fill form if parsing was successful
    if (parsedResumeData) {
      const updatedFormData = preFillFormData(formData, parsedResumeData);
      setFormData(updatedFormData);
    }
  }, [parseResumeFile, preFillFormData]);

  /**
   * Reset the parsing state
   */
  const resetParser = useCallback(() => {
    setParsing(false);
    setParseError(null);
    setParsedData(null);
  }, []);

  return {
    parsing,
    parseError,
    parsedData,
    parseResumeFile,
    preFillFormData,
    handleResumeUpload,
    resetParser
  };
};

export default useResumeParser;