/**
 * Jobs Controller
 * 
 * Handles API requests for job-related endpoints
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Logger } = require('../../utils/logger');
const logger = new Logger({ service: 'JobsController' });

/**
 * Get all jobs with filtering and pagination
 */
exports.getJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      specialty,
      state,
      city,
      minPay,
      maxPay,
      shiftType,
      status = 'active',
      sort,
      search
    } = req.query;

    // Build where clause
    const where = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by specialty
    if (specialty) {
      where.specialty = Array.isArray(specialty) 
        ? { in: specialty.split(',') } 
        : specialty;
    }

    // Filter by state
    if (state) {
      where.state = Array.isArray(state) 
        ? { in: state.split(',') } 
        : state;
    }

    // Filter by city
    if (city) {
      where.city = Array.isArray(city) 
        ? { in: city.split(',') } 
        : city;
    }

    // Filter by pay range
    if (minPay || maxPay) {
      where.payRate = {};
      if (minPay) where.payRate.gte = parseFloat(minPay);
      if (maxPay) where.payRate.lte = parseFloat(maxPay);
    }

    // Filter by shift type
    if (shiftType) {
      where.shiftType = Array.isArray(shiftType) 
        ? { in: shiftType.split(',') } 
        : shiftType;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { facilityName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Determine sorting
    let orderBy = { updatedAt: 'desc' };
    if (sort) {
      const [field, direction] = sort.split(':');
      orderBy = { [field]: direction || 'asc' };
    }

    // Execute query with pagination
    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy,
        include: {
          facility: true
        }
      }),
      prisma.job.count({ where })
    ]);

    // Format response
    res.json({
      data: jobs.map(job => formatJobResponse(job)),
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        total_pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching jobs', error);
    next(error);
  }
};

/**
 * Get job by ID
 */
exports.getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        facility: true
      }
    });

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    // Increment view count
    await prisma.job.update({
      where: { id },
      data: {
        viewsCount: {
          increment: 1
        }
      }
    });

    res.json({
      data: formatJobResponse(job)
    });
  } catch (error) {
    logger.error(`Error fetching job with ID ${req.params.id}`, error);
    next(error);
  }
};

/**
 * Get featured jobs
 */
exports.getFeaturedJobs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const jobs = await prisma.job.findMany({
      where: {
        status: 'active',
        isFeatured: true
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        facility: true
      }
    });

    res.json({
      data: jobs.map(job => formatJobResponse(job)),
      meta: {
        count: jobs.length
      }
    });
  } catch (error) {
    logger.error('Error fetching featured jobs', error);
    next(error);
  }
};

/**
 * Get recent jobs
 */
exports.getRecentJobs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const jobs = await prisma.job.findMany({
      where: {
        status: 'active'
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        facility: true
      }
    });

    res.json({
      data: jobs.map(job => formatJobResponse(job)),
      meta: {
        count: jobs.length
      }
    });
  } catch (error) {
    logger.error('Error fetching recent jobs', error);
    next(error);
  }
};

/**
 * Get similar jobs
 */
exports.getSimilarJobs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    // Get the job to find similar jobs for
    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    // Find jobs with the same specialty and state
    const similarJobs = await prisma.job.findMany({
      where: {
        id: { not: id },
        status: 'active',
        specialty: job.specialty,
        state: job.state
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        facility: true
      }
    });

    res.json({
      data: similarJobs.map(job => formatJobResponse(job)),
      meta: {
        count: similarJobs.length
      }
    });
  } catch (error) {
    logger.error(`Error fetching similar jobs for job ID ${req.params.id}`, error);
    next(error);
  }
};

/**
 * Get job specialties
 */
exports.getSpecialties = async (req, res, next) => {
  try {
    // Get distinct specialties from active jobs
    const specialties = await prisma.job.groupBy({
      by: ['specialty'],
      where: {
        status: 'active',
        specialty: {
          not: null
        }
      },
      _count: {
        specialty: true
      }
    });

    // Format response
    const formattedSpecialties = specialties.map(item => ({
      name: item.specialty,
      count: item._count.specialty
    })).sort((a, b) => b.count - a.count);

    res.json({
      data: formattedSpecialties,
      meta: {
        count: formattedSpecialties.length
      }
    });
  } catch (error) {
    logger.error('Error fetching job specialties', error);
    next(error);
  }
};

/**
 * Get job locations
 */
exports.getLocations = async (req, res, next) => {
  try {
    // Get distinct states from active jobs
    const states = await prisma.job.groupBy({
      by: ['state'],
      where: {
        status: 'active',
        state: {
          not: null
        }
      },
      _count: {
        state: true
      }
    });

    // Get distinct cities grouped by state
    const cities = await prisma.job.groupBy({
      by: ['state', 'city'],
      where: {
        status: 'active',
        state: {
          not: null
        },
        city: {
          not: null
        }
      },
      _count: {
        city: true
      }
    });

    // Format response
    const formattedLocations = states.map(state => {
      const stateCities = cities
        .filter(city => city.state === state.state)
        .map(city => ({
          name: city.city,
          count: city._count.city
        }))
        .sort((a, b) => b.count - a.count);

      return {
        state: state.state,
        count: state._count.state,
        cities: stateCities
      };
    }).sort((a, b) => b.count - a.count);

    res.json({
      data: formattedLocations,
      meta: {
        count: formattedLocations.length
      }
    });
  } catch (error) {
    logger.error('Error fetching job locations', error);
    next(error);
  }
};

/**
 * Format job response
 * @param {Object} job Job data from database
 * @returns {Object} Formatted job response
 */
function formatJobResponse(job) {
  // Format dates
  const formattedJob = {
    ...job,
    startDate: job.startDate ? job.startDate.toISOString() : null,
    endDate: job.endDate ? job.endDate.toISOString() : null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString()
  };

  // Add coordinates object if latitude and longitude are available
  if (job.latitude && job.longitude) {
    formattedJob.coordinates = {
      latitude: job.latitude,
      longitude: job.longitude
    };
    
    // Remove individual latitude and longitude fields
    delete formattedJob.latitude;
    delete formattedJob.longitude;
  }

  return formattedJob;
}