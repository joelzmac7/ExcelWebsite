import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useAutoSave from '../../hooks/useAutoSave';
import useFormValidation from '../../hooks/useFormValidation';
import useResumeParser from '../../hooks/useResumeParser';
import { Button, Input, Select, TextField, Checkbox } from '../ui';

/**
 * Enhanced Application Form Component
 * 
 * Features:
 * - Multi-step form with progress tracking
 * - Resume parsing and auto-fill
 * - Auto-save functionality
 * - Real-time validation
 * - Mobile-responsive design
 */
const ApplicationForm = ({ job, onSubmit, initialData = {} }) => {
  const router = useRouter();
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
    agreeToTerms: false,
    ...initialData
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Resume parsing hook
  const { 
    parsing, 
    parseError, 
    handleResumeUpload 
  } = useResumeParser();
  
  // Auto-save hook
  const { 
    loadSavedData, 
    clearSavedData 
  } = useAutoSave(formData, `application_form_${job?.id || 'new'}`, 1000);
  
  // Form validation rules
  const validationRules = {
    firstName: { required: true, requiredMessage: 'First name is required' },
    lastName: { required: true, requiredMessage: 'Last name is required' },
    email: { 
      required: true, 
      isEmail: true, 
      requiredMessage: 'Email is required',
      emailMessage: 'Please enter a valid email address'
    },
    phone: { 
      required: true, 
      isPhone: true,
      requiredMessage: 'Phone number is required',
      phoneMessage: 'Please enter a valid phone number'
    },
    agreeToTerms: { 
      custom: (value) => !value ? 'You must agree to the terms and conditions' : ''
    }
  };
  
  // Form validation hook
  const { 
    errors, 
    isValid, 
    touchedFields, 
    touchField, 
    validateForm 
  } = useFormValidation(formData, validationRules);
  
  // Load saved data on initial render
  useEffect(() => {
    const savedData = loadSavedData();
    if (savedData) {
      // Don't restore file objects from localStorage
      const { resume, ...restSavedData } = savedData;
      setFormData(prevData => ({
        ...prevData,
        ...restSavedData
      }));
    }
  }, [loadSavedData]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Mark field as touched for validation
    touchField(name);
  };
  
  // Handle file upload with resume parsing
  const handleFileUpload = async (e) => {
    await handleResumeUpload(e, formData, setFormData);
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
    
    // Validate all fields
    const isFormValid = validateForm();
    if (!isFormValid) {
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
      // Submit the form
      await onSubmit(formData);
      
      // Clear saved data on successful submission
      clearSavedData();
      
      // Scroll to top
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitError(error.message || 'Failed to submit application. Please try again later.');
      
      // Scroll to error message
      const errorElement = document.getElementById('submit-error');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle step navigation
  const nextStep = () => {
    // Validate current step
    const isStepValid = validateCurrentStep();
    
    if (isStepValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors).find(field => 
        isFieldInCurrentStep(field) && errors[field]
      );
      
      if (firstErrorField) {
        const errorElement = document.getElementById(firstErrorField);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };
  
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };
  
  // Check if a field belongs to the current step
  const isFieldInCurrentStep = (fieldName) => {
    const step1Fields = ['firstName', 'lastName', 'email', 'phone'];
    const step2Fields = ['resume', 'specialty', 'yearsExperience', 'licenses', 'certifications', 'availability', 'coverLetter'];
    const step3Fields = ['agreeToTerms'];
    
    if (currentStep === 1) return step1Fields.includes(fieldName);
    if (currentStep === 2) return step2Fields.includes(fieldName);
    if (currentStep === 3) return step3Fields.includes(fieldName);
    
    return false;
  };
  
  // Validate current step
  const validateCurrentStep = () => {
    if (currentStep === 1) {
      return !errors.firstName && !errors.lastName && !errors.email && !errors.phone &&
        formData.firstName && formData.lastName && formData.email && formData.phone;
    } else if (currentStep === 2) {
      // Step 2 requires either a resume or specialty
      return formData.resume || formData.specialty;
    }
    
    return true;
  };
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Job summary */}
        {job && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800"
            >
              &larr; Back to job details
            </button>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Apply for {job.title}</h1>
            <p className="text-gray-600">{job.facilityName} - {job.city}, {job.state}</p>
          </div>
        )}
        
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
                    <Input
                      id="firstName"
                      name="firstName"
                      label="First Name *"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      error={touchedFields.firstName && errors.firstName}
                      required
                    />
                  </div>
                  
                  <div>
                    <Input
                      id="lastName"
                      name="lastName"
                      label="Last Name *"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      error={touchedFields.lastName && errors.lastName}
                      required
                    />
                  </div>
                  
                  <div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      label="Email Address *"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={touchedFields.email && errors.email}
                      required
                    />
                  </div>
                  
                  <div>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      label="Phone Number *"
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={touchedFields.phone && errors.phone}
                      required
                    />
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
                    <div className="mt-1 flex items-center">
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
                    
                    {/* Resume parsing status */}
                    {parsing && (
                      <div className="mt-2 flex items-center text-sm text-blue-600">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                        Resume uploaded: {formData.resume.name}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Select
                      id="specialty"
                      name="specialty"
                      label="Specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      options={[
                        { value: '', label: 'Select a specialty' },
                        { value: 'ICU', label: 'ICU' },
                        { value: 'Med/Surg', label: 'Med/Surg' },
                        { value: 'Emergency', label: 'Emergency' },
                        { value: 'Labor & Delivery', label: 'Labor & Delivery' },
                        { value: 'OR', label: 'OR' },
                        { value: 'PACU', label: 'PACU' },
                        { value: 'Telemetry', label: 'Telemetry' },
                        { value: 'Cath Lab', label: 'Cath Lab' },
                        { value: 'Other', label: 'Other' }
                      ]}
                    />
                  </div>
                  
                  <div>
                    <Select
                      id="yearsExperience"
                      name="yearsExperience"
                      label="Years of Experience"
                      value={formData.yearsExperience}
                      onChange={handleInputChange}
                      options={[
                        { value: '', label: 'Select years of experience' },
                        { value: '0-1', label: 'Less than 1 year' },
                        { value: '1-2', label: '1-2 years' },
                        { value: '2-5', label: '2-5 years' },
                        { value: '5-10', label: '5-10 years' },
                        { value: '10+', label: '10+ years' }
                      ]}
                    />
                  </div>
                  
                  {/* Licenses */}
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">
                        Licenses
                      </label>
                      <Button
                        type="button"
                        onClick={addLicense}
                        variant="secondary"
                        size="sm"
                      >
                        Add License
                      </Button>
                    </div>
                    
                    {formData.licenses.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">No licenses added yet.</p>
                    )}
                    
                    {formData.licenses.map((license, index) => (
                      <div key={index} className="mt-2 p-3 border border-gray-200 rounded-md">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-gray-700">License {index + 1}</h4>
                          <Button
                            type="button"
                            onClick={() => removeLicense(index)}
                            variant="danger"
                            size="xs"
                          >
                            Remove
                          </Button>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <Select
                              label="State"
                              value={license.state}
                              onChange={(e) => handleLicenseChange(index, 'state', e.target.value)}
                              options={[
                                { value: '', label: 'Select state' },
                                { value: 'AL', label: 'Alabama' },
                                { value: 'AK', label: 'Alaska' },
                                { value: 'AZ', label: 'Arizona' },
                                // Add all states
                              ]}
                              size="sm"
                            />
                          </div>
                          
                          <div>
                            <Input
                              label="License Number"
                              value={license.licenseNumber}
                              onChange={(e) => handleLicenseChange(index, 'licenseNumber', e.target.value)}
                              size="sm"
                            />
                          </div>
                          
                          <div>
                            <Input
                              type="date"
                              label="Expiration Date"
                              value={license.expirationDate}
                              onChange={(e) => handleLicenseChange(index, 'expirationDate', e.target.value)}
                              size="sm"
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
                      <Button
                        type="button"
                        onClick={addCertification}
                        variant="secondary"
                        size="sm"
                      >
                        Add Certification
                      </Button>
                    </div>
                    
                    {formData.certifications.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">No certifications added yet.</p>
                    )}
                    
                    {formData.certifications.map((certification, index) => (
                      <div key={index} className="mt-2 p-3 border border-gray-200 rounded-md">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-gray-700">Certification {index + 1}</h4>
                          <Button
                            type="button"
                            onClick={() => removeCertification(index)}
                            variant="danger"
                            size="xs"
                          >
                            Remove
                          </Button>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <Input
                              label="Name"
                              value={certification.name}
                              onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                              placeholder="e.g., BLS, ACLS"
                              size="sm"
                            />
                          </div>
                          
                          <div>
                            <Input
                              label="Issuing Organization"
                              value={certification.issuingOrganization}
                              onChange={(e) => handleCertificationChange(index, 'issuingOrganization', e.target.value)}
                              size="sm"
                            />
                          </div>
                          
                          <div>
                            <Input
                              type="date"
                              label="Expiration Date"
                              value={certification.expirationDate}
                              onChange={(e) => handleCertificationChange(index, 'expirationDate', e.target.value)}
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <Select
                      id="availability"
                      name="availability"
                      label="Availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      options={[
                        { value: '', label: 'Select availability' },
                        { value: 'immediately', label: 'Immediately' },
                        { value: '2_weeks', label: 'Within 2 weeks' },
                        { value: '1_month', label: 'Within 1 month' },
                        { value: '2_months', label: 'Within 2 months' },
                        { value: 'flexible', label: 'Flexible' }
                      ]}
                    />
                  </div>
                  
                  <div>
                    <TextField
                      id="coverLetter"
                      name="coverLetter"
                      label="Cover Letter / Additional Information"
                      value={formData.coverLetter}
                      onChange={handleInputChange}
                      rows={4}
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
                            {formData.resume ? formData.resume.name : 'Not provided'}
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
                  {job && (
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
                  )}
                  
                  {/* Terms and Conditions */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <Checkbox
                        id="agreeToTerms"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                        I agree to the terms and conditions
                      </label>
                      <p className="text-gray-500">
                        By submitting this application, I certify that all information provided is true and complete to the best of my knowledge.
                      </p>
                      {touchedFields.agreeToTerms && errors.agreeToTerms && (
                        <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Submit Error */}
                  {submitError && (
                    <div id="submit-error" className="bg-red-50 border-l-4 border-red-400 p-4">
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
              <Button
                type="button"
                onClick={prevStep}
                variant="secondary"
              >
                Previous
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!validateCurrentStep()}
                className="ml-auto"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={submitting || !formData.agreeToTerms}
                className="ml-auto"
                loading={submitting}
                loadingText="Submitting..."
              >
                Submit Application
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;