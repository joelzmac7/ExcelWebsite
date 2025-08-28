/**
 * Job Repository
 * 
 * This repository handles database operations for jobs, providing an abstraction
 * layer between the database and the application services.
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import { Job, JobSearchParams } from '../models/job.model';

export class JobRepository {
  private readonly prisma: PrismaClient;
  private readonly logger: Logger;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger.child({ repository: 'JobRepository' });
  }

  /**
   * Find a job by ID
   * 
   * @param id Job ID
   * @returns Job or null if not found
   */
  async findById(id: string): Promise<Job | null> {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id },
        include: {
          facility: true,
          recruiter: true
        }
      });

      return job ? this.mapToModel(job) : null;
    } catch (error) {
      this.logger.error({
        message: 'Failed to find job by ID',
        error: error instanceof Error ? error.message : String(error),
        jobId: id
      });
      throw error;
    }
  }

  /**
   * Find a job by external ID
   * 
   * @param externalId External job ID
   * @returns Job or null if not found
   */
  async findByExternalId(externalId: string): Promise<Job | null> {
    try {
      const job = await this.prisma.job.findUnique({
        where: { externalId },
        include: {
          facility: true,
          recruiter: true
        }
      });

      return job ? this.mapToModel(job) : null;
    } catch (error) {
      this.logger.error({
        message: 'Failed to find job by external ID',
        error: error instanceof Error ? error.message : String(error),
        externalId
      });
      throw error;
    }
  }

  /**
   * Find jobs by search parameters
   * 
   * @param params Search parameters
   * @returns Jobs and total count
   */
  async findByParams(params: JobSearchParams): Promise<{ jobs: Job[]; total: number }> {
    try {
      // Build where clause based on search parameters
      const where: any = {};

      // Filter by status
      if (params.status) {
        where.status = params.status;
      } else {
        // Default to active jobs only
        where.status = 'active';
      }

      // Filter by specialty
      if (params.specialty) {
        if (Array.isArray(params.specialty)) {
          where.specialty = { in: params.specialty };
        } else {
          where.specialty = params.specialty;
        }
      }

      // Filter by state
      if (params.state) {
        if (Array.isArray(params.state)) {
          where.state = { in: params.state };
        } else {
          where.state = params.state;
        }
      }

      // Filter by city
      if (params.city) {
        if (Array.isArray(params.city)) {
          where.city = { in: params.city };
        } else {
          where.city = params.city;
        }
      }

      // Filter by ZIP code
      if (params.zipCode) {
        where.zipCode = params.zipCode;
      }

      // Filter by pay rate
      if (params.minPay) {
        where.payRate = {
          ...where.payRate,
          gte: params.minPay
        };
      }

      if (params.maxPay) {
        where.payRate = {
          ...where.payRate,
          lte: params.maxPay
        };
      }

      // Filter by shift type
      if (params.shiftType) {
        if (Array.isArray(params.shiftType)) {
          where.shiftType = { in: params.shiftType };
        } else {
          where.shiftType = params.shiftType;
        }
      }

      // Filter by start date
      if (params.startDate) {
        where.startDate = {
          gte: new Date(params.startDate)
        };
      }

      // Filter by end date
      if (params.endDate) {
        where.endDate = {
          lte: new Date(params.endDate)
        };
      }

      // Filter by facility type
      if (params.facilityType) {
        where.facility = {
          type: Array.isArray(params.facilityType)
            ? { in: params.facilityType }
            : params.facilityType
        };
      }

      // Filter by featured status
      if (params.isFeatured !== undefined) {
        where.isFeatured = params.isFeatured;
      }

      // Filter by urgent status
      if (params.isUrgent !== undefined) {
        where.isUrgent = params.isUrgent;
      }

      // Filter by recruiter
      if (params.recruiterId) {
        where.recruiterId = params.recruiterId;
      }

      // Full-text search by keywords
      if (params.keywords) {
        where.OR = [
          { title: { search: params.keywords } },
          { description: { search: params.keywords } },
          { requirements: { search: params.keywords } },
          { benefits: { search: params.keywords } }
        ];
      }

      // Determine pagination
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      // Determine sorting
      let orderBy: any = { updatedAt: 'desc' };
      if (params.sort) {
        const [field, direction] = params.sort.split(':');
        orderBy = { [field]: direction || 'asc' };
      }

      // Execute query
      const [jobs, total] = await Promise.all([
        this.prisma.job.findMany({
          where,
          include: {
            facility: true,
            recruiter: true
          },
          skip,
          take: limit,
          orderBy
        }),
        this.prisma.job.count({ where })
      ]);

      return {
        jobs: jobs.map(job => this.mapToModel(job)),
        total
      };
    } catch (error) {
      this.logger.error({
        message: 'Failed to find jobs by parameters',
        error: error instanceof Error ? error.message : String(error),
        params
      });
      throw error;
    }
  }

  /**
   * Find featured jobs
   * 
   * @param limit Maximum number of jobs to return
   * @returns Featured jobs
   */
  async findFeatured(limit: number = 10): Promise<Job[]> {
    try {
      const jobs = await this.prisma.job.findMany({
        where: {
          status: 'active',
          isFeatured: true
        },
        include: {
          facility: true,
          recruiter: true
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });

      return jobs.map(job => this.mapToModel(job));
    } catch (error) {
      this.logger.error({
        message: 'Failed to find featured jobs',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Find recent jobs
   * 
   * @param limit Maximum number of jobs to return
   * @returns Recent jobs
   */
  async findRecent(limit: number = 10): Promise<Job[]> {
    try {
      const jobs = await this.prisma.job.findMany({
        where: {
          status: 'active'
        },
        include: {
          facility: true,
          recruiter: true
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      return jobs.map(job => this.mapToModel(job));
    } catch (error) {
      this.logger.error({
        message: 'Failed to find recent jobs',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Find similar jobs
   * 
   * @param jobId Job ID to find similar jobs for
   * @param limit Maximum number of jobs to return
   * @returns Similar jobs
   */
  async findSimilar(jobId: string, limit: number = 5): Promise<Job[]> {
    try {
      // Get the job to find similar jobs for
      const job = await this.prisma.job.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        return [];
      }

      // Find jobs with the same specialty and state
      const similarJobs = await this.prisma.job.findMany({
        where: {
          id: { not: jobId },
          status: 'active',
          specialty: job.specialty,
          state: job.state
        },
        include: {
          facility: true,
          recruiter: true
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });

      return similarJobs.map(job => this.mapToModel(job));
    } catch (error) {
      this.logger.error({
        message: 'Failed to find similar jobs',
        error: error instanceof Error ? error.message : String(error),
        jobId
      });
      throw error;
    }
  }

  /**
   * Create a new job
   * 
   * @param job Job data
   * @returns Created job
   */
  async create(job: Job): Promise<Job> {
    try {
      const createdJob = await this.prisma.job.create({
        data: this.mapToPrisma(job),
        include: {
          facility: true,
          recruiter: true
        }
      });

      return this.mapToModel(createdJob);
    } catch (error) {
      this.logger.error({
        message: 'Failed to create job',
        error: error instanceof Error ? error.message : String(error),
        job
      });
      throw error;
    }
  }

  /**
   * Update an existing job
   * 
   * @param id Job ID
   * @param job Job data
   * @returns Updated job
   */
  async update(id: string, job: Partial<Job>): Promise<Job> {
    try {
      const updatedJob = await this.prisma.job.update({
        where: { id },
        data: this.mapToPrisma(job as Job, true),
        include: {
          facility: true,
          recruiter: true
        }
      });

      return this.mapToModel(updatedJob);
    } catch (error) {
      this.logger.error({
        message: 'Failed to update job',
        error: error instanceof Error ? error.message : String(error),
        jobId: id,
        job
      });
      throw error;
    }
  }

  /**
   * Upsert a job (create if not exists, update if exists)
   * 
   * @param job Job data
   * @returns Upserted job
   */
  async upsert(job: Job): Promise<Job> {
    try {
      // Check if job exists by external ID
      const existingJob = await this.prisma.job.findUnique({
        where: { externalId: job.externalId }
      });

      if (existingJob) {
        // Update existing job
        return this.update(existingJob.id, job);
      } else {
        // Create new job
        return this.create(job);
      }
    } catch (error) {
      this.logger.error({
        message: 'Failed to upsert job',
        error: error instanceof Error ? error.message : String(error),
        externalId: job.externalId
      });
      throw error;
    }
  }

  /**
   * Delete a job
   * 
   * @param id Job ID
   * @returns Whether the job was deleted
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.job.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: 'Failed to delete job',
        error: error instanceof Error ? error.message : String(error),
        jobId: id
      });
      throw error;
    }
  }

  /**
   * Mark a job as deleted
   * 
   * @param externalId External job ID
   * @returns Whether the job was marked as deleted
   */
  async markAsDeleted(externalId: string): Promise<boolean> {
    try {
      const job = await this.prisma.job.findUnique({
        where: { externalId }
      });

      if (!job) {
        return false;
      }

      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'expired',
          updatedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: 'Failed to mark job as deleted',
        error: error instanceof Error ? error.message : String(error),
        externalId
      });
      throw error;
    }
  }

  /**
   * Increment job view count
   * 
   * @param id Job ID
   * @returns Updated view count
   */
  async incrementViewCount(id: string): Promise<number> {
    try {
      const job = await this.prisma.job.update({
        where: { id },
        data: {
          viewsCount: {
            increment: 1
          }
        }
      });

      return job.viewsCount;
    } catch (error) {
      this.logger.error({
        message: 'Failed to increment job view count',
        error: error instanceof Error ? error.message : String(error),
        jobId: id
      });
      throw error;
    }
  }

  /**
   * Increment job application count
   * 
   * @param id Job ID
   * @returns Updated application count
   */
  async incrementApplicationCount(id: string): Promise<number> {
    try {
      const job = await this.prisma.job.update({
        where: { id },
        data: {
          applicationsCount: {
            increment: 1
          }
        }
      });

      return job.applicationsCount;
    } catch (error) {
      this.logger.error({
        message: 'Failed to increment job application count',
        error: error instanceof Error ? error.message : String(error),
        jobId: id
      });
      throw error;
    }
  }

  /**
   * Map Prisma job model to application job model
   * 
   * @param prismaJob Prisma job model
   * @returns Application job model
   */
  private mapToModel(prismaJob: any): Job {
    return {
      id: prismaJob.id,
      externalId: prismaJob.externalId,
      title: prismaJob.title,
      specialty: prismaJob.specialty,
      facilityName: prismaJob.facilityName,
      facilityId: prismaJob.facilityId,
      facilityType: prismaJob.facility?.type || null,
      city: prismaJob.city,
      state: prismaJob.state,
      zipCode: prismaJob.zipCode,
      coordinates: prismaJob.latitude && prismaJob.longitude
        ? { latitude: prismaJob.latitude, longitude: prismaJob.longitude }
        : null,
      startDate: prismaJob.startDate?.toISOString() || null,
      endDate: prismaJob.endDate?.toISOString() || null,
      weeklyHours: prismaJob.weeklyHours,
      shiftDetails: prismaJob.shiftDetails || '',
      shiftType: prismaJob.shiftType,
      payRate: prismaJob.payRate,
      housingStipend: prismaJob.housingStipend,
      requirements: prismaJob.requirements || '',
      benefits: prismaJob.benefits || '',
      description: prismaJob.description || '',
      status: prismaJob.status,
      isFeatured: prismaJob.isFeatured,
      isUrgent: prismaJob.isUrgent,
      createdAt: prismaJob.createdAt.toISOString(),
      updatedAt: prismaJob.updatedAt.toISOString(),
      recruiterId: prismaJob.recruiterId,
      viewsCount: prismaJob.viewsCount,
      applicationsCount: prismaJob.applicationsCount,
      seoTitle: prismaJob.seoTitle,
      seoDescription: prismaJob.seoDescription,
      seoKeywords: prismaJob.seoKeywords,
      parsedRequirements: prismaJob.parsedRequirements,
      parsedShift: prismaJob.parsedShift,
      metadata: prismaJob.metadata
    };
  }

  /**
   * Map application job model to Prisma job model
   * 
   * @param job Application job model
   * @param isUpdate Whether this is an update operation
   * @returns Prisma job model
   */
  private mapToPrisma(job: Job, isUpdate: boolean = false): any {
    const prismaJob: any = {
      externalId: job.externalId,
      title: job.title,
      specialty: job.specialty,
      facilityName: job.facilityName,
      facilityId: job.facilityId,
      city: job.city,
      state: job.state,
      zipCode: job.zipCode || null,
      startDate: job.startDate ? new Date(job.startDate) : null,
      endDate: job.endDate ? new Date(job.endDate) : null,
      weeklyHours: job.weeklyHours,
      shiftDetails: job.shiftDetails || '',
      shiftType: job.shiftType || null,
      payRate: job.payRate,
      housingStipend: job.housingStipend || null,
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      description: job.description || '',
      status: job.status,
      isFeatured: job.isFeatured,
      isUrgent: job.isUrgent,
      recruiterId: job.recruiterId || null,
      seoTitle: job.seoTitle || null,
      seoDescription: job.seoDescription || null,
      seoKeywords: job.seoKeywords || [],
      parsedRequirements: job.parsedRequirements || null,
      parsedShift: job.parsedShift || null,
      metadata: job.metadata || {}
    };

    // Add coordinates if available
    if (job.coordinates) {
      prismaJob.latitude = job.coordinates.latitude;
      prismaJob.longitude = job.coordinates.longitude;
    }

    // Add timestamps for create operation
    if (!isUpdate) {
      prismaJob.createdAt = new Date();
      prismaJob.updatedAt = new Date();
      prismaJob.viewsCount = 0;
      prismaJob.applicationsCount = 0;
    } else {
      prismaJob.updatedAt = new Date();
    }

    return prismaJob;
  }
}