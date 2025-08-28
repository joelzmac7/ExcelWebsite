/**
 * Job Model
 * 
 * This model defines the structure for job data in our application.
 * It represents a healthcare job listing with all relevant details.
 */

export interface Job {
  /**
   * Internal unique identifier for the job
   */
  id: string;
  
  /**
   * External identifier from LaborEdge API
   */
  externalId: string;
  
  /**
   * Job title
   */
  title: string;
  
  /**
   * Healthcare specialty (e.g., ICU, Med/Surg, ER)
   */
  specialty: string;
  
  /**
   * Name of the healthcare facility
   */
  facilityName: string;
  
  /**
   * ID of the facility (reference to Facility model)
   */
  facilityId: string | null;
  
  /**
   * Type of facility (e.g., Hospital, Clinic)
   */
  facilityType: string | null;
  
  /**
   * City where the job is located
   */
  city: string;
  
  /**
   * State where the job is located (2-letter code)
   */
  state: string;
  
  /**
   * ZIP code of the job location
   */
  zipCode: string | null;
  
  /**
   * Geographic coordinates of the job location
   */
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  
  /**
   * Start date of the assignment (ISO format)
   */
  startDate: string | null;
  
  /**
   * End date of the assignment (ISO format)
   */
  endDate: string | null;
  
  /**
   * Number of hours per week
   */
  weeklyHours: number;
  
  /**
   * Detailed description of the shift
   */
  shiftDetails: string;
  
  /**
   * Type of shift (e.g., Day, Night, Evening)
   */
  shiftType: string | null;
  
  /**
   * Weekly pay rate in USD
   */
  payRate: number;
  
  /**
   * Weekly housing stipend in USD
   */
  housingStipend: number | null;
  
  /**
   * Job requirements text
   */
  requirements: string;
  
  /**
   * Benefits text
   */
  benefits: string;
  
  /**
   * Full job description
   */
  description: string;
  
  /**
   * Job status
   */
  status: 'active' | 'filled' | 'expired' | 'draft';
  
  /**
   * Whether the job is featured
   */
  isFeatured: boolean;
  
  /**
   * Whether the job is urgent
   */
  isUrgent: boolean;
  
  /**
   * Creation timestamp (ISO format)
   */
  createdAt: string;
  
  /**
   * Last update timestamp (ISO format)
   */
  updatedAt: string;
  
  /**
   * ID of the recruiter assigned to this job
   */
  recruiterId: string | null;
  
  /**
   * Number of views the job has received
   */
  viewsCount: number;
  
  /**
   * Number of applications the job has received
   */
  applicationsCount: number;
  
  /**
   * SEO-optimized title
   */
  seoTitle?: string;
  
  /**
   * SEO meta description
   */
  seoDescription?: string;
  
  /**
   * SEO keywords
   */
  seoKeywords?: string[];
  
  /**
   * Parsed requirements in structured format
   */
  parsedRequirements?: {
    certifications: string[];
    experience: number | null;
    skills: string[];
  };
  
  /**
   * Parsed shift details in structured format
   */
  parsedShift?: {
    type: string | null;
    hours: number | null;
    schedule: string | null;
  };
  
  /**
   * Additional metadata
   */
  metadata?: {
    originalData?: any;
    lastSyncedAt: string;
    [key: string]: any;
  };
}

/**
 * Job with match score for recommendations
 */
export interface JobWithMatchScore extends Job {
  /**
   * Match score between 0 and 100
   */
  matchScore: number;
  
  /**
   * Reasons for the match
   */
  matchReasons?: string[];
}

/**
 * Job creation data transfer object
 */
export interface JobCreateDto {
  title: string;
  specialty: string;
  facilityName: string;
  facilityId?: string;
  city: string;
  state: string;
  zipCode?: string;
  startDate?: string;
  endDate?: string;
  weeklyHours: number;
  shiftDetails?: string;
  shiftType?: string;
  payRate: number;
  housingStipend?: number;
  requirements?: string;
  benefits?: string;
  description?: string;
  status?: 'active' | 'filled' | 'expired' | 'draft';
  isFeatured?: boolean;
  isUrgent?: boolean;
  recruiterId?: string;
}

/**
 * Job update data transfer object
 */
export interface JobUpdateDto {
  title?: string;
  specialty?: string;
  facilityName?: string;
  facilityId?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  startDate?: string;
  endDate?: string;
  weeklyHours?: number;
  shiftDetails?: string;
  shiftType?: string;
  payRate?: number;
  housingStipend?: number;
  requirements?: string;
  benefits?: string;
  description?: string;
  status?: 'active' | 'filled' | 'expired' | 'draft';
  isFeatured?: boolean;
  isUrgent?: boolean;
  recruiterId?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

/**
 * Job search parameters
 */
export interface JobSearchParams {
  specialty?: string | string[];
  state?: string | string[];
  city?: string | string[];
  zipCode?: string;
  radius?: number;
  minPay?: number;
  maxPay?: number;
  shiftType?: string | string[];
  startDate?: string;
  endDate?: string;
  facilityType?: string | string[];
  keywords?: string;
  status?: 'active' | 'filled' | 'expired' | 'draft';
  isFeatured?: boolean;
  isUrgent?: boolean;
  recruiterId?: string;
  page?: number;
  limit?: number;
  sort?: string;
}