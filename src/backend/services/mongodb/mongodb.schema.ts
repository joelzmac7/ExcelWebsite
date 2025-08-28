/**
 * MongoDB Schema Definitions
 * 
 * This file defines the schema structures for MongoDB collections used for unstructured data.
 * These are TypeScript interfaces that document the expected structure of documents in each collection.
 */

// Resume collection schema
export interface Resume {
  _id?: string;
  userId: string;
  originalFilename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  lastParsedAt?: Date;
  parsedData: string;
  extractedSkills: {
    name: string;
    category?: string;
    yearsExperience?: number;
    confidenceScore?: number;
  }[];
  extractedExperience: {
    employer: string;
    position: string;
    startDate?: Date;
    endDate?: Date;
    isCurrent?: boolean;
    location?: string;
    description?: string;
    skills?: string[];
    confidenceScore?: number;
  }[];
  extractedEducation: {
    institution: string;
    degree?: string;
    field?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    confidenceScore?: number;
  }[];
  extractedLicenses: {
    name: string;
    number?: string;
    state?: string;
    issueDate?: Date;
    expirationDate?: Date;
    confidenceScore?: number;
  }[];
  extractedCertifications: {
    name: string;
    issuingOrganization?: string;
    issueDate?: Date;
    expirationDate?: Date;
    confidenceScore?: number;
  }[];
  metadata: {
    parsingVersion: string;
    parsingDuration?: number;
    parsingErrors?: string[];
    aiModelUsed?: string;
    confidenceScore?: number;
    [key: string]: any;
  };
}

// Chat history collection schema
export interface ChatMessage {
  _id?: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    intent?: string;
    entities?: {
      name: string;
      value: string;
      type: string;
    }[];
    sentiment?: string;
    jobSearchParams?: {
      specialty?: string;
      location?: string;
      payRange?: {
        min?: number;
        max?: number;
      };
      shiftType?: string;
      startDate?: Date;
    };
    [key: string]: any;
  };
}

// Document collection schema
export interface Document {
  _id?: string;
  userId: string;
  documentType: 'license' | 'certification' | 'reference' | 'contract' | 'other';
  originalFilename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  expirationDate?: Date;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verificationDetails?: {
    verifiedAt?: Date;
    verifiedBy?: string;
    verificationMethod?: string;
    verificationNotes?: string;
  };
  metadata: {
    documentNumber?: string;
    issuingAuthority?: string;
    issueDate?: Date;
    relatedEntityId?: string; // e.g., licenseId, certificationId
    [key: string]: any;
  };
}

// Content generation collection schema
export interface ContentDraft {
  _id?: string;
  contentType: 'city_guide' | 'specialty_guide' | 'blog' | 'faq' | 'email' | 'social';
  title: string;
  draftContent: string;
  generatedAt: Date;
  generatedBy: string; // userId or 'system'
  status: 'draft' | 'review' | 'approved' | 'published' | 'rejected';
  relatedEntityId?: string; // e.g., cityId, specialtyId
  relatedEntityType?: string; // e.g., 'city', 'specialty'
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  publishedContentId?: string; // ID in the SQL Content table once published
  metadata: {
    promptUsed?: string;
    aiModelUsed?: string;
    generationParameters?: any;
    generationDuration?: number;
    [key: string]: any;
  };
}

// Job matching data collection schema
export interface JobMatchData {
  _id?: string;
  userId: string;
  jobId: string;
  matchScore: number;
  calculatedAt: Date;
  matchFactors: {
    skillMatch: number;
    locationMatch: number;
    payMatch: number;
    shiftTypeMatch: number;
    experienceMatch: number;
    licenseMatch: number;
    [key: string]: number;
  };
  userPreferences: {
    preferredLocations: string[];
    preferredPayRange: {
      min?: number;
      max?: number;
    };
    preferredShiftType?: string;
    [key: string]: any;
  };
  jobDetails: {
    location: string;
    payRate: number;
    shiftType?: string;
    requiredSkills: string[];
    requiredLicenses: string[];
    [key: string]: any;
  };
  metadata: {
    algorithmVersion: string;
    calculationDuration?: number;
    [key: string]: any;
  };
}

// Analytics events collection schema
export interface AnalyticsEventDetail {
  _id?: string;
  eventId: string; // Reference to SQL AnalyticsEvent.id
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  eventType: string;
  eventData: {
    [key: string]: any;
  };
  context: {
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
    browser?: string;
    operatingSystem?: string;
    screenResolution?: string;
    referrer?: string;
    landingPage?: string;
    [key: string]: any;
  };
  metadata: {
    processingTimestamp?: Date;
    processingDuration?: number;
    [key: string]: any;
  };
}