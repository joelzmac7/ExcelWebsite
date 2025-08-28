/**
 * Job Transformer Service
 * 
 * This service transforms job data from the LaborEdge API format to our internal data model format.
 * It handles data normalization, field mapping, and enrichment of job data.
 */

import { Logger } from '../../utils/logger';
import { Job } from '../../models/job.model';

export class JobTransformer {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child({ service: 'JobTransformer' });
  }

  /**
   * Transform job data from LaborEdge API format to our internal model
   * @param jobData Job data from LaborEdge API
   * @returns Transformed job data
   */
  transform(jobData: any): Job {
    try {
      // Extract and transform job data
      const transformedJob: Job = {
        id: this.generateInternalId(jobData.id),
        externalId: jobData.id,
        title: this.normalizeJobTitle(jobData.title),
        specialty: this.mapSpecialty(jobData.specialty),
        facilityName: jobData.facility_name || jobData.facility?.name || '',
        facilityId: jobData.facility_id || jobData.facility?.id || null,
        facilityType: jobData.facility_type || jobData.facility?.type || null,
        city: jobData.city || jobData.location?.city || '',
        state: jobData.state || jobData.location?.state || '',
        zipCode: jobData.zip_code || jobData.location?.zip_code || null,
        coordinates: this.extractCoordinates(jobData),
        startDate: this.parseDate(jobData.start_date),
        endDate: this.parseDate(jobData.end_date),
        weeklyHours: this.parseWeeklyHours(jobData.weekly_hours, jobData.shift_details),
        shiftDetails: jobData.shift_details || '',
        shiftType: this.extractShiftType(jobData.shift_details),
        payRate: this.parsePayRate(jobData.pay_rate),
        housingStipend: this.parsePayRate(jobData.housing_stipend),
        requirements: jobData.requirements || '',
        benefits: jobData.benefits || '',
        description: jobData.description || '',
        status: this.mapStatus(jobData.status),
        isFeatured: false, // Default value, to be set by our system
        isUrgent: this.determineUrgency(jobData),
        createdAt: this.parseDate(jobData.created_at) || new Date().toISOString(),
        updatedAt: this.parseDate(jobData.updated_at) || new Date().toISOString(),
        recruiterId: null, // To be assigned in our system
        viewsCount: 0, // To be tracked in our system
        applicationsCount: 0, // To be tracked in our system
        parsedRequirements: this.parseRequirements(jobData.requirements),
        parsedShift: this.parseShiftDetails(jobData.shift_details),
        metadata: {
          originalData: jobData,
          lastSyncedAt: new Date().toISOString()
        }
      };

      // Generate SEO fields
      transformedJob.seoTitle = this.generateSeoTitle(transformedJob);
      transformedJob.seoDescription = this.generateSeoDescription(transformedJob);
      transformedJob.seoKeywords = this.generateSeoKeywords(transformedJob);

      return transformedJob;
    } catch (error) {
      this.logger.error({
        message: 'Failed to transform job data',
        error: error instanceof Error ? error.message : String(error),
        jobId: jobData.id
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
    const NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341'; // Custom namespace for our application
    return uuidv5(externalId, NAMESPACE);
  }

  /**
   * Normalize job title for consistency
   * @param title Original job title
   * @returns Normalized job title
   */
  private normalizeJobTitle(title: string): string {
    if (!title) return '';
    
    // Remove extra whitespace
    let normalizedTitle = title.trim().replace(/\s+/g, ' ');
    
    // Ensure consistent capitalization (Title Case)
    normalizedTitle = normalizedTitle
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Standardize common abbreviations
    const abbreviations: Record<string, string> = {
      'Rn': 'RN',
      'Lpn': 'LPN',
      'Icu': 'ICU',
      'Er': 'ER',
      'Ccu': 'CCU',
      'Pacu': 'PACU',
      'Ob': 'OB',
      'Gyn': 'GYN',
      'Obgyn': 'OBGYN',
      'Ot': 'OT',
      'Pt': 'PT',
      'St': 'ST'
    };
    
    Object.entries(abbreviations).forEach(([abbr, correct]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'g');
      normalizedTitle = normalizedTitle.replace(regex, correct);
    });
    
    return normalizedTitle;
  }

  /**
   * Map specialty from LaborEdge format to our internal format
   * @param specialty Specialty from LaborEdge
   * @returns Mapped specialty
   */
  private mapSpecialty(specialty: string): string {
    if (!specialty) return 'Other';
    
    // Standardize specialty names
    const specialtyMap: Record<string, string> = {
      'icu': 'ICU',
      'intensive care': 'ICU',
      'intensive care unit': 'ICU',
      'er': 'Emergency',
      'emergency room': 'Emergency',
      'emergency department': 'Emergency',
      'med surg': 'Med/Surg',
      'medical surgical': 'Med/Surg',
      'medical/surgical': 'Med/Surg',
      'telemetry': 'Telemetry',
      'tele': 'Telemetry',
      'labor and delivery': 'Labor & Delivery',
      'l&d': 'Labor & Delivery',
      'labor & delivery': 'Labor & Delivery',
      'operating room': 'OR',
      'or': 'OR',
      'pacu': 'PACU',
      'post anesthesia': 'PACU',
      'post anesthesia care unit': 'PACU',
      'cath lab': 'Cath Lab',
      'catheterization laboratory': 'Cath Lab',
      'physical therapy': 'Physical Therapy',
      'pt': 'Physical Therapy',
      'occupational therapy': 'Occupational Therapy',
      'ot': 'Occupational Therapy',
      'speech therapy': 'Speech Therapy',
      'st': 'Speech Therapy',
      'slp': 'Speech Therapy'
    };
    
    const normalizedSpecialty = specialty.toLowerCase().trim();
    return specialtyMap[normalizedSpecialty] || this.toTitleCase(specialty);
  }

  /**
   * Extract coordinates from job data
   * @param jobData Job data
   * @returns Coordinates object or null
   */
  private extractCoordinates(jobData: any): { latitude: number; longitude: number } | null {
    // Check various possible locations for coordinates
    if (jobData.coordinates && jobData.coordinates.latitude && jobData.coordinates.longitude) {
      return {
        latitude: parseFloat(jobData.coordinates.latitude),
        longitude: parseFloat(jobData.coordinates.longitude)
      };
    }
    
    if (jobData.location && jobData.location.coordinates) {
      const coords = jobData.location.coordinates;
      if (coords.latitude && coords.longitude) {
        return {
          latitude: parseFloat(coords.latitude),
          longitude: parseFloat(coords.longitude)
        };
      }
    }
    
    if (jobData.facility && jobData.facility.coordinates) {
      const coords = jobData.facility.coordinates;
      if (coords.latitude && coords.longitude) {
        return {
          latitude: parseFloat(coords.latitude),
          longitude: parseFloat(coords.longitude)
        };
      }
    }
    
    return null;
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
   * Parse weekly hours from job data
   * @param weeklyHours Weekly hours value
   * @param shiftDetails Shift details string
   * @returns Parsed weekly hours
   */
  private parseWeeklyHours(weeklyHours: any, shiftDetails?: string): number {
    // If weekly hours is provided and is a number, use it
    if (weeklyHours !== undefined && weeklyHours !== null) {
      const hours = parseInt(weeklyHours, 10);
      if (!isNaN(hours)) {
        return hours;
      }
    }
    
    // Try to extract from shift details
    if (shiftDetails) {
      // Look for patterns like "3x12" or "4x10"
      const shiftPattern = /(\d+)x(\d+)/i.exec(shiftDetails);
      if (shiftPattern && shiftPattern.length === 3) {
        const shifts = parseInt(shiftPattern[1], 10);
        const hoursPerShift = parseInt(shiftPattern[2], 10);
        
        if (!isNaN(shifts) && !isNaN(hoursPerShift)) {
          return shifts * hoursPerShift;
        }
      }
      
      // Look for explicit mention of weekly hours
      const weeklyPattern = /(\d+)\s*hours?\s*(?:per|a|\/)\s*week/i.exec(shiftDetails);
      if (weeklyPattern && weeklyPattern.length >= 2) {
        const hours = parseInt(weeklyPattern[1], 10);
        if (!isNaN(hours)) {
          return hours;
        }
      }
    }
    
    // Default to 36 hours if we couldn't determine
    return 36;
  }

  /**
   * Extract shift type from shift details
   * @param shiftDetails Shift details string
   * @returns Shift type
   */
  private extractShiftType(shiftDetails?: string): string | null {
    if (!shiftDetails) return null;
    
    const shiftDetails_lower = shiftDetails.toLowerCase();
    
    // Check for day shift
    if (shiftDetails_lower.includes('day shift') || 
        shiftDetails_lower.includes('days') || 
        /\bday\b/i.test(shiftDetails)) {
      return 'Day';
    }
    
    // Check for night shift
    if (shiftDetails_lower.includes('night shift') || 
        shiftDetails_lower.includes('nights') || 
        /\bnight\b/i.test(shiftDetails)) {
      return 'Night';
    }
    
    // Check for evening shift
    if (shiftDetails_lower.includes('evening shift') || 
        shiftDetails_lower.includes('evenings') || 
        /\bevening\b/i.test(shiftDetails)) {
      return 'Evening';
    }
    
    // Check for rotating shift
    if (shiftDetails_lower.includes('rotating') || 
        shiftDetails_lower.includes('rotation') || 
        /\brotate\b/i.test(shiftDetails)) {
      return 'Rotating';
    }
    
    // Check for PRN/per diem
    if (shiftDetails_lower.includes('prn') || 
        shiftDetails_lower.includes('per diem') || 
        /\bas needed\b/i.test(shiftDetails)) {
      return 'PRN';
    }
    
    // Check for weekend
    if (shiftDetails_lower.includes('weekend') || 
        /\bweekends\b/i.test(shiftDetails)) {
      return 'Weekend';
    }
    
    return null;
  }

  /**
   * Parse pay rate to ensure it's a number
   * @param payRate Pay rate value
   * @returns Parsed pay rate
   */
  private parsePayRate(payRate: any): number | null {
    if (payRate === undefined || payRate === null) {
      return null;
    }
    
    // If it's already a number, return it
    if (typeof payRate === 'number') {
      return payRate;
    }
    
    // If it's a string, try to parse it
    if (typeof payRate === 'string') {
      // Remove any non-numeric characters except decimal point
      const cleanedPayRate = payRate.replace(/[^\d.]/g, '');
      const parsedPayRate = parseFloat(cleanedPayRate);
      
      if (!isNaN(parsedPayRate)) {
        return parsedPayRate;
      }
    }
    
    return null;
  }

  /**
   * Map job status from LaborEdge format to our internal format
   * @param status Status from LaborEdge
   * @returns Mapped status
   */
  private mapStatus(status: string): 'active' | 'filled' | 'expired' | 'draft' {
    if (!status) return 'active';
    
    const statusMap: Record<string, 'active' | 'filled' | 'expired' | 'draft'> = {
      'active': 'active',
      'open': 'active',
      'available': 'active',
      'filled': 'filled',
      'closed': 'filled',
      'expired': 'expired',
      'draft': 'draft',
      'pending': 'draft'
    };
    
    const normalizedStatus = status.toLowerCase().trim();
    return statusMap[normalizedStatus] || 'active';
  }

  /**
   * Determine if a job should be marked as urgent
   * @param jobData Job data
   * @returns Whether the job is urgent
   */
  private determineUrgency(jobData: any): boolean {
    // Check if explicitly marked as urgent
    if (jobData.is_urgent === true || jobData.urgent === true) {
      return true;
    }
    
    // Check if start date is very soon (within 2 weeks)
    if (jobData.start_date) {
      try {
        const startDate = new Date(jobData.start_date);
        const now = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(now.getDate() + 14);
        
        if (startDate <= twoWeeksFromNow && startDate >= now) {
          return true;
        }
      } catch (error) {
        // Ignore date parsing errors
      }
    }
    
    // Check if description or title contains urgent keywords
    const urgentKeywords = ['urgent', 'immediate', 'asap', 'critical need', 'start asap'];
    
    const title = jobData.title?.toLowerCase() || '';
    const description = jobData.description?.toLowerCase() || '';
    
    return urgentKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
  }

  /**
   * Parse requirements text into structured format
   * @param requirementsText Requirements text
   * @returns Structured requirements
   */
  private parseRequirements(requirementsText?: string): {
    certifications: string[];
    experience: number | null;
    skills: string[];
  } {
    const requirements = {
      certifications: [] as string[],
      experience: null as number | null,
      skills: [] as string[]
    };
    
    if (!requirementsText) {
      return requirements;
    }
    
    // Extract certifications
    const certRegex = /\b(BLS|ACLS|PALS|TNCC|CCRN|CEN|CNOR|RN|LPN|CNA)\b/gi;
    let certMatch;
    while ((certMatch = certRegex.exec(requirementsText)) !== null) {
      if (!requirements.certifications.includes(certMatch[1].toUpperCase())) {
        requirements.certifications.push(certMatch[1].toUpperCase());
      }
    }
    
    // Extract experience
    const expRegex = /(\d+)\+?\s*years?\s*(?:of)?\s*experience/i;
    const expMatch = expRegex.exec(requirementsText);
    if (expMatch) {
      requirements.experience = parseInt(expMatch[1], 10);
    }
    
    // Extract skills (this is more complex and would require NLP for better results)
    // For now, we'll use a simple approach with common healthcare skills
    const skillKeywords = [
      'ventilator', 'IV', 'infusion', 'medication administration',
      'patient assessment', 'wound care', 'trauma', 'triage',
      'electronic medical records', 'EMR', 'Epic', 'Cerner',
      'Meditech', 'charting', 'documentation', 'care planning'
    ];
    
    skillKeywords.forEach(skill => {
      if (requirementsText.toLowerCase().includes(skill.toLowerCase())) {
        requirements.skills.push(this.toTitleCase(skill));
      }
    });
    
    return requirements;
  }

  /**
   * Parse shift details into structured format
   * @param shiftDetailsText Shift details text
   * @returns Structured shift details
   */
  private parseShiftDetails(shiftDetailsText?: string): {
    type: string | null;
    hours: number | null;
    schedule: string | null;
  } {
    const shift = {
      type: null as string | null,
      hours: null as number | null,
      schedule: null as string | null
    };
    
    if (!shiftDetailsText) {
      return shift;
    }
    
    // Extract shift type
    shift.type = this.extractShiftType(shiftDetailsText);
    
    // Extract hours
    const hoursRegex = /(\d+)\s*hour/i;
    const hoursMatch = hoursRegex.exec(shiftDetailsText);
    if (hoursMatch) {
      shift.hours = parseInt(hoursMatch[1], 10);
    }
    
    // Extract schedule pattern
    const scheduleRegex = /(\d+)x(\d+)/i;
    const scheduleMatch = scheduleRegex.exec(shiftDetailsText);
    if (scheduleMatch) {
      shift.schedule = `${scheduleMatch[1]}x${scheduleMatch[2]}`;
    }
    
    return shift;
  }

  /**
   * Generate SEO title for job
   * @param job Job data
   * @returns SEO title
   */
  private generateSeoTitle(job: Job): string {
    return `${job.title} in ${job.city}, ${job.state} - Travel Nursing Job | Excel Medical Staffing`;
  }

  /**
   * Generate SEO description for job
   * @param job Job data
   * @returns SEO description
   */
  private generateSeoDescription(job: Job): string {
    let description = `${job.title} position at ${job.facilityName} in ${job.city}, ${job.state}. `;
    
    if (job.weeklyHours) {
      description += `${job.weeklyHours} hours per week. `;
    }
    
    if (job.payRate) {
      description += `$${job.payRate.toLocaleString()}/week. `;
    }
    
    if (job.startDate) {
      const startDate = new Date(job.startDate);
      description += `Starting ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. `;
    }
    
    description += 'Apply now with Excel Medical Staffing.';
    
    return description;
  }

  /**
   * Generate SEO keywords for job
   * @param job Job data
   * @returns SEO keywords
   */
  private generateSeoKeywords(job: Job): string[] {
    const keywords = [
      `${job.title} jobs`,
      `travel nursing ${job.city}`,
      `${job.specialty} ${job.city}`,
      `healthcare staffing ${job.state}`,
      `${job.facilityName} jobs`,
      `travel nurse jobs ${job.state}`,
      `${job.specialty} travel nurse`,
      `healthcare jobs ${job.city} ${job.state}`
    ];
    
    return keywords;
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