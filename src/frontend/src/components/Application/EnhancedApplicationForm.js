import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useAutoSave from '../../hooks/useAutoSave';
import useFormValidation from '../../hooks/useFormValidation';
import { MultiStepForm, FormStep, FormField, FormFieldGroup, ResumeUpload, FormSummary, SuccessScreen } from './';
import { Button, Input, Select, TextField, Checkbox } from '../ui';

/**
 * EnhancedApplicationForm Component
 * 
 * A streamlined 2-click application form for healthcare professionals
 * 
 * @param {Object} props - Component props
 * @param {Object} props.job - Job data
 * @param {Function} props.onSubmit - Function called when form is submitted
 * @param {Object} props.initialData - Initial form data
 * @param {Function} props.onCancel - Function called when form is cancelled
 */
const EnhancedApplicationForm = ({ 
  job, 
  onSubmit, 
  initialData = {},
  onCancel
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    resume: null,
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [application, setApplication] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);

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
    resume: { required: true, requiredMessage: 'Please upload your resume' },
    specialty: { required: true, requiredMessage: 'Specialty is required' },
    agreeToTerms: { 
      custom: (value) => !value ? 'You must agree to the terms and conditions' : ''
    }
  };
  
  // Form validation hook
  const { 
    errors, 
    isValid, 
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
  };

  // Handle form data changes from child components
  const handleFormDataChange = (newData) => {
    setFormData({
      ...formData,
      ...newData
    });
  };
  
  // Handle resume upload completion
  const handleResumeParseComplete = (updatedData) => {
    setFormData(updatedData);
  };
  
  // Handle form submission
  const handleSubmit = async (data) => {
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      // Submit the form data
      const result = await onSubmit(data);
      
      // Clear saved data
      clearSavedData();
      
      // Set application data
      setApplication(result);
      
      // Set related jobs (mock data for now)
      setRelatedJobs([
        {
          id: '1',
          title: 'ICU Nurse - Similar Position',
          facility: 'Memorial Hospital',
          location: 'San Francisco, CA',
          specialty: 'ICU',
          jobType: 'Travel'
        },
        {
          id: '2',
          title: 'Critical Care RN',
          facility: 'City Medical Center',
          location: 'Oakland, CA',
          specialty: 'Critical Care',
          jobType: 'Travel'
        }
      ]);
      
      // Show success screen
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle view application
  const handleViewApplication = () => {
    router.push(`/applications/${application.id}`);
  };
  
  // Handle browse jobs
  const handleBrowseJobs = () => {
    router.push('/jobs');
  };

  // If form is submitted, show success screen
  if (isSubmitted) {
    return (
      <SuccessScreen
        job={job}
        application={application}
        relatedJobs={relatedJobs}
        onViewApplication={handleViewApplication}
        onBrowseJobs={handleBrowseJobs}
      />
    );
  }

  // Field labels for summary
  const fieldLabels = {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    specialty: 'Specialty',
    yearsExperience: 'Years of Experience',
    licenses: 'Licenses',
    certifications: 'Certifications',
    availability: 'Availability',
    referralSource: 'Referral Source'
  };

  // Summary sections
  const summarySections = [
    {
      title: 'Personal Information',
      fields: ['firstName', 'lastName', 'email', 'phone']
    },
    {
      title: 'Professional Information',
      fields: ['specialty', 'yearsExperience', 'licenses', 'certifications']
    },
    {
      title: 'Additional Information',
      fields: ['availability', 'referralSource']
    }
  ];

  // Validate step 1
  const validateStep1 = (data) => {
    const stepErrors = {};
    
    if (!data.resume) {
      stepErrors.resume = 'Please upload your resume';
    }
    
    return stepErrors;
  };
  
  // Validate step 2
  const validateStep2 = (data) => {
    const stepErrors = {};
    
    if (!data.firstName) {
      stepErrors.firstName = 'First name is required';
    }
    
    if (!data.lastName) {
      stepErrors.lastName = 'Last name is required';
    }
    
    if (!data.email) {
      stepErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(data.email)) {
        stepErrors.email = 'Please enter a valid email address';
      }
    }
    
    if (!data.phone) {
      stepErrors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^(\+\d{1,2}\s?)?(\(\d{3}\)|\d{3})[.\s-]?\d{3}[.\s-]?\d{4}$/;
      if (!phoneRegex.test(data.phone)) {
        stepErrors.phone = 'Please enter a valid phone number';
      }
    }
    
    if (!data.specialty) {
      stepErrors.specialty = 'Specialty is required';
    }
    
    return stepErrors;
  };
  
  // Validate step 3
  const validateStep3 = (data) => {
    const stepErrors = {};
    
    if (!data.agreeToTerms) {
      stepErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    return stepErrors;
  };

  // Specialty options
  const specialtyOptions = [
    { value: '', label: 'Select a specialty' },
    { value: 'ICU', label: 'ICU' },
    { value: 'ER', label: 'Emergency Room' },
    { value: 'MedSurg', label: 'Medical-Surgical' },
    { value: 'OR', label: 'Operating Room' },
    { value: 'PICU', label: 'Pediatric ICU' },
    { value: 'L&D', label: 'Labor & Delivery' },
    { value: 'NICU', label: 'Neonatal ICU' },
    { value: 'Telemetry', label: 'Telemetry' },
    { value: 'Oncology', label: 'Oncology' },
    { value: 'Psychiatric', label: 'Psychiatric' }
  ];

  // Experience options
  const experienceOptions = [
    { value: '', label: 'Select years of experience' },
    { value: '<1', label: 'Less than 1 year' },
    { value: '1-2', label: '1-2 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '6-10', label: '6-10 years' },
    { value: '>10', label: 'More than 10 years' }
  ];

  // Availability options
  const availabilityOptions = [
    { value: '', label: 'Select availability' },
    { value: 'immediate', label: 'Immediate' },
    { value: '2weeks', label: '2 weeks' },
    { value: '1month', label: '1 month' },
    { value: '2months', label: '2 months' },
    { value: '3months', label: '3+ months' }
  ];

  // Referral source options
  const referralSourceOptions = [
    { value: '', label: 'How did you hear about us?' },
    { value: 'search', label: 'Search Engine' },
    { value: 'social', label: 'Social Media' },
    { value: 'friend', label: 'Friend or Colleague' },
    { value: 'job_board', label: 'Job Board' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="enhanced-application-form">
      {/* Job Header */}
      {job && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
          <div className="mt-1 text-gray-600">
            {job.facility || job.location}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {job.specialty && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {job.specialty}
              </span>
            )}
            {job.jobType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {job.jobType}
              </span>
            )}
            {job.shift && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {job.shift}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 text-red-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Step Form */}
      <MultiStepForm
        onSubmit={handleSubmit}
        onCancel={onCancel}
        initialData={formData}
        formId={`application_form_${job?.id || 'new'}`}
      >
        {/* Step 1: Resume Upload */}
        <FormStep
          title="Upload Your Resume"
          description="Start by uploading your resume. We'll use it to pre-fill your application."
          validate={validateStep1}
        >
          <FormFieldGroup
            title="Resume Upload"
            description="Upload your resume in PDF or Word format. Maximum file size is 5MB."
            required={true}
          >
            <ResumeUpload
              formData={formData}
              onChange={handleFormDataChange}
              errors={errors}
              onParseComplete={handleResumeParseComplete}
            />
          </FormFieldGroup>
        </FormStep>

        {/* Step 2: Personal & Professional Information */}
        <FormStep
          title="Your Information"
          description="Tell us about yourself and your professional background."
          validate={validateStep2}
        >
          <FormFieldGroup
            title="Personal Information"
            required={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="First Name"
                name="firstName"
                required={true}
                error={errors.firstName}
              >
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                />
              </FormField>

              <FormField
                label="Last Name"
                name="lastName"
                required={true}
                error={errors.lastName}
              >
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Email Address"
                name="email"
                required={true}
                error={errors.email}
              >
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                />
              </FormField>

              <FormField
                label="Phone Number"
                name="phone"
                required={true}
                error={errors.phone}
              >
                <Input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </FormField>
            </div>
          </FormFieldGroup>

          <FormFieldGroup
            title="Professional Information"
            required={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Specialty"
                name="specialty"
                required={true}
                error={errors.specialty}
              >
                <Select
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleInputChange}
                  options={specialtyOptions}
                />
              </FormField>

              <FormField
                label="Years of Experience"
                name="yearsExperience"
                error={errors.yearsExperience}
              >
                <Select
                  name="yearsExperience"
                  value={formData.yearsExperience}
                  onChange={handleInputChange}
                  options={experienceOptions}
                />
              </FormField>
            </div>
          </FormFieldGroup>

          <FormFieldGroup
            title="Additional Information"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Availability"
                name="availability"
                error={errors.availability}
              >
                <Select
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  options={availabilityOptions}
                />
              </FormField>

              <FormField
                label="Referral Source"
                name="referralSource"
                error={errors.referralSource}
              >
                <Select
                  name="referralSource"
                  value={formData.referralSource}
                  onChange={handleInputChange}
                  options={referralSourceOptions}
                />
              </FormField>
            </div>
          </FormFieldGroup>
        </FormStep>

        {/* Step 3: Review & Submit */}
        <FormStep
          title="Review & Submit"
          description="Please review your information before submitting your application."
          validate={validateStep3}
        >
          <FormSummary
            formData={formData}
            fieldLabels={fieldLabels}
            sections={summarySections}
          />

          <FormFieldGroup>
            <FormField
              name="agreeToTerms"
              error={errors.agreeToTerms}
            >
              <Checkbox
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                label={
                  <span>
                    I agree to the{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Privacy Policy
                    </a>
                  </span>
                }
              />
            </FormField>
          </FormFieldGroup>
        </FormStep>
      </MultiStepForm>
    </div>
  );
};

export default EnhancedApplicationForm;