/**
 * Facility Model
 * 
 * This model defines the structure for healthcare facility data in our application.
 * It represents hospitals, clinics, and other healthcare facilities where jobs are located.
 */

export interface Facility {
  /**
   * Internal unique identifier for the facility
   */
  id: string;
  
  /**
   * External identifier from LaborEdge API
   */
  externalId: string;
  
  /**
   * Name of the facility
   */
  name: string;
  
  /**
   * Type of facility (e.g., Hospital, Clinic, Ambulatory Surgical Center)
   */
  type: string;
  
  /**
   * Street address
   */
  address: string;
  
  /**
   * City where the facility is located
   */
  city: string;
  
  /**
   * State where the facility is located (2-letter code)
   */
  state: string;
  
  /**
   * ZIP code of the facility location
   */
  zipCode: string;
  
  /**
   * Geographic coordinates of the facility
   */
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  
  /**
   * Contact phone number
   */
  phone: string | null;
  
  /**
   * Website URL
   */
  website: string | null;
  
  /**
   * Description of the facility
   */
  description: string;
  
  /**
   * Number of beds (for hospitals)
   */
  bedCount: number | null;
  
  /**
   * Trauma level designation (for hospitals)
   */
  traumaLevel: string | null;
  
  /**
   * Specialties or services offered by the facility
   */
  specialties: string[];
  
  /**
   * URL to facility image
   */
  imageUrl: string | null;
  
  /**
   * Facility rating (e.g., 1-5)
   */
  rating: number | null;
  
  /**
   * Whether the facility is a teaching hospital
   */
  isTeachingHospital: boolean | null;
  
  /**
   * Whether the facility has Magnet designation for nursing excellence
   */
  isMagnetDesignated: boolean | null;
  
  /**
   * Creation timestamp (ISO format)
   */
  createdAt: string;
  
  /**
   * Last update timestamp (ISO format)
   */
  updatedAt: string;
  
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
 * Facility creation data transfer object
 */
export interface FacilityCreateDto {
  externalId?: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  website?: string;
  description?: string;
  bedCount?: number;
  traumaLevel?: string;
  specialties?: string[];
  imageUrl?: string;
  rating?: number;
  isTeachingHospital?: boolean;
  isMagnetDesignated?: boolean;
}

/**
 * Facility update data transfer object
 */
export interface FacilityUpdateDto {
  name?: string;
  type?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  website?: string;
  description?: string;
  bedCount?: number;
  traumaLevel?: string;
  specialties?: string[];
  imageUrl?: string;
  rating?: number;
  isTeachingHospital?: boolean;
  isMagnetDesignated?: boolean;
}

/**
 * Facility search parameters
 */
export interface FacilitySearchParams {
  name?: string;
  type?: string | string[];
  city?: string | string[];
  state?: string | string[];
  zipCode?: string;
  radius?: number;
  specialties?: string | string[];
  traumaLevel?: string | string[];
  minBedCount?: number;
  maxBedCount?: number;
  isTeachingHospital?: boolean;
  isMagnetDesignated?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

/**
 * Facility with distance for location-based searches
 */
export interface FacilityWithDistance extends Facility {
  /**
   * Distance in miles from search location
   */
  distance: number;
}