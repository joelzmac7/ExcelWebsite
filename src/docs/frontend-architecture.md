# Frontend Architecture Specification

## Overview

This document outlines the frontend architecture for the Excel Medical Staffing AI-Powered Healthcare Staffing Platform. The platform is designed with a mobile-first approach, focusing on a streamlined application process and intuitive user experience for healthcare professionals.

## Technology Stack

### Core Technologies
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Redux Toolkit for global state, React Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Next.js App Router
- **API Communication**: Axios with custom request/response interceptors
- **Authentication**: JWT with secure HTTP-only cookies
- **Analytics**: Google Analytics 4, Hotjar, and custom event tracking

### UI Components
- **Component Library**: Custom component library built on Tailwind CSS
- **Design System**: Consistent design tokens for colors, typography, spacing, etc.
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Animation**: Framer Motion for UI animations

### Performance Optimization
- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component with responsive sizing
- **Lazy Loading**: Component and route-based lazy loading
- **Caching Strategy**: SWR for data fetching with caching
- **Bundle Optimization**: Webpack bundle analyzer for optimization

## Architecture Overview

The frontend architecture follows a component-based approach with clear separation of concerns:

### Layer 1: UI Components
- Presentational components that render UI elements
- Stateless whenever possible
- Focused on appearance and user interaction
- Highly reusable across the application

### Layer 2: Container Components
- Connect UI components to data sources
- Handle component-specific state
- Manage user interactions and events
- Coordinate between UI components

### Layer 3: Page Components
- Compose container and UI components into full pages
- Handle page-level state and effects
- Manage routing and navigation
- Implement page-specific logic

### Layer 4: Application Core
- Global state management
- Authentication and authorization
- API communication
- Shared utilities and hooks

### Layer 5: Infrastructure
- Build configuration
- Deployment pipelines
- Performance monitoring
- Error tracking

## Mobile-First Design Approach

The platform is designed with a mobile-first approach, ensuring optimal user experience on smartphones and tablets while scaling up to desktop views.

### Design Principles
1. **Progressive Enhancement**: Start with core functionality for mobile, then enhance for larger screens
2. **Touch-Optimized**: Design for touch interactions first, then add mouse/keyboard support
3. **Responsive Layouts**: Fluid layouts that adapt to different screen sizes
4. **Performance Focus**: Optimize for mobile networks and processors
5. **Simplified Workflows**: Streamlined user journeys with minimal steps

### Responsive Breakpoints
- **Mobile**: 0-639px
- **Tablet**: 640px-1023px
- **Desktop**: 1024px-1279px
- **Large Desktop**: 1280px+

### Mobile Optimization Techniques
- **Critical CSS**: Inline critical CSS for faster initial rendering
- **Optimized Images**: Responsive images with appropriate sizes for each device
- **Touch Targets**: Minimum 44x44px touch targets for interactive elements
- **Reduced Motion**: Respect user preferences for reduced motion
- **Offline Support**: Service worker for basic offline functionality

## 2-Click Application Flow

A key feature of the platform is the streamlined 2-click application process, designed to minimize friction and maximize conversion rates.

### Application Flow Architecture

#### Step 1: Job Discovery
- **Components**: JobSearch, JobFilters, JobCard, JobList
- **State**: Search parameters, filter selections, job results
- **Actions**: Search jobs, apply filters, view job details
- **Optimization**: Infinite scrolling, lazy loading, search caching

#### Step 2: Job Details (First Click)
- **Components**: JobDetails, JobHeader, JobDescription, JobRequirements, ApplyButton
- **State**: Job details, user authentication status, application eligibility
- **Actions**: View job details, save job, share job, click apply
- **Optimization**: Preload application form, check eligibility in background

#### Step 3: Application Submission (Second Click)
- **Components**: ApplicationForm, ResumeUpload, ProfileCompletion, SubmitButton
- **State**: User profile data, resume data, application progress
- **Actions**: Auto-fill form from profile, upload/select resume, submit application
- **Optimization**: Progressive form loading, background validation, optimistic UI updates

### Application State Management

```javascript
// src/store/slices/applicationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentJob: null,
  applicationStep: 'job-details', // 'job-details', 'form', 'confirmation'
  formData: {
    resumeId: null,
    coverLetter: '',
    availability: null,
    referralSource: null
  },
  progress: 0,
  errors: {},
  isSubmitting: false,
  submissionResult: null
};

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setCurrentJob: (state, action) => {
      state.currentJob = action.payload;
    },
    setApplicationStep: (state, action) => {
      state.applicationStep = action.payload;
    },
    updateFormField: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;
      
      // Calculate progress based on completed fields
      const totalFields = Object.keys(state.formData).length;
      const completedFields = Object.values(state.formData).filter(val => val !== null && val !== '').length;
      state.progress = Math.round((completedFields / totalFields) * 100);
    },
    setFormError: (state, action) => {
      const { field, error } = action.payload;
      state.errors[field] = error;
    },
    clearFormErrors: (state) => {
      state.errors = {};
    },
    startSubmission: (state) => {
      state.isSubmitting = true;
      state.submissionResult = null;
    },
    submissionSuccess: (state, action) => {
      state.isSubmitting = false;
      state.submissionResult = {
        success: true,
        applicationId: action.payload.applicationId
      };
      state.applicationStep = 'confirmation';
    },
    submissionFailure: (state, action) => {
      state.isSubmitting = false;
      state.submissionResult = {
        success: false,
        error: action.payload.error
      };
    },
    resetApplication: (state) => {
      return initialState;
    }
  }
});

export const {
  setCurrentJob,
  setApplicationStep,
  updateFormField,
  setFormError,
  clearFormErrors,
  startSubmission,
  submissionSuccess,
  submissionFailure,
  resetApplication
} = applicationSlice.actions;

export default applicationSlice.reducer;
```

### Application Form Component

```jsx
// src/components/application/ApplicationForm.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  updateFormField, 
  setFormError, 
  clearFormErrors,
  startSubmission,
  submissionSuccess,
  submissionFailure
} from '@/store/slices/applicationSlice';
import { useSubmitApplication } from '@/hooks/useApplications';
import ResumeSelector from './ResumeSelector';
import FormField from '../common/FormField';
import Button from '../common/Button';
import ProgressBar from '../common/ProgressBar';

// Form validation schema
const applicationSchema = z.object({
  resumeId: z.string().min(1, 'Please select or upload a resume'),
  coverLetter: z.string().optional(),
  availability: z.date().min(new Date(), 'Start date must be in the future'),
  referralSource: z.string().optional()
});

const ApplicationForm = () => {
  const dispatch = useDispatch();
  const { currentJob, formData, progress, errors, isSubmitting } = useSelector(state => state.application);
  const { user, resumes } = useSelector(state => state.user);
  const submitApplication = useSubmitApplication();
  
  const { register, handleSubmit, formState, setValue, watch } = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues: formData
  });
  
  // Watch form values to update progress
  const watchedValues = watch();
  
  useEffect(() => {
    // Update form data in Redux store when form values change
    Object.entries(watchedValues).forEach(([field, value]) => {
      if (value !== formData[field]) {
        dispatch(updateFormField({ field, value }));
      }
    });
  }, [watchedValues, dispatch, formData]);
  
  // Handle form submission
  const onSubmit = async (data) => {
    dispatch(clearFormErrors());
    dispatch(startSubmission());
    
    try {
      const result = await submitApplication({
        jobId: currentJob.id,
        ...data
      });
      
      dispatch(submissionSuccess({
        applicationId: result.applicationId
      }));
    } catch (error) {
      dispatch(submissionFailure({
        error: error.message || 'Failed to submit application'
      }));
      
      // Map API errors to form fields
      if (error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          dispatch(setFormError({ field, error: message }));
        });
      }
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-xl font-bold mb-4">Apply for {currentJob?.title}</h2>
      <ProgressBar 
        progress={progress} 
        className="mb-6" 
      />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ResumeSelector 
          resumes={resumes}
          selectedResumeId={formData.resumeId}
          onSelect={(resumeId) => setValue('resumeId', resumeId)}
          error={errors.resumeId}
        />
        
        <FormField
          label="When can you start?"
          error={errors.availability}
        >
          <input
            type="date"
            className="form-input w-full"
            min={new Date().toISOString().split('T')[0]}
            {...register('availability')}
          />
        </FormField>
        
        <FormField
          label="Cover Letter (Optional)"
          error={errors.coverLetter}
        >
          <textarea
            className="form-textarea w-full h-32"
            placeholder="Add any additional information you'd like the recruiter to know..."
            {...register('coverLetter')}
          />
        </FormField>
        
        <FormField
          label="How did you hear about us? (Optional)"
          error={errors.referralSource}
        >
          <select
            className="form-select w-full"
            {...register('referralSource')}
          >
            <option value="">Select an option</option>
            <option value="search">Search Engine</option>
            <option value="social">Social Media</option>
            <option value="friend">Friend or Colleague</option>
            <option value="recruiter">Recruiter</option>
            <option value="other">Other</option>
          </select>
        </FormField>
        
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
          >
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;
```

### Resume Parsing Integration

```jsx
// src/components/application/ResumeUploader.jsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import { updateFormField } from '@/store/slices/applicationSlice';
import { useUploadResume } from '@/hooks/useResumes';
import Button from '../common/Button';
import Icon from '../common/Icon';
import Spinner from '../common/Spinner';

const ResumeUploader = ({ onUploadComplete }) => {
  const dispatch = useDispatch();
  const uploadResume = useUploadResume();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    onDrop: handleFileDrop,
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError('File is too large. Maximum size is 5MB.');
      } else {
        setError('Invalid file. Please upload a PDF, DOC, DOCX, or TXT file.');
      }
    }
  });
  
  async function handleFileDrop(acceptedFiles) {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('resume', file);
      
      // Upload resume with progress tracking
      const resumeData = await uploadResume(formData, (progress) => {
        setUploadProgress(progress);
      });
      
      // Update form with resume ID
      dispatch(updateFormField({ 
        field: 'resumeId', 
        value: resumeData.id 
      }));
      
      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete(resumeData);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  }
  
  return (
    <div className="w-full">
      {uploading ? (
        <div className="border-2 border-gray-300 border-dashed rounded-lg p-6 text-center">
          <Spinner size="md" className="mx-auto mb-2" />
          <p className="text-gray-600">Uploading resume...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary-50' : 'border-gray-300 hover:border-primary'
          }`}
        >
          <input {...getInputProps()} />
          <Icon name="upload" size="lg" className="mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">
            {isDragActive
              ? 'Drop your resume here'
              : 'Drag & drop your resume, or click to select file'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={(e) => e.stopPropagation()}
          >
            Select File
          </Button>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
```

## Job Board Implementation

The job board is a core component of the platform, designed to provide an intuitive and efficient job search experience.

### Job Board Architecture

#### Components Hierarchy

```
JobBoard
├── JobSearchHeader
│   ├── SearchBar
│   └── QuickFilters
├── JobFiltersPanel
│   ├── SpecialtyFilter
│   ├── LocationFilter
│   ├── PayRateFilter
│   ├── ShiftTypeFilter
│   └── DateRangeFilter
├── JobListContainer
│   ├── JobSorter
│   ├── JobList
│   │   └── JobCard (multiple)
│   └── LoadMoreButton
└── JobDetailsSidebar (on desktop)
    ├── JobHeader
    ├── JobDetails
    ├── FacilityInfo
    ├── RequirementsList
    ├── SimilarJobs
    └── ApplyButton
```

### Job Search Implementation

```jsx
// src/components/jobs/JobSearchBar.jsx
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { setSearchQuery } from '@/store/slices/jobsSlice';
import { useDebounce } from '@/hooks/useDebounce';
import { useConversationalSearch } from '@/hooks/useConversationalSearch';
import Icon from '../common/Icon';
import Button from '../common/Button';

const JobSearchBar = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const debouncedQuery = useDebounce(query, 300);
  const { parseSearchQuery, isProcessing } = useConversationalSearch();
  
  // Update search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      handleSearch();
    }
  }, [debouncedQuery]);
  
  const handleSearch = async () => {
    // Parse natural language query using AI
    const parsedQuery = await parseSearchQuery(query);
    
    // Update Redux store
    dispatch(setSearchQuery({
      rawQuery: query,
      parsedQuery
    }));
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set('q', query);
    
    // Add parsed parameters to URL
    if (parsedQuery.specialty) params.set('specialty', parsedQuery.specialty);
    if (parsedQuery.location) params.set('location', parsedQuery.location);
    if (parsedQuery.minPay) params.set('minPay', parsedQuery.minPay);
    if (parsedQuery.shift) params.set('shift', parsedQuery.shift);
    
    // Navigate with new params
    router.push(`/jobs?${params.toString()}`);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          className="form-input w-full pl-10 pr-16 py-3 rounded-full border-2 border-gray-300 focus:border-primary focus:ring focus:ring-primary-100"
          placeholder="Search jobs by specialty, location, or keywords..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Icon
          name="search"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <Button
          variant="primary"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full"
          onClick={handleSearch}
          loading={isProcessing}
        >
          Search
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-1 ml-2">
        Try: "ICU jobs in California" or "ER positions paying over $2,500/week"
      </p>
    </div>
  );
};

export default JobSearchBar;
```

### Job Card Component

```jsx
// src/components/jobs/JobCard.jsx
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useJobActions } from '@/hooks/useJobActions';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Icon from '../common/Icon';

const JobCard = ({ job, isSelected, onSelect }) => {
  const { saveJob, shareJob } = useJobActions();
  const [isSaved, setIsSaved] = useState(job.isSaved || false);
  
  const handleSaveClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await saveJob(job.id, !isSaved);
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };
  
  const handleShareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    shareJob(job);
  };
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
        isSelected ? 'border-primary' : 'border-transparent hover:border-gray-200'
      }`}
      onClick={() => onSelect(job)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {job.facilityLogo ? (
              <Image
                src={job.facilityLogo}
                alt={job.facilityName}
                width={48}
                height={48}
                className="rounded-md mr-3"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center mr-3">
                <Icon name="building" className="text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg line-clamp-1">{job.title}</h3>
              <p className="text-gray-600 text-sm">{job.facilityName}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              className={`p-2 rounded-full ${
                isSaved ? 'text-primary bg-primary-50' : 'text-gray-400 hover:bg-gray-100'
              }`}
              onClick={handleSaveClick}
              aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
              <Icon name={isSaved ? 'heart-filled' : 'heart'} />
            </button>
            <button
              className="p-2 rounded-full text-gray-400 hover:bg-gray-100"
              onClick={handleShareClick}
              aria-label="Share job"
            >
              <Icon name="share" />
            </button>
          </div>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline" color="gray">
            <Icon name="map-pin" size="sm" className="mr-1" />
            {job.city}, {job.state}
          </Badge>
          <Badge variant="outline" color="gray">
            <Icon name="calendar" size="sm" className="mr-1" />
            {formatDate(job.startDate)}
          </Badge>
          <Badge variant="outline" color="gray">
            <Icon name="clock" size="sm" className="mr-1" />
            {job.shiftType}
          </Badge>
          {job.isUrgent && (
            <Badge variant="solid" color="red">
              Urgent
            </Badge>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-primary font-bold text-lg">
              ${formatCurrency(job.payRate)}/wk
            </p>
            {job.housingStipend > 0 && (
              <p className="text-gray-500 text-xs">
                +${formatCurrency(job.housingStipend)} housing
              </p>
            )}
          </div>
          
          <Link href={`/jobs/${job.id}`} legacyBehavior>
            <Button
              as="a"
              variant="outline"
              size="sm"
              onClick={(e) => e.stopPropagation()}
            >
              View Details
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'JobPosting',
            title: job.title,
            datePosted: job.postedDate,
            validThrough: job.endDate,
            description: job.description,
            employmentType: 'CONTRACTOR',
            hiringOrganization: {
              '@type': 'Organization',
              name: job.facilityName,
              sameAs: job.facilityUrl
            },
            jobLocation: {
              '@type': 'Place',
              address: {
                '@type': 'PostalAddress',
                addressLocality: job.city,
                addressRegion: job.state,
                postalCode: job.zipCode,
                addressCountry: 'US'
              }
            },
            baseSalary: {
              '@type': 'MonetaryAmount',
              currency: 'USD',
              value: {
                '@type': 'QuantitativeValue',
                value: job.payRate,
                unitText: 'WEEK'
              }
            },
            skills: job.skills?.join(', '),
            occupationalCategory: job.specialty
          })
        }}
      />
    </div>
  );
};

export default JobCard;
```

## Recruiter Portal Implementation

The recruiter portal provides tools for recruiters to manage jobs, candidates, and placements efficiently.

### Recruiter Dashboard

```jsx
// src/components/recruiter/RecruiterDashboard.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRecruiterStats } from '@/hooks/useRecruiterStats';
import { useRecruiterJobs } from '@/hooks/useRecruiterJobs';
import { useRecruiterCandidates } from '@/hooks/useRecruiterCandidates';
import DashboardCard from '../common/DashboardCard';
import StatCard from '../common/StatCard';
import JobsTable from './JobsTable';
import CandidatesTable from './CandidatesTable';
import InsightsPanel from './InsightsPanel';
import Tabs from '../common/Tabs';

const RecruiterDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const { stats, isLoading: statsLoading } = useRecruiterStats(user.id);
  const { jobs, isLoading: jobsLoading } = useRecruiterJobs(user.id);
  const { candidates, isLoading: candidatesLoading } = useRecruiterCandidates(user.id);
  const [activeTab, setActiveTab] = useState('overview');
  
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'candidates', label: 'Candidates' },
    { id: 'insights', label: 'Insights' }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.firstName}!</h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button className="btn btn-primary">
            Post New Job
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Jobs"
          value={stats?.activeJobs || 0}
          change={stats?.activeJobsChange || 0}
          loading={statsLoading}
          icon="briefcase"
        />
        <StatCard
          title="New Applications"
          value={stats?.newApplications || 0}
          change={stats?.newApplicationsChange || 0}
          loading={statsLoading}
          icon="users"
        />
        <StatCard
          title="Interviews Scheduled"
          value={stats?.scheduledInterviews || 0}
          change={stats?.scheduledInterviewsChange || 0}
          loading={statsLoading}
          icon="calendar"
        />
        <StatCard
          title="Placements"
          value={stats?.placements || 0}
          change={stats?.placementsChange || 0}
          loading={statsLoading}
          icon="check-circle"
        />
      </div>
      
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="Recent Applications"
            className="lg:col-span-2"
          >
            <CandidatesTable
              candidates={candidates?.slice(0, 5) || []}
              loading={candidatesLoading}
              compact
            />
          </DashboardCard>
          
          <DashboardCard title="AI Insights">
            <InsightsPanel />
          </DashboardCard>
        </div>
      )}
      
      {activeTab === 'jobs' && (
        <JobsTable
          jobs={jobs || []}
          loading={jobsLoading}
        />
      )}
      
      {activeTab === 'candidates' && (
        <CandidatesTable
          candidates={candidates || []}
          loading={candidatesLoading}
        />
      )}
      
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard title="Job Performance">
            {/* Job performance charts */}
          </DashboardCard>
          
          <DashboardCard title="Candidate Insights">
            {/* Candidate insights */}
          </DashboardCard>
          
          <DashboardCard title="Market Trends" className="lg:col-span-2">
            {/* Market trends */}
          </DashboardCard>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
```

### Job Sharing Component

```jsx
// src/components/recruiter/JobShareModal.jsx
import { useState } from 'react';
import { useJobSharing } from '@/hooks/useJobSharing';
import Modal from '../common/Modal';
import Tabs from '../common/Tabs';
import Button from '../common/Button';
import CopyInput from '../common/CopyInput';
import SocialShareButtons from '../common/SocialShareButtons';
import QRCode from '../common/QRCode';

const JobShareModal = ({ job, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('link');
  const { generateShareLink, generateTrackingLink } = useJobSharing();
  const [recruiterNote, setRecruiterNote] = useState('');
  const [trackingLink, setTrackingLink] = useState('');
  
  const tabs = [
    { id: 'link', label: 'Share Link' },
    { id: 'email', label: 'Email' },
    { id: 'sms', label: 'SMS' },
    { id: 'qr', label: 'QR Code' }
  ];
  
  const handleGenerateTrackingLink = async () => {
    const link = await generateTrackingLink(job.id, {
      source: 'recruiter_share',
      recruiterId: job.recruiterId,
      note: recruiterNote
    });
    
    setTrackingLink(link);
  };
  
  const shareUrl = trackingLink || generateShareLink(job.id);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share: ${job.title}`}
    >
      <div className="p-4">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        
        <div className="mt-4">
          {activeTab === 'link' && (
            <div className="space-y-4">
              <CopyInput
                value={shareUrl}
                label="Share Link"
              />
              
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add a note (optional)
                </label>
                <textarea
                  className="form-textarea w-full"
                  rows={2}
                  value={recruiterNote}
                  onChange={(e) => setRecruiterNote(e.target.value)}
                  placeholder="Add a personal note to include with this job share..."
                />
              </div>
              
              <Button
                variant="outline"
                onClick={handleGenerateTrackingLink}
                disabled={!recruiterNote}
              >
                Generate Link with Note
              </Button>
              
              <div className="pt-2">
                <p className="text-sm text-gray-500 mb-2">Share on social media:</p>
                <SocialShareButtons
                  url={shareUrl}
                  title={`${job.title} at ${job.facilityName}`}
                  description={`${job.specialty} position in ${job.city}, ${job.state} - $${job.payRate}/week`}
                />
              </div>
            </div>
          )}
          
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Recipients
                </label>
                <input
                  type="text"
                  className="form-input w-full"
                  placeholder="Enter email addresses separated by commas"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  className="form-input w-full"
                  defaultValue={`${job.title} at ${job.facilityName}`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  className="form-textarea w-full"
                  rows={5}
                  defaultValue={`I thought you might be interested in this ${job.specialty} position in ${job.city}, ${job.state}.\n\n${shareUrl}`}
                />
              </div>
              
              <Button variant="primary" fullWidth>
                Send Email
              </Button>
            </div>
          )}
          
          {activeTab === 'sms' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="form-input w-full"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  className="form-textarea w-full"
                  rows={3}
                  defaultValue={`Check out this ${job.specialty} position in ${job.city}, ${job.state}: ${shareUrl}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {/* Calculate SMS length */}
                  Message length: 120 characters (1 SMS)
                </p>
              </div>
              
              <Button variant="primary" fullWidth>
                Send SMS
              </Button>
            </div>
          )}
          
          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <QRCode
                value={shareUrl}
                size={200}
                className="mx-auto"
              />
              
              <p className="text-sm text-gray-600">
                Scan this QR code to view the job details
              </p>
              
              <Button variant="outline">
                Download QR Code
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default JobShareModal;
```

## Conversational AI Assistant Integration

The Conversational AI Assistant is integrated into the frontend to provide natural language job search and application guidance.

### Chat Interface Component

```jsx
// src/components/chat/ChatInterface.jsx
import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  sendMessage, 
  resetConversation 
} from '@/store/slices/chatSlice';
import { useChat } from '@/hooks/useChat';
import Icon from '../common/Icon';
import Button from '../common/Button';
import JobCard from '../jobs/JobCard';

const ChatInterface = () => {
  const dispatch = useDispatch();
  const { messages, isTyping } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);
  const { sendChatMessage } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to state
    dispatch(sendMessage({
      role: 'user',
      content: input
    }));
    
    // Clear input
    setInput('');
    
    try {
      // Send message to AI
      const response = await sendChatMessage(input);
      
      // Add AI response to state
      dispatch(sendMessage({
        role: 'assistant',
        content: response.text,
        data: response.data
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      dispatch(sendMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        error: true
      }));
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg p-3 ${
            isUser
              ? 'bg-primary text-white rounded-tr-none'
              : 'bg-gray-100 text-gray-800 rounded-tl-none'
          }`}
        >
          {message.content}
          
          {/* Render job results if available */}
          {message.data?.jobs && (
            <div className="mt-3 space-y-3">
              {message.data.jobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  compact
                />
              ))}
            </div>
          )}
          
          {/* Render suggested actions if available */}
          {message.data?.actions && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.data.actions.map((action, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(action.text);
                  }}
                >
                  {action.text}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b p-3 flex items-center justify-between">
        <h3 className="font-bold">AI Assistant</h3>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => dispatch(resetConversation())}
          aria-label="Reset conversation"
        >
          <Icon name="refresh" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Icon name="chat" size="lg" className="mx-auto mb-2" />
            <p>Hi {user?.firstName || 'there'}! How can I help you today?</p>
            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setInput('Find ICU jobs in California')}
              >
                Find ICU jobs in California
              </Button>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setInput('What are the highest paying ER positions?')}
              >
                What are the highest paying ER positions?
              </Button>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setInput('Help me update my profile')}
              >
                Help me update my profile
              </Button>
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 text-gray-800 rounded-lg rounded-tl-none p-3">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="bg-white border-t p-3">
        <div className="flex items-center">
          <textarea
            className="form-textarea flex-1 resize-none"
            rows={1}
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            variant="primary"
            className="ml-2"
            onClick={handleSendMessage}
            disabled={!input.trim()}
          >
            <Icon name="send" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Try asking about jobs, application status, or travel nursing tips
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
```

## SEO Implementation

The platform implements comprehensive SEO strategies to maximize organic traffic for healthcare job searches.

### SEO Components

#### Schema-Enhanced Job Listings

```jsx
// src/components/seo/JobSchema.jsx
const JobSchema = ({ job }) => {
  const jobSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    datePosted: job.postedDate,
    validThrough: job.endDate,
    description: job.description,
    employmentType: 'CONTRACTOR',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.facilityName,
      sameAs: job.facilityUrl
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city,
        addressRegion: job.state,
        postalCode: job.zipCode,
        addressCountry: 'US'
      }
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        value: job.payRate,
        unitText: 'WEEK'
      }
    },
    skills: job.skills?.join(', '),
    occupationalCategory: job.specialty,
    industry: 'Healthcare',
    jobBenefits: job.benefits,
    workHours: `${job.weeklyHours} hours per week`,
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'United States'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
    />
  );
};

export default JobSchema;
```

#### City Landing Page Component

```jsx
// src/components/seo/CityLandingPage.jsx
import { useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useCityData } from '@/hooks/useCityData';
import { useCityJobs } from '@/hooks/useCityJobs';
import JobList from '../jobs/JobList';
import CityGuide from '../city-guides/CityGuide';
import RelatedCities from '../city-guides/RelatedCities';
import Breadcrumbs from '../common/Breadcrumbs';
import LocalSchema from './LocalSchema';

const CityLandingPage = ({ city, state }) => {
  const { cityData, isLoading: cityLoading } = useCityData(city, state);
  const { jobs, isLoading: jobsLoading } = useCityJobs(city, state);
  
  // Track page view
  useEffect(() => {
    // Analytics tracking
    if (cityData) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'pageView',
        pageType: 'cityLanding',
        city: city,
        state: state
      });
    }
  }, [cityData, city, state]);
  
  if (cityLoading) {
    return <div>Loading...</div>;
  }
  
  if (!cityData) {
    return <div>City not found</div>;
  }
  
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Travel Nursing Locations', href: '/locations' },
    { label: state, href: `/locations/${state.toLowerCase()}` },
    { label: city, href: `/locations/${state.toLowerCase()}/${city.toLowerCase()}` }
  ];
  
  return (
    <>
      <Head>
        <title>{`Travel Nursing Jobs in ${city}, ${state} | Excel Medical Staffing`}</title>
        <meta
          name="description"
          content={`Find the best travel nursing jobs in ${city}, ${state}. Discover pay rates, housing options, and everything you need to know about working as a travel nurse in ${city}.`}
        />
        <meta
          name="keywords"
          content={`travel nursing ${city}, travel nurse jobs ${city} ${state}, healthcare jobs ${city}, travel nurse housing ${city}, hospitals in ${city}`}
        />
        <link
          rel="canonical"
          href={`https://excelmedicalstaffing.com/locations/${state.toLowerCase()}/${city.toLowerCase()}`}
        />
      </Head>
      
      <LocalSchema
        name={`Travel Nursing in ${city}, ${state}`}
        description={`Information about travel nursing jobs and lifestyle in ${city}, ${state}`}
        city={city}
        state={state}
        image={cityData.featuredImage}
      />
      
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbs} />
        
        <div className="mt-6">
          <h1 className="text-3xl font-bold">
            Travel Nursing Jobs in {city}, {state}
          </h1>
          
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="relative h-64 rounded-lg overflow-hidden">
                <Image
                  src={cityData.featuredImage || '/images/city-placeholder.jpg'}
                  alt={`${city}, ${state}`}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="mt-6 prose max-w-none">
                <h2>About {city}, {state}</h2>
                <p>{cityData.overview}</p>
                
                <h2>Travel Nursing in {city}</h2>
                <p>
                  {city} offers numerous opportunities for travel nurses across various specialties.
                  With {cityData.healthcareFacilitiesCount || 'several'} healthcare facilities in the area,
                  travel nurses can find positions in hospitals, clinics, and specialty centers.
                </p>
                
                <h2>Top Hospitals in {city}</h2>
                <ul>
                  {cityData.topHospitals?.map((hospital, index) => (
                    <li key={index}>{hospital}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">
                  Current Travel Nursing Jobs in {city}
                </h2>
                
                <JobList
                  jobs={jobs}
                  loading={jobsLoading}
                  emptyMessage={`No jobs currently available in ${city}, ${state}. Check back soon or create a job alert.`}
                />
                
                <div className="mt-4 text-center">
                  <Link href={`/jobs?location=${city},${state}`} legacyBehavior>
                    <a className="btn btn-primary">
                      View All Jobs in {city}
                    </a>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-bold mb-3">
                  {city} Quick Facts
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Population:</span>
                    <span className="font-medium">{cityData.population?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost of Living:</span>
                    <span className="font-medium">{cityData.costOfLivingIndex}% of national average</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Housing Cost:</span>
                    <span className="font-medium">{cityData.housingCostIndex}% of national average</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Climate:</span>
                    <span className="font-medium">{cityData.climate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Walkability Score:</span>
                    <span className="font-medium">{cityData.walkabilityScore}/100</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-bold mb-3">
                  Housing Options
                </h3>
                
                <p className="text-sm text-gray-600 mb-3">
                  Average monthly housing costs for travel nurses:
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Studio/1BR Apartment:</span>
                    <span className="font-medium">${cityData.housingCosts?.oneBedroom}/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">2BR Apartment:</span>
                    <span className="font-medium">${cityData.housingCosts?.twoBedroom}/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extended Stay Hotel:</span>
                    <span className="font-medium">${cityData.housingCosts?.extendedStay}/month</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Link href={`/housing-guide/${state.toLowerCase()}/${city.toLowerCase()}`} legacyBehavior>
                    <a className="text-primary text-sm font-medium">
                      View Full Housing Guide →
                    </a>
                  </Link>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-bold mb-3">
                  Create a Job Alert
                </h3>
                
                <p className="text-sm text-gray-600 mb-3">
                  Get notified when new jobs in {city} are posted.
                </p>
                
                <Link href={`/job-alerts/create?location=${city},${state}`} legacyBehavior>
                  <a className="btn btn-outline w-full">
                    Create Alert
                  </a>
                </Link>
              </div>
              
              <RelatedCities
                currentCity={city}
                state={state}
              />
            </div>
          </div>
          
          {cityData.cityGuide && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">
                {city} City Guide for Travel Nurses
              </h2>
              
              <CityGuide
                cityGuide={cityData.cityGuide}
                city={city}
                state={state}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CityLandingPage;
```

## Performance Optimization

The platform implements various performance optimization techniques to ensure fast loading times and smooth user experience.

### Image Optimization

```jsx
// src/components/common/OptimizedImage.jsx
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/utils/classNames';

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  containerClassName,
  onLoad,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  
  const handleLoad = (event) => {
    setIsLoading(false);
    if (onLoad) {
      onLoad(event);
    }
  };
  
  return (
    <div
      className={cn(
        'overflow-hidden relative',
        fill ? 'w-full h-full' : '',
        containerClassName
      )}
      style={
        !fill && width && height
          ? { width, height }
          : undefined
      }
    >
      <Image
        src={src || '/images/placeholder.jpg'}
        alt={alt || ''}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        sizes={props.sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        {...props}
      />
      
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default OptimizedImage;
```

### Lazy Loading Components

```jsx
// src/components/common/LazyComponent.jsx
import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

const LazyComponent = ({ children, placeholder, threshold = 0.1 }) => {
  const [loaded, setLoaded] = useState(false);
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true
  });
  
  useEffect(() => {
    if (inView && !loaded) {
      setLoaded(true);
    }
  }, [inView, loaded]);
  
  return (
    <div ref={ref}>
      {loaded ? children : placeholder}
    </div>
  );
};

export default LazyComponent;
```

## Analytics Implementation

The platform implements comprehensive analytics to track user behavior and measure performance.

### Analytics Service

```javascript
// src/services/analytics.service.js
class AnalyticsService {
  constructor() {
    this.initialized = false;
    this.userId = null;
    this.sessionId = null;
  }
  
  init() {
    if (this.initialized) return;
    
    // Generate session ID
    this.sessionId = this._generateSessionId();
    
    // Initialize Google Analytics
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
      
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
      document.head.appendChild(script);
    }
    
    // Initialize Hotjar
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_HOTJAR_ID) {
      const hjScript = document.createElement('script');
      hjScript.innerHTML = `
        (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `;
      document.head.appendChild(hjScript);
    }
    
    this.initialized = true;
  }
  
  setUserId(userId) {
    this.userId = userId;
    
    // Set user ID in analytics tools
    if (typeof window !== 'undefined') {
      // Google Analytics
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'setUserId',
        userId: userId
      });
      
      // Hotjar
      if (window.hj) {
        window.hj('identify', userId);
      }
    }
  }
  
  trackPageView(path, title) {
    if (!this.initialized) this.init();
    
    if (typeof window !== 'undefined') {
      // Google Analytics
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'pageView',
        page: {
          path,
          title
        }
      });
      
      // Custom event for backend analytics
      this._trackEvent('page_view', {
        path,
        title
      });
    }
  }
  
  trackEvent(category, action, label, value) {
    if (!this.initialized) this.init();
    
    if (typeof window !== 'undefined') {
      // Google Analytics
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'customEvent',
        eventCategory: category,
        eventAction: action,
        eventLabel: label,
        eventValue: value
      });
      
      // Custom event for backend analytics
      this._trackEvent(action, {
        category,
        label,
        value
      });
    }
  }
  
  trackJobView(jobId, jobTitle) {
    this.trackEvent('job', 'view', jobTitle, jobId);
  }
  
  trackJobApplication(jobId, jobTitle) {
    this.trackEvent('job', 'apply', jobTitle, jobId);
  }
  
  trackSearch(query, resultsCount) {
    this.trackEvent('search', 'execute', query, resultsCount);
  }
  
  trackChatInteraction(messageType, content) {
    this.trackEvent('chat', messageType, content);
  }
  
  async _trackEvent(eventType, eventData) {
    try {
      // Send event to backend for storage and analysis
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: eventType,
          user_id: this.userId,
          session_id: this.sessionId,
          event_data: eventData,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }
  
  _generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

export const analyticsService = new AnalyticsService();
```

## Deployment Configuration

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set proper permissions
USER nextjs

# Expose port
EXPOSE 3000

# Environment variables must be set at runtime
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "server.js"]
```

### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name excelmedicalstaffing.com www.excelmedicalstaffing.com;
    
    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name excelmedicalstaffing.com www.excelmedicalstaffing.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/excelmedicalstaffing.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/excelmedicalstaffing.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.hotjar.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://www.google-analytics.com https://stats.g.doubleclick.net; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://www.google-analytics.com https://stats.g.doubleclick.net https://*.hotjar.com wss://*.hotjar.com; frame-src 'self' https://*.hotjar.com; object-src 'none';" always;
    
    # Gzip compression
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_vary on;
    gzip_types
        application/javascript
        application/json
        application/xml
        application/xml+rss
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;
    
    # Proxy to Next.js server
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static assets caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Cache static assets
        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Public assets caching
    location /public {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Cache public assets
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
    
    # Favicon
    location = /favicon.ico {
        alias /app/public/favicon.ico;
        access_log off;
        log_not_found off;
        expires 30d;
    }
    
    # Robots.txt
    location = /robots.txt {
        alias /app/public/robots.txt;
        access_log off;
        log_not_found off;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

## Next Steps

1. **Component Development**:
   - Develop core UI components based on the design system
   - Create the mobile-first application flow
   - Implement the job board with filtering and search

2. **API Integration**:
   - Implement the LaborEdge API integration
   - Create the authentication flow
   - Set up data synchronization services

3. **AI Components Integration**:
   - Integrate the resume parser for the application flow
   - Implement the job matching engine
   - Develop the conversational AI assistant interface

4. **Testing and Optimization**:
   - Create automated tests for critical user flows
   - Implement performance monitoring
   - Optimize for mobile devices and slow connections

5. **Deployment Preparation**:
   - Set up CI/CD pipeline
   - Configure production environment
   - Implement monitoring and logging