/**
 * Facility Transformer Service
 * 
 * This service transforms facility data from the LaborEdge API format to our internal data model format.
 * It handles data normalization, field mapping, and enrichment of facility data.
 */

import { Logger } from '../../utils/logger';
import { Facility } from '../../models/facility.model';

export class FacilityTransformer {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child({ service: 'FacilityTransformer' });
  }

  /**
   * Transform facility data from LaborEdge API format to our internal model
   * @param facilityData Facility data from LaborEdge API
   * @returns Transformed facility data
   */
  transform(facilityData: any): Facility {
    try {
      // Extract and transform facility data
      const transformedFacility: Facility = {
        id: this.generateInternalId(facilityData.id),
        externalId: facilityData.id,
        name: this.normalizeFacilityName(facilityData.name),
        type: this.mapFacilityType(facilityData.type || facilityData.facility_type),
        address: facilityData.address || '',
        city: facilityData.city || '',
        state: facilityData.state || '',
        zipCode: facilityData.zip_code || facilityData.zipCode || '',
        coordinates: this.extractCoordinates(facilityData),
        phone: this.formatPhoneNumber(facilityData.phone),
        website: facilityData.website || null,
        description: facilityData.description || '',
        bedCount: this.parseBedCount(facilityData.bed_count || facilityData.bedCount),
        traumaLevel: this.parseTraumaLevel(facilityData.trauma_level || facilityData.traumaLevel),
        specialties: this.extractSpecialties(facilityData),
        imageUrl: facilityData.image_url || facilityData.imageUrl || null,
        rating: this.parseRating(facilityData.rating),
        isTeachingHospital: this.parseBoolean(facilityData.is_teaching_hospital || facilityData.isTeachingHospital),
        isMagnetDesignated: this.parseBoolean(facilityData.is_magnet_designated || facilityData.isMagnetDesignated),
        createdAt: this.parseDate(facilityData.created_at) || new Date().toISOString(),
        updatedAt: this.parseDate(facilityData.updated_at) || new Date().toISOString(),
        metadata: {
          originalData: facilityData,
          lastSyncedAt: new Date().toISOString()
        }
      };

      return transformedFacility;
    } catch (error) {
      this.logger.error({
        message: 'Failed to transform facility data',
        error: error instanceof Error ? error.message : String(error),
        facilityId: facilityData.id
      });
      throw error;
    }
  }

  /**
   * Generate internal ID from external ID
   * @param externalId External ID from LaborEdge
   * @returns Internal ID
   */
  private generateInternalId(externalId: string): string {
    // Use UUID v5 to generate a deterministic UUID based on the external ID
    // This ensures the same external ID always maps to the same internal ID
    const { v5: uuidv5 } = require('uuid');
    const NAMESPACE = '2c671a64-40d5-491e-99b0-da01ff1f3342'; // Custom namespace for facilities
    return uuidv5(externalId, NAMESPACE);
  }

  /**
   * Normalize facility name for consistency
   * @param name Original facility name
   * @returns Normalized facility name
   */
  private normalizeFacilityName(name: string): string {
    if (!name) return '';
    
    // Remove extra whitespace
    let normalizedName = name.trim().replace(/\s+/g, ' ');
    
    // Ensure consistent capitalization (Title Case)
    normalizedName = normalizedName
      .split(' ')
      .map(word => {
        // Don't lowercase small words in the middle of the name
        if (normalizedName.indexOf(word) > 0 && 
            ['of', 'and', 'the', 'at', 'by', 'for', 'in', 'to', 'with'].includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
    
    // Standardize common terms
    const replacements: Record<string, string> = {
      'Med Ctr': 'Medical Center',
      'Med Center': 'Medical Center',
      'Hosp': 'Hospital',
      'Reg Med Ctr': 'Regional Medical Center',
      'Reg Medical Center': 'Regional Medical Center',
      'Univ': 'University',
      'Univ.': 'University',
      'St.': 'Saint',
      'St ': 'Saint ',
      'Med.': 'Medical',
      'Ctr.': 'Center',
      'Ctr': 'Center'
    };
    
    Object.entries(replacements).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'g');
      normalizedName = normalizedName.replace(regex, full);
    });
    
    return normalizedName;
  }

  /**
   * Map facility type from LaborEdge format to our internal format
   * @param type Facility type from LaborEdge
   * @returns Mapped facility type
   */
  private mapFacilityType(type: string): string {
    if (!type) return 'Hospital';
    
    // Standardize facility types
    const typeMap: Record<string, string> = {
      'acute care': 'Hospital',
      'acute care hospital': 'Hospital',
      'ambulatory care': 'Ambulatory Care',
      'ambulatory surgical center': 'Ambulatory Surgical Center',
      'asc': 'Ambulatory Surgical Center',
      'behavioral health': 'Behavioral Health',
      'behavioral health facility': 'Behavioral Health',
      'clinic': 'Clinic',
      'community health center': 'Community Health Center',
      'critical access': 'Critical Access Hospital',
      'critical access hospital': 'Critical Access Hospital',
      'home health': 'Home Health',
      'home health agency': 'Home Health',
      'hospice': 'Hospice',
      'hospital': 'Hospital',
      'long term acute care': 'Long-Term Acute Care',
      'ltac': 'Long-Term Acute Care',
      'ltach': 'Long-Term Acute Care',
      'long term care': 'Long-Term Care',
      'ltc': 'Long-Term Care',
      'nursing home': 'Nursing Home',
      'outpatient': 'Outpatient Facility',
      'outpatient facility': 'Outpatient Facility',
      'rehabilitation': 'Rehabilitation',
      'rehabilitation facility': 'Rehabilitation',
      'rehab': 'Rehabilitation',
      'skilled nursing': 'Skilled Nursing Facility',
      'skilled nursing facility': 'Skilled Nursing Facility',
      'snf': 'Skilled Nursing Facility',
      'urgent care': 'Urgent Care',
      'urgent care center': 'Urgent Care'
    };
    
    const normalizedType = type.toLowerCase().trim();
    return typeMap[normalizedType] || this.toTitleCase(type);
  }

  /**
   * Extract coordinates from facility data
   * @param facilityData Facility data
   * @returns Coordinates object or null
   */
  private extractCoordinates(facilityData: any): { latitude: number; longitude: number } | null {
    // Check various possible locations for coordinates
    if (facilityData.coordinates && facilityData.coordinates.latitude && facilityData.coordinates.longitude) {
      return {
        latitude: parseFloat(facilityData.coordinates.latitude),
        longitude: parseFloat(facilityData.coordinates.longitude)
      };
    }
    
    if (facilityData.location && facilityData.location.coordinates) {
      const coords = facilityData.location.coordinates;
      if (coords.latitude && coords.longitude) {
        return {
          latitude: parseFloat(coords.latitude),
          longitude: parseFloat(coords.longitude)
        };
      }
    }
    
    if (facilityData.latitude && facilityData.longitude) {
      return {
        latitude: parseFloat(facilityData.latitude),
        longitude: parseFloat(facilityData.longitude)
      };
    }
    
    return null;
  }

  /**
   * Format phone number to consistent format
   * @param phone Phone number
   * @returns Formatted phone number or null
   */
  private formatPhoneNumber(phone: string): string | null {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if we have a valid US phone number (10 digits)
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }
    
    // If it's not a standard US number, return as is
    return phone;
  }

  /**
   * Parse date string to ISO format
   * @param dateString Date string
   * @returns ISO date string or null
   */
  private parseDate(dateString: string): string | null {
    if (!dateString) return null;
    
    try {
      // Try to parse the date
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date.toISOString();
    } catch (error) {
      this.logger.warn({
        message: 'Failed to parse date',
        dateString,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Parse bed count to ensure it's a number
   * @param bedCount Bed count value
   * @returns Parsed bed count or null
   */
  private parseBedCount(bedCount: any): number | null {
    if (bedCount === undefined || bedCount === null) {
      return null;
    }
    
    // If it's already a number, return it
    if (typeof bedCount === 'number') {
      return bedCount;
    }
    
    // If it's a string, try to parse it
    if (typeof bedCount === 'string') {
      // Remove any non-numeric characters
      const cleanedBedCount = bedCount.replace(/\D/g, '');
      const parsedBedCount = parseInt(cleanedBedCount, 10);
      
      if (!isNaN(parsedBedCount)) {
        return parsedBedCount;
      }
    }
    
    return null;
  }

  /**
   * Parse trauma level
   * @param traumaLevel Trauma level value
   * @returns Parsed trauma level or null
   */
  private parseTraumaLevel(traumaLevel: any): string | null {
    if (!traumaLevel) return null;
    
    // If it's a string, normalize it
    if (typeof traumaLevel === 'string') {
      // Convert to uppercase and remove spaces
      const normalized = traumaLevel.toUpperCase().replace(/\s+/g, '');
      
      // Check for common formats
      if (['I', '1', 'LEVEL1', 'LEVELI'].includes(normalized)) {
        return 'Level I';
      } else if (['II', '2', 'LEVEL2', 'LEVELII'].includes(normalized)) {
        return 'Level II';
      } else if (['III', '3', 'LEVEL3', 'LEVELIII'].includes(normalized)) {
        return 'Level III';
      } else if (['IV', '4', 'LEVEL4', 'LEVELIV'].includes(normalized)) {
        return 'Level IV';
      } else if (['V', '5', 'LEVEL5', 'LEVELV'].includes(normalized)) {
        return 'Level V';
      }
      
      // If it doesn't match any standard format, return as is
      return traumaLevel;
    }
    
    return null;
  }

  /**
   * Extract specialties from facility data
   * @param facilityData Facility data
   * @returns Array of specialties
   */
  private extractSpecialties(facilityData: any): string[] {
    const specialties: string[] = [];
    
    // Check if specialties are provided as an array
    if (Array.isArray(facilityData.specialties)) {
      facilityData.specialties.forEach((specialty: string) => {
        if (specialty && typeof specialty === 'string') {
          specialties.push(this.toTitleCase(specialty));
        }
      });
    }
    
    // Check if specialties are provided as a string
    if (typeof facilityData.specialties === 'string') {
      const specialtiesList = facilityData.specialties.split(',');
      specialtiesList.forEach((specialty: string) => {
        const trimmed = specialty.trim();
        if (trimmed) {
          specialties.push(this.toTitleCase(trimmed));
        }
      });
    }
    
    // Check if services are provided
    if (Array.isArray(facilityData.services)) {
      facilityData.services.forEach((service: string) => {
        if (service && typeof service === 'string') {
          specialties.push(this.toTitleCase(service));
        }
      });
    }
    
    // Remove duplicates
    return [...new Set(specialties)];
  }

  /**
   * Parse rating to ensure it's a number
   * @param rating Rating value
   * @returns Parsed rating or null
   */
  private parseRating(rating: any): number | null {
    if (rating === undefined || rating === null) {
      return null;
    }
    
    // If it's already a number, return it
    if (typeof rating === 'number') {
      return rating;
    }
    
    // If it's a string, try to parse it
    if (typeof rating === 'string') {
      // Remove any non-numeric characters except decimal point
      const cleanedRating = rating.replace(/[^\d.]/g, '');
      const parsedRating = parseFloat(cleanedRating);
      
      if (!isNaN(parsedRating)) {
        return parsedRating;
      }
    }
    
    return null;
  }

  /**
   * Parse boolean value
   * @param value Boolean value
   * @returns Parsed boolean or null
   */
  private parseBoolean(value: any): boolean | null {
    if (value === undefined || value === null) {
      return null;
    }
    
    // If it's already a boolean, return it
    if (typeof value === 'boolean') {
      return value;
    }
    
    // If it's a string, check for common true/false values
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      if (['true', 'yes', 'y', '1'].includes(normalized)) {
        return true;
      } else if (['false', 'no', 'n', '0'].includes(normalized)) {
        return false;
      }
    }
    
    // If it's a number, 0 is false, anything else is true
    if (typeof value === 'number') {
      return value !== 0;
    }
    
    return null;
  }

  /**
   * Convert string to title case
   * @param str String to convert
   * @returns Title case string
   */
  private toTitleCase(str: string): string {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}