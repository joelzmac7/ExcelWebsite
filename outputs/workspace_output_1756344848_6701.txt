import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import useAutoSave from '../../../hooks/useAutoSave';
import useFormValidation from '../../../hooks/useFormValidation';
import useResumeParser from '../../../hooks/useResumeParser';
import { mapResumeDataToFormFields } from '../../../services/resumeService';

const JobApplicationPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    resume: null,
    coverLetter: '',
    specialty: '',
    yearsExperience: '',
    licenses: [],
    certifications: [],
    availability: '',
    referralSource: '',
    agreeToTerms: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');
  
  // Resume parsing hook
  const { parsing, parseError, parsedData, parseResumeFile } = useResumeParser();
  
  // Auto-save hook
  const { loadSavedData, clearSavedData } = useAutoSave(formData, `job-application-${id}`, 2000);
  
  // Form validation rules
  const validationRules = {
    firstName: { required: true, requiredMessage: 'First name is required' },
    lastName: { required: true, requiredMessage: 'Last name is required' },
    email: { 
      required: true, 
      requiredMessage: 'Email is required',
      isEmail: true,
      emailMessage: 'Please enter a valid email address'
    },
    phone: { 
      required: true, 
      requiredMessage: 'Phone number is required',
      isPhone: true,
      phoneMessage: 'Please enter a valid phone number'
    },
    agreeToTerms: { 
      custom: (value) => !value ? 'You must agree to the terms and conditions' : ''
    }
  };
  
  // Form validation hook
  const { errors, isValid, touchedFields, touchField, validateForm } = useFormValidation(formData, validationRules);
  
  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${id}`);
        setJob(response.data.data);
      } catch (error) {
        console.error('Error fetching job details:', error);
        setError('Failed to load job details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobDetails();
  }, [id]);
  
  // Load saved form data
  useEffect(() => {
    if (id) {
      const savedData = loadSavedData();
      if (savedData) {
        setFormData(prevData => ({
          ...prevData,
          ...savedData,
          // Don't restore file objects from localStorage
          resume: prevData.resume
        }));
        
        // If there's saved data, show a notification
        if (Object.keys(savedData).length > 0) {
          // You could show a toast notification here
          console.log('Restored saved application data');
        }
      }
    }
  }, [id, loadSavedData]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Mark field as touched for validation
    touchField(name);
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setResumeFile(file);
    setResumeFileName(file.name);
    
    setFormData({
      ...formData,
      resume: file
    });
    
    // Parse resume if file is selected
    try {
      const parsedResumeData = await parseResumeFile(file);
      
      if (parsedResumeData) {
        // Map parsed data to form fields
        const mappedData = mapResumeDataToFormFields(parsedResumeData);
        
        // Update form with parsed data, but don't overwrite existing values
        setFormData(prevData => {
          const newData = { ...prevData };
          
          // Only update empty fields or fields that haven't been manually edited
          Object.keys(mappedData).forEach(key => {
            if (
              key !== 'resume' && 
              (!prevData[key] || 
               (Array.isArray(prevData[key]) && prevData[key].length === 0) ||
               prevData[key] === '')
            ) {
              newData[key] = mappedData[key];
            }
          });
          
          return {
            ...newData,
            resume: file
          };
        });
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
      // Show error but don't prevent file upload
    }
  };
  
  // Handle license input
  const handleLicenseChange = (index, field, value) => {
    const updatedLicenses = [...formData.licenses];
    updatedLicenses[index] = {
      ...updatedLicenses[index],
      [field]: value
    };
    setFormData({
      ...formData,
      licenses: updatedLicenses
    });
  };
  
  // Add new license field
  const addLicense = () => {
    setFormData({
      ...formData,
      licenses: [
        ...formData.licenses,
        { state: '', licenseNumber: '', expirationDate: '' }
      ]
    });
  };
  
  // Remove license field
  const removeLicense = (index) => {
    const updatedLicenses = [...formData.licenses];
    updatedLicenses.splice(index, 1);
    setFormData({
      ...formData,
      licenses: updatedLicenses
    });
  };
  
  // Handle certification input
  const handleCertificationChange = (index, field, value) => {
    const updatedCertifications = [...formData.certifications];
    updatedCertifications[index] = {
      ...updatedCertifications[index],
      [field]: value
    };
    setFormData({
      ...formData,
      certifications: updatedCertifications
    });
  };
  
  // Add new certification field
  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [
        ...formData.certifications,
        { name: '', issuingOrganization: '', expirationDate: '' }
      ]
    });
  };
  
  // Remove certification field
  const removeCertification = (index) => {
    const updatedCertifications = [...formData.certifications];
    updatedCertifications.splice(index, 1);
    setFormData({
      ...formData,
      certifications: updatedCertifications
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formIsValid = validateForm();
    if (!formIsValid) {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      // Create form data for file upload
      const submitData = new FormData();
      
      // Add basic form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'resume' && key !== 'licenses' && key !== 'certifications') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Add resume file if provided
      if (formData.resume) {
        submitData.append('resume', formData.resume);
      }
      
      // Add licenses and certifications as JSON strings
      submitData.append('licenses', JSON.stringify(formData.licenses));
      submitData.append('certifications', JSON.stringify(formData.certifications));
      
      // Add job ID
      submitData.append('jobId', id);
      
      // Submit application
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/applications`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Show success message
      setSubmitSuccess(true);
      
      // Clear saved form data
      clearSavedData();
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        resume: null,
        coverLetter: '',
        specialty: '',
        yearsExperience: '',
        licenses: [],
        certifications: [],
        availability: '',
        referralSource: '',
        agreeToTerms: false
      });
      
      // Scroll to top
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitError('Failed to submit application. Please try again later.');
      
      // Scroll to error message
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle step navigation
  const nextStep = () => {
    // Validate current step before proceeding
    const isStepValid = validateStep();
    if (!isStepValid) return;
    
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };
  
  // Validate current step
  const validateStep = () => {
    if (currentStep === 1) {
      // Check if required fields are filled
      const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
      const hasErrors = requiredFields.some(field => !!errors[field]);
      
      // Touch all fields to show validation errors
      requiredFields.forEach(field => touchField(field));
      
      return !hasErrors && requiredFields.every(field => !!formData[field]);
    } else if (currentStep === 2) {
      // For step 2, either resume or specialty is required
      return formData.resume || formData.specialty;
    }
    return true;
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <Link href="/jobs/search">
          <a className="text-blue-600 hover:text-blue-800">
            &larr; Back to job search
          </a>
        </Link>
      </div>
    );
  }
  
  // Job not found state
  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Job not found. It may have been filled or removed.
              </p>
            </div>
          </div>
        </div>
        <Link href="/jobs/search">
          <a className="text-blue-600 hover:text-blue-800">
            &larr; Back to job search
          </a>
        </Link>
      </div>
    );
  }
  
  // Success state
  if (submitSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-medium text-gray-900">Application Submitted Successfully!</h2>
          <p className="mt-2 text-sm text-gray-500">
            Thank you for applying to {job.title} at {job.facilityName}. We've received your application and will review it shortly.
          </p>
          <div className="mt-6">
            <Link href="/jobs/search">
              <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Browse More Jobs
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Apply for {job.title} in {job.city}, {job.state} | Excel Medical Staffing</title>
        <meta name="description" content={`Apply for ${job.title} position at ${job.facilityName} in ${job.city}, ${job.state}. Quick and easy application process.`} />
      </Head>
      
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Job summary */}
          <div className="mb-6">
            <Link href={`/jobs/${id}`}>
              <a className="text-blue-600 hover:text-blue-800">
                &larr; Back to job details
              </a>
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Apply for {job.title}</h1>
            <p className="text-gray-600">{job.facilityName} - {job.city}, {job.state}</p>
          </div>
          
          {/* Application progress */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <div className="text-center">Personal Info</div>
              <div className="text-center">Professional Details</div>
              <div className="text-center">Review & Submit</div>
            </div>
          </div>
          
          {/* Auto-save indicator */}
          <div className="mb-4 text-sm text-gray-500 flex items-center">
            <svg className="h-4 w-4 mr-1 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Your progress is automatically saved</span>
          </div>
          
          {/* Application form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className={`mt-1 block w-full border ${errors.firstName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      />
                      {errors.firstName && touchedFields.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className={`mt-1 block w-full border ${errors.lastName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      />
                      {errors.lastName && touchedFields.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={`mt-1 block w-full border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      />
                      {errors.email && touchedFields.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className={`mt-1 block w-full border ${errors.phone ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      />
                      {errors.phone && touchedFields.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {/* Step 2: Professional Information */}
              {currentStep === 2 && (
                <>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
                        Resume/CV
                      </label>
                      <div className="mt-1">
                        <div className="flex items-center">
                          <input
                            type="file"
                            name="resume"
                            id="resume"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Accepted formats: PDF, DOC, DOCX. Maximum size: 5MB.
                        </p>
                        {resumeFileName && (
                          <div className="mt-2 flex items-center text-sm text-gray-700">
                            <svg className="h-4 w-4 mr-1 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{resumeFileName}</span>
                          </div>
                        )}
                        {parsing && (
                          <div className="mt-2 flex items-center text-sm text-blue-700">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Parsing resume...</span>
                          </div>
                        )}
                        {parseError && (
                          <p className="mt-1 text-sm text-red-600">{parseError}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                        Specialty
                      </label>
                      <select
                        id="specialty"
                        name="specialty"
                        value={formData.specialty}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select a specialty</option>
                        <option value="ICU">ICU</option>
                        <option value="Med/Surg">Med/Surg</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Labor & Delivery">Labor & Delivery</option>
                        <option value="OR">OR</option>
                        <option value="PACU">PACU</option>
                        <option value="Telemetry">Telemetry</option>
                        <option value="Cath Lab">Cath Lab</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700">
                        Years of Experience
                      </label>
                      <select
                        id="yearsExperience"
                        name="yearsExperience"
                        value={formData.yearsExperience}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select years of experience</option>
                        <option value="0-1">Less than 1 year</option>
                        <option value="1-2">1-2 years</option>
                        <option value="2-5">2-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value="10+">10+ years</option>
                      </select>
                    </div>
                    
                    {/* Licenses */}
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">
                          Licenses
                        </label>
                        <button
                          type="button"
                          onClick={addLicense}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Add License
                        </button>
                      </div>
                      
                      {formData.licenses.length === 0 && (
                        <p className="mt-1 text-sm text-gray-500">No licenses added yet.</p>
                      )}
                      
                      {formData.licenses.map((license, index) => (
                        <div key={index} className="mt-2 p-3 border border-gray-200 rounded-md">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-gray-700">License {index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeLicense(index)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">
                                State
                              </label>
                              <select
                                value={license.state}
                                onChange={(e) => handleLicenseChange(index, 'state', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                              >
                                <option value="">Select state</option>
                                <option value="AL">Alabama</option>
                                <option value="AK">Alaska</option>
                                <option value="AZ">Arizona</option>
                                <option value="AR">Arkansas</option>
                                <option value="CA">California</option>
                                <option value="CO">Colorado</option>
                                <option value="CT">Connecticut</option>
                                <option value="DE">Delaware</option>
                                <option value="FL">Florida</option>
                                <option value="GA">Georgia</option>
                                <option value="HI">Hawaii</option>
                                <option value="ID">Idaho</option>
                                <option value="IL">Illinois</option>
                                <option value="IN">Indiana</option>
                                <option value="IA">Iowa</option>
                                <option value="KS">Kansas</option>
                                <option value="KY">Kentucky</option>
                                <option value="LA">Louisiana</option>
                                <option value="ME">Maine</option>
                                <option value="MD">Maryland</option>
                                <option value="MA">Massachusetts</option>
                                <option value="MI">Michigan</option>
                                <option value="MN">Minnesota</option>
                                <option value="MS">Mississippi</option>
                                <option value="MO">Missouri</option>
                                <option value="MT">Montana</option>
                                <option value="NE">Nebraska</option>
                                <option value="NV">Nevada</option>
                                <option value="NH">New Hampshire</option>
                                <option value="NJ">New Jersey</option>
                                <option value="NM">New Mexico</option>
                                <option value="NY">New York</option>
                                <option value="NC">North Carolina</option>
                                <option value="ND">North Dakota</option>
                                <option value="OH">Ohio</option>
                                <option value="OK">Oklahoma</option>
                                <option value="OR">Oregon</option>
                                <option value="PA">Pennsylvania</option>
                                <option value="RI">Rhode Island</option>
                                <option value="SC">South Carolina</option>
                                <option value="SD">South Dakota</option>
                                <option value="TN">Tennessee</option>
                                <option value="TX">Texas</option>
                                <option value="UT">Utah</option>
                                <option value="VT">Vermont</option>
                                <option value="VA">Virginia</option>
                                <option value="WA">Washington</option>
                                <option value="WV">West Virginia</option>
                                <option value="WI">Wisconsin</option>
                                <option value="WY">Wyoming</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700">
                                License Number
                              </label>
                              <input
                                type="text"
                                value={license.licenseNumber}
                                onChange={(e) => handleLicenseChange(index, 'licenseNumber', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700">
                                Expiration Date
                              </label>
                              <input
                                type="date"
                                value={license.expirationDate}
                                onChange={(e) => handleLicenseChange(index, 'expirationDate', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Certifications */}
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">
                          Certifications
                        </label>
                        <button
                          type="button"
                          onClick={addCertification}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Add Certification
                        </button>
                      </div>
                      
                      {formData.certifications.length === 0 && (
                        <p className="mt-1 text-sm text-gray-500">No certifications added yet.</p>
                      )}
                      
                      {formData.certifications.map((certification, index) => (
                        <div key={index} className="mt-2 p-3 border border-gray-200 rounded-md">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-gray-700">Certification {index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeCertification(index)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">
                                Name
                              </label>
                              <input
                                type="text"
                                value={certification.name}
                                onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                                placeholder="e.g., BLS, ACLS"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700">
                                Issuing Organization
                              </label>
                              <input
                                type="text"
                                value={certification.issuingOrganization}
                                onChange={(e) => handleCertificationChange(index, 'issuingOrganization', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700">
                                Expiration Date
                              </label>
                              <input
                                type="date"
                                value={certification.expirationDate}
                                onChange={(e) => handleCertificationChange(index, 'expirationDate', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                        Availability
                      </label>
                      <select
                        id="availability"
                        name="availability"
                        value={formData.availability}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select availability</option>
                        <option value="immediately">Immediately</option>
                        <option value="2_weeks">Within 2 weeks</option>
                        <option value="1_month">Within 1 month</option>
                        <option value="2_months">Within 2 months</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
                        Cover Letter / Additional Information
                      </label>
                      <textarea
                        id="coverLetter"
                        name="coverLetter"
                        rows={4}
                        value={formData.coverLetter}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Tell us why you're interested in this position and any additional information you'd like to share."
                      />
                    </div>
                  </div>
                </>
              )}
              
              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Review & Submit</h2>
                  
                  <div className="space-y-6">
                    {/* Personal Information Review */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Personal Information</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Name</dt>
                            <dd className="text-sm text-gray-900">{formData.firstName} {formData.lastName}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Email</dt>
                            <dd className="text-sm text-gray-900">{formData.email}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Phone</dt>
                            <dd className="text-sm text-gray-900">{formData.phone}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    
                    {/* Professional Information Review */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Professional Information</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Resume</dt>
                            <dd className="text-sm text-gray-900">
                              {resumeFileName || 'Not provided'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Specialty</dt>
                            <dd className="text-sm text-gray-900">{formData.specialty || 'Not specified'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Years of Experience</dt>
                            <dd className="text-sm text-gray-900">{formData.yearsExperience || 'Not specified'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Availability</dt>
                            <dd className="text-sm text-gray-900">{formData.availability || 'Not specified'}</dd>
                          </div>
                        </dl>
                        
                        {/* Licenses */}
                        <div className="mt-4">
                          <dt className="text-xs font-medium text-gray-500">Licenses</dt>
                          {formData.licenses.length === 0 ? (
                            <dd className="text-sm text-gray-900">None provided</dd>
                          ) : (
                            <ul className="mt-1 divide-y divide-gray-200">
                              {formData.licenses.map((license, index) => (
                                <li key={index} className="py-1">
                                  <span className="text-sm text-gray-900">
                                    {license.state} - {license.licenseNumber}
                                    {license.expirationDate && ` (Expires: ${license.expirationDate})`}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        
                        {/* Certifications */}
                        <div className="mt-4">
                          <dt className="text-xs font-medium text-gray-500">Certifications</dt>
                          {formData.certifications.length === 0 ? (
                            <dd className="text-sm text-gray-900">None provided</dd>
                          ) : (
                            <ul className="mt-1 divide-y divide-gray-200">
                              {formData.certifications.map((cert, index) => (
                                <li key={index} className="py-1">
                                  <span className="text-sm text-gray-900">
                                    {cert.name} - {cert.issuingOrganization}
                                    {cert.expirationDate && ` (Expires: ${cert.expirationDate})`}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        
                        {/* Cover Letter */}
                        {formData.coverLetter && (
                          <div className="mt-4">
                            <dt className="text-xs font-medium text-gray-500">Additional Information</dt>
                            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{formData.coverLetter}</dd>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Job Information Review */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Job Information</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Position</dt>
                            <dd className="text-sm text-gray-900">{job.title}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Facility</dt>
                            <dd className="text-sm text-gray-900">{job.facilityName}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Location</dt>
                            <dd className="text-sm text-gray-900">{job.city}, {job.state}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Weekly Pay</dt>
                            <dd className="text-sm text-gray-900">${job.payRate.toLocaleString()}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    
                    {/* Terms and Conditions */}
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="agreeToTerms"
                          name="agreeToTerms"
                          type="checkbox"
                          checked={formData.agreeToTerms}
                          onChange={handleInputChange}
                          required
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                          I agree to the terms and conditions
                        </label>
                        <p className="text-gray-500">
                          By submitting this application, I certify that all information provided is true and complete to the best of my knowledge.
                        </p>
                        {errors.agreeToTerms && touchedFields.agreeToTerms && (
                          <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Submit Error */}
                    {submitError && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{submitError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Previous
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!validateStep()}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    validateStep() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-auto`}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !formData.agreeToTerms}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    submitting || !formData.agreeToTerms ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-auto`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default JobApplicationPage;