/**
 * Nexus Job Data Migration Utility
 * 
 * This script connects to the Nexus API, extracts job data,
 * transforms it to match our schema, and stores it in our database.
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Configuration
const config = {
  nexusApi: {
    baseUrl: process.env.NEXUS_API_BASE_URL || 'https://api.nexus.com',
    apiKey: process.env.NEXUS_API_KEY,
    jobsEndpoint: '/api/jobs',
    batchSize: 100,
  },
  logFile: path.join(__dirname, '../logs/nexus-migration.log'),
  errorFile: path.join(__dirname, '../logs/nexus-migration-errors.log'),
};

// Ensure log directory exists
const logDir = path.dirname(config.logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Logger
const logger = {
  info: (message) => {
    const logEntry = `[INFO] ${new Date().toISOString()} - ${message}\n`;
    fs.appendFileSync(config.logFile, logEntry);
    console.log(message);
  },
  error: (message, error) => {
    const errorDetails = error ? `\n${error.stack || error}` : '';
    const logEntry = `[ERROR] ${new Date().toISOString()} - ${message}${errorDetails}\n`;
    fs.appendFileSync(config.errorFile, logEntry);
    console.error(message, error);
  },
};

/**
 * Create Nexus API client
 * @returns {Object} Axios instance configured for Nexus API
 */
function createNexusApiClient() {
  return axios.create({
    baseURL: config.nexusApi.baseUrl,
    headers: {
      'Authorization': `Bearer ${config.nexusApi.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 30000, // 30 seconds
  });
}

/**
 * Fetch jobs from Nexus API with pagination
 * @param {Object} apiClient Axios instance for Nexus API
 * @param {number} page Page number
 * @param {number} pageSize Number of items per page
 * @returns {Promise<Array>} Job data
 */
async function fetchJobs(apiClient, page = 1, pageSize = config.nexusApi.batchSize) {
  try {
    logger.info(`Fetching jobs from Nexus API - page ${page}, pageSize ${pageSize}`);
    
    const response = await apiClient.get(config.nexusApi.jobsEndpoint, {
      params: {
        page,
        limit: pageSize,
        include_details: true,
      },
    });
    
    if (!response.data || !response.data.data) {
      logger.error('Invalid response format from Nexus API');
      return { jobs: [], totalPages: 0 };
    }
    
    return {
      jobs: response.data.data,
      totalPages: response.data.meta?.total_pages || 1,
    };
  } catch (error) {
    logger.error(`Failed to fetch jobs from Nexus API - page ${page}`, error);
    throw error;
  }
}

/**
 * Transform Nexus job data to match our schema
 * @param {Object} nexusJob Job data from Nexus API
 * @returns {Object} Transformed job data
 */
function transformJobData(nexusJob) {
  // Extract coordinates if available
  let coordinates = null;
  if (nexusJob.coordinates && nexusJob.coordinates.latitude && nexusJob.coordinates.longitude) {
    coordinates = {
      latitude: parseFloat(nexusJob.coordinates.latitude),
      longitude: parseFloat(nexusJob.coordinates.longitude),
    };
  } else if (nexusJob.location && nexusJob.location.coordinates) {
    const coords = nexusJob.location.coordinates;
    if (coords.latitude && coords.longitude) {
      coordinates = {
        latitude: parseFloat(coords.latitude),
        longitude: parseFloat(coords.longitude),
      };
    }
  }
  
  // Map status
  const statusMap = {
    'active': 'active',
    'open': 'active',
    'available': 'active',
    'filled': 'filled',
    'closed': 'filled',
    'expired': 'expired',
    'draft': 'draft',
    'pending': 'draft',
  };
  
  // Extract shift type
  let shiftType = null;
  if (nexusJob.shift_details) {
    const shiftDetails = nexusJob.shift_details.toLowerCase();
    if (shiftDetails.includes('day shift') || shiftDetails.includes('days') || /\bday\b/i.test(shiftDetails)) {
      shiftType = 'Day';
    } else if (shiftDetails.includes('night shift') || shiftDetails.includes('nights') || /\bnight\b/i.test(shiftDetails)) {
      shiftType = 'Night';
    } else if (shiftDetails.includes('evening shift') || shiftDetails.includes('evenings') || /\bevening\b/i.test(shiftDetails)) {
      shiftType = 'Evening';
    }
  }
  
  // Parse weekly hours
  let weeklyHours = 36; // Default
  if (nexusJob.weekly_hours) {
    const hours = parseInt(nexusJob.weekly_hours, 10);
    if (!isNaN(hours)) {
      weeklyHours = hours;
    }
  } else if (nexusJob.shift_details) {
    // Look for patterns like "3x12" or "4x10"
    const shiftPattern = /(\d+)x(\d+)/i.exec(nexusJob.shift_details);
    if (shiftPattern && shiftPattern.length === 3) {
      const shifts = parseInt(shiftPattern[1], 10);
      const hoursPerShift = parseInt(shiftPattern[2], 10);
      
      if (!isNaN(shifts) && !isNaN(hoursPerShift)) {
        weeklyHours = shifts * hoursPerShift;
      }
    }
  }
  
  // Generate SEO title
  const seoTitle = `${nexusJob.title} in ${nexusJob.city}, ${nexusJob.state} - Travel Nursing Job | Excel Medical Staffing`;
  
  // Generate SEO description
  let seoDescription = `${nexusJob.title} position at ${nexusJob.facility_name || nexusJob.facility?.name || ''} in ${nexusJob.city}, ${nexusJob.state}. `;
  if (weeklyHours) {
    seoDescription += `${weeklyHours} hours per week. `;
  }
  if (nexusJob.pay_rate) {
    seoDescription += `$${parseFloat(nexusJob.pay_rate).toLocaleString()}/week. `;
  }
  if (nexusJob.start_date) {
    const startDate = new Date(nexusJob.start_date);
    if (!isNaN(startDate.getTime())) {
      seoDescription += `Starting ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. `;
    }
  }
  seoDescription += 'Apply now with Excel Medical Staffing.';
  
  // Generate SEO keywords
  const seoKeywords = [
    `${nexusJob.title} jobs`,
    `travel nursing ${nexusJob.city}`,
    `${nexusJob.specialty} ${nexusJob.city}`,
    `healthcare staffing ${nexusJob.state}`,
    `${nexusJob.facility_name || nexusJob.facility?.name || ''} jobs`,
    `travel nurse jobs ${nexusJob.state}`,
    `${nexusJob.specialty} travel nurse`,
    `healthcare jobs ${nexusJob.city} ${nexusJob.state}`,
  ];
  
  // Determine if job is urgent
  let isUrgent = false;
  if (nexusJob.is_urgent === true || nexusJob.urgent === true) {
    isUrgent = true;
  } else if (nexusJob.start_date) {
    try {
      const startDate = new Date(nexusJob.start_date);
      const now = new Date();
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(now.getDate() + 14);
      
      if (startDate <= twoWeeksFromNow && startDate >= now) {
        isUrgent = true;
      }
    } catch (error) {
      // Ignore date parsing errors
    }
  }
  
  // Transform to our schema
  return {
    externalId: nexusJob.id.toString(),
    title: nexusJob.title,
    specialty: nexusJob.specialty,
    facilityName: nexusJob.facility_name || nexusJob.facility?.name || '',
    facilityId: nexusJob.facility_id || nexusJob.facility?.id || null,
    city: nexusJob.city || nexusJob.location?.city || '',
    state: nexusJob.state || nexusJob.location?.state || '',
    zipCode: nexusJob.zip_code || nexusJob.location?.zip_code || null,
    latitude: coordinates ? coordinates.latitude : null,
    longitude: coordinates ? coordinates.longitude : null,
    startDate: nexusJob.start_date ? new Date(nexusJob.start_date) : null,
    endDate: nexusJob.end_date ? new Date(nexusJob.end_date) : null,
    weeklyHours,
    shiftDetails: nexusJob.shift_details || '',
    shiftType,
    payRate: parseFloat(nexusJob.pay_rate) || 0,
    housingStipend: nexusJob.housing_stipend ? parseFloat(nexusJob.housing_stipend) : null,
    requirements: nexusJob.requirements || '',
    benefits: nexusJob.benefits || '',
    description: nexusJob.description || '',
    status: statusMap[nexusJob.status?.toLowerCase()] || 'active',
    isFeatured: false, // Default value, to be set by our system
    isUrgent,
    viewsCount: 0,
    applicationsCount: 0,
    seoTitle,
    seoDescription,
    seoKeywords,
    metadata: {
      originalData: nexusJob,
      lastSyncedAt: new Date().toISOString(),
    },
  };
}

/**
 * Save job data to database
 * @param {Object} jobData Transformed job data
 * @returns {Promise<Object>} Saved job
 */
async function saveJob(jobData) {
  try {
    // Check if job already exists by externalId
    const existingJob = await prisma.job.findUnique({
      where: { externalId: jobData.externalId },
    });
    
    if (existingJob) {
      // Update existing job
      return await prisma.job.update({
        where: { id: existingJob.id },
        data: {
          ...jobData,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new job
      return await prisma.job.create({
        data: {
          ...jobData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    logger.error(`Failed to save job ${jobData.externalId}`, error);
    throw error;
  }
}

/**
 * Process a batch of jobs
 * @param {Array} jobs Array of job data from Nexus API
 * @returns {Promise<Object>} Processing results
 */
async function processJobBatch(jobs) {
  const results = {
    total: jobs.length,
    success: 0,
    failed: 0,
    errors: [],
  };
  
  logger.info(`Processing batch of ${jobs.length} jobs`);
  
  for (const job of jobs) {
    try {
      // Transform job data
      const transformedJob = transformJobData(job);
      
      // Save to database
      await saveJob(transformedJob);
      
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        jobId: job.id,
        error: error.message,
      });
      
      logger.error(`Failed to process job ${job.id}`, error);
    }
  }
  
  logger.info(`Batch processing completed: ${results.success} succeeded, ${results.failed} failed`);
  
  return results;
}

/**
 * Main migration function
 */
async function migrateJobs() {
  logger.info('Starting Nexus job data migration');
  
  const apiClient = createNexusApiClient();
  let currentPage = 1;
  let totalPages = 1;
  let totalJobs = 0;
  let successfulJobs = 0;
  let failedJobs = 0;
  
  try {
    // Get first page and determine total pages
    const firstPageResult = await fetchJobs(apiClient, currentPage);
    totalPages = firstPageResult.totalPages;
    
    logger.info(`Found ${totalPages} pages of jobs to process`);
    
    // Process first page
    const firstPageProcessResult = await processJobBatch(firstPageResult.jobs);
    totalJobs += firstPageProcessResult.total;
    successfulJobs += firstPageProcessResult.success;
    failedJobs += firstPageProcessResult.failed;
    
    // Process remaining pages
    currentPage++;
    while (currentPage <= totalPages) {
      const pageResult = await fetchJobs(apiClient, currentPage);
      const processResult = await processJobBatch(pageResult.jobs);
      
      totalJobs += processResult.total;
      successfulJobs += processResult.success;
      failedJobs += processResult.failed;
      
      currentPage++;
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.info(`Migration completed: ${totalJobs} total jobs, ${successfulJobs} succeeded, ${failedJobs} failed`);
  } catch (error) {
    logger.error('Migration failed', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
  
  return {
    totalJobs,
    successfulJobs,
    failedJobs,
  };
}

/**
 * Run the migration
 */
if (require.main === module) {
  migrateJobs()
    .then(results => {
      console.log('Migration completed successfully:', results);
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = {
  migrateJobs,
  transformJobData,
  fetchJobs,
};