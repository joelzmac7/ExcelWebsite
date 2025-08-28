/**
 * Facility Repository
 * 
 * This repository handles database operations for healthcare facilities,
 * providing an abstraction layer between the database and the application services.
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import { Facility, FacilitySearchParams, FacilityWithDistance } from '../models/facility.model';

export class FacilityRepository {
  private readonly prisma: PrismaClient;
  private readonly logger: Logger;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger.child({ repository: 'FacilityRepository' });
  }

  /**
   * Find a facility by ID
   * 
   * @param id Facility ID
   * @returns Facility or null if not found
   */
  async findById(id: string): Promise<Facility | null> {
    try {
      const facility = await this.prisma.facility.findUnique({
        where: { id }
      });

      return facility ? this.mapToModel(facility) : null;
    } catch (error) {
      this.logger.error({
        message: 'Failed to find facility by ID',
        error: error instanceof Error ? error.message : String(error),
        facilityId: id
      });
      throw error;
    }
  }

  /**
   * Find a facility by external ID
   * 
   * @param externalId External facility ID
   * @returns Facility or null if not found
   */
  async findByExternalId(externalId: string): Promise<Facility | null> {
    try {
      const facility = await this.prisma.facility.findUnique({
        where: { externalId }
      });

      return facility ? this.mapToModel(facility) : null;
    } catch (error) {
      this.logger.error({
        message: 'Failed to find facility by external ID',
        error: error instanceof Error ? error.message : String(error),
        externalId
      });
      throw error;
    }
  }

  /**
   * Find facilities by search parameters
   * 
   * @param params Search parameters
   * @returns Facilities and total count
   */
  async findByParams(params: FacilitySearchParams): Promise<{ facilities: Facility[]; total: number }> {
    try {
      // Build where clause based on search parameters
      const where: any = {};

      // Filter by name
      if (params.name) {
        where.name = {
          contains: params.name,
          mode: 'insensitive'
        };
      }

      // Filter by type
      if (params.type) {
        if (Array.isArray(params.type)) {
          where.type = { in: params.type };
        } else {
          where.type = params.type;
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

      // Filter by specialties
      if (params.specialties) {
        if (Array.isArray(params.specialties)) {
          where.specialties = {
            hasSome: params.specialties
          };
        } else {
          where.specialties = {
            has: params.specialties
          };
        }
      }

      // Filter by trauma level
      if (params.traumaLevel) {
        if (Array.isArray(params.traumaLevel)) {
          where.traumaLevel = { in: params.traumaLevel };
        } else {
          where.traumaLevel = params.traumaLevel;
        }
      }

      // Filter by bed count
      if (params.minBedCount || params.maxBedCount) {
        where.bedCount = {};
        
        if (params.minBedCount) {
          where.bedCount.gte = params.minBedCount;
        }
        
        if (params.maxBedCount) {
          where.bedCount.lte = params.maxBedCount;
        }
      }

      // Filter by teaching hospital status
      if (params.isTeachingHospital !== undefined) {
        where.isTeachingHospital = params.isTeachingHospital;
      }

      // Filter by Magnet designation
      if (params.isMagnetDesignated !== undefined) {
        where.isMagnetDesignated = params.isMagnetDesignated;
      }

      // Determine pagination
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      // Determine sorting
      let orderBy: any = { name: 'asc' };
      if (params.sort) {
        const [field, direction] = params.sort.split(':');
        orderBy = { [field]: direction || 'asc' };
      }

      // Execute query
      const [facilities, total] = await Promise.all([
        this.prisma.facility.findMany({
          where,
          skip,
          take: limit,
          orderBy
        }),
        this.prisma.facility.count({ where })
      ]);

      return {
        facilities: facilities.map(facility => this.mapToModel(facility)),
        total
      };
    } catch (error) {
      this.logger.error({
        message: 'Failed to find facilities by parameters',
        error: error instanceof Error ? error.message : String(error),
        params
      });
      throw error;
    }
  }

  /**
   * Find facilities near a location
   * 
   * @param latitude Latitude
   * @param longitude Longitude
   * @param radiusMiles Radius in miles
   * @param limit Maximum number of facilities to return
   * @returns Facilities with distance
   */
  async findNearLocation(
    latitude: number,
    longitude: number,
    radiusMiles: number = 50,
    limit: number = 20
  ): Promise<FacilityWithDistance[]> {
    try {
      // Convert miles to kilometers for the Haversine formula
      const radiusKm = radiusMiles * 1.60934;
      
      // Use raw SQL for the Haversine formula
      const facilities = await this.prisma.$queryRaw`
        SELECT 
          f.*,
          (
            6371 * acos(
              cos(radians(${latitude})) * 
              cos(radians(f."latitude")) * 
              cos(radians(f."longitude") - radians(${longitude})) + 
              sin(radians(${latitude})) * 
              sin(radians(f."latitude"))
            )
          ) AS distance
        FROM "Facility" f
        WHERE 
          f."latitude" IS NOT NULL AND 
          f."longitude" IS NOT NULL
        HAVING distance < ${radiusKm}
        ORDER BY distance
        LIMIT ${limit}
      `;

      return (facilities as any[]).map(facility => ({
        ...this.mapToModel(facility),
        distance: parseFloat((facility.distance / 1.60934).toFixed(1)) // Convert back to miles
      }));
    } catch (error) {
      this.logger.error({
        message: 'Failed to find facilities near location',
        error: error instanceof Error ? error.message : String(error),
        latitude,
        longitude,
        radiusMiles
      });
      throw error;
    }
  }

  /**
   * Find facilities by state
   * 
   * @param state State code
   * @param limit Maximum number of facilities to return
   * @returns Facilities in the state
   */
  async findByState(state: string, limit: number = 100): Promise<Facility[]> {
    try {
      const facilities = await this.prisma.facility.findMany({
        where: {
          state: state.toUpperCase()
        },
        take: limit,
        orderBy: { name: 'asc' }
      });

      return facilities.map(facility => this.mapToModel(facility));
    } catch (error) {
      this.logger.error({
        message: 'Failed to find facilities by state',
        error: error instanceof Error ? error.message : String(error),
        state
      });
      throw error;
    }
  }

  /**
   * Find facilities by city and state
   * 
   * @param city City name
   * @param state State code
   * @param limit Maximum number of facilities to return
   * @returns Facilities in the city and state
   */
  async findByCityAndState(city: string, state: string, limit: number = 50): Promise<Facility[]> {
    try {
      const facilities = await this.prisma.facility.findMany({
        where: {
          city: {
            equals: city,
            mode: 'insensitive'
          },
          state: state.toUpperCase()
        },
        take: limit,
        orderBy: { name: 'asc' }
      });

      return facilities.map(facility => this.mapToModel(facility));
    } catch (error) {
      this.logger.error({
        message: 'Failed to find facilities by city and state',
        error: error instanceof Error ? error.message : String(error),
        city,
        state
      });
      throw error;
    }
  }

  /**
   * Create a new facility
   * 
   * @param facility Facility data
   * @returns Created facility
   */
  async create(facility: Facility): Promise<Facility> {
    try {
      const createdFacility = await this.prisma.facility.create({
        data: this.mapToPrisma(facility)
      });

      return this.mapToModel(createdFacility);
    } catch (error) {
      this.logger.error({
        message: 'Failed to create facility',
        error: error instanceof Error ? error.message : String(error),
        facility
      });
      throw error;
    }
  }

  /**
   * Update an existing facility
   * 
   * @param id Facility ID
   * @param facility Facility data
   * @returns Updated facility
   */
  async update(id: string, facility: Partial<Facility>): Promise<Facility> {
    try {
      const updatedFacility = await this.prisma.facility.update({
        where: { id },
        data: this.mapToPrisma(facility as Facility, true)
      });

      return this.mapToModel(updatedFacility);
    } catch (error) {
      this.logger.error({
        message: 'Failed to update facility',
        error: error instanceof Error ? error.message : String(error),
        facilityId: id,
        facility
      });
      throw error;
    }
  }

  /**
   * Upsert a facility (create if not exists, update if exists)
   * 
   * @param facility Facility data
   * @returns Upserted facility
   */
  async upsert(facility: Facility): Promise<Facility> {
    try {
      // Check if facility exists by external ID
      const existingFacility = await this.prisma.facility.findUnique({
        where: { externalId: facility.externalId }
      });

      if (existingFacility) {
        // Update existing facility
        return this.update(existingFacility.id, facility);
      } else {
        // Create new facility
        return this.create(facility);
      }
    } catch (error) {
      this.logger.error({
        message: 'Failed to upsert facility',
        error: error instanceof Error ? error.message : String(error),
        externalId: facility.externalId
      });
      throw error;
    }
  }

  /**
   * Delete a facility
   * 
   * @param id Facility ID
   * @returns Whether the facility was deleted
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.facility.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: 'Failed to delete facility',
        error: error instanceof Error ? error.message : String(error),
        facilityId: id
      });
      throw error;
    }
  }

  /**
   * Map Prisma facility model to application facility model
   * 
   * @param prismaFacility Prisma facility model
   * @returns Application facility model
   */
  private mapToModel(prismaFacility: any): Facility {
    return {
      id: prismaFacility.id,
      externalId: prismaFacility.externalId,
      name: prismaFacility.name,
      type: prismaFacility.type,
      address: prismaFacility.address || '',
      city: prismaFacility.city,
      state: prismaFacility.state,
      zipCode: prismaFacility.zipCode || '',
      coordinates: prismaFacility.latitude && prismaFacility.longitude
        ? { latitude: prismaFacility.latitude, longitude: prismaFacility.longitude }
        : null,
      phone: prismaFacility.phone,
      website: prismaFacility.website,
      description: prismaFacility.description || '',
      bedCount: prismaFacility.bedCount,
      traumaLevel: prismaFacility.traumaLevel,
      specialties: prismaFacility.specialties || [],
      imageUrl: prismaFacility.imageUrl,
      rating: prismaFacility.rating,
      isTeachingHospital: prismaFacility.isTeachingHospital,
      isMagnetDesignated: prismaFacility.isMagnetDesignated,
      createdAt: prismaFacility.createdAt.toISOString(),
      updatedAt: prismaFacility.updatedAt.toISOString(),
      metadata: prismaFacility.metadata
    };
  }

  /**
   * Map application facility model to Prisma facility model
   * 
   * @param facility Application facility model
   * @param isUpdate Whether this is an update operation
   * @returns Prisma facility model
   */
  private mapToPrisma(facility: Facility, isUpdate: boolean = false): any {
    const prismaFacility: any = {
      externalId: facility.externalId,
      name: facility.name,
      type: facility.type,
      address: facility.address || '',
      city: facility.city,
      state: facility.state,
      zipCode: facility.zipCode || '',
      phone: facility.phone,
      website: facility.website,
      description: facility.description || '',
      bedCount: facility.bedCount,
      traumaLevel: facility.traumaLevel,
      specialties: facility.specialties || [],
      imageUrl: facility.imageUrl,
      rating: facility.rating,
      isTeachingHospital: facility.isTeachingHospital,
      isMagnetDesignated: facility.isMagnetDesignated,
      metadata: facility.metadata || {}
    };

    // Add coordinates if available
    if (facility.coordinates) {
      prismaFacility.latitude = facility.coordinates.latitude;
      prismaFacility.longitude = facility.coordinates.longitude;
    }

    // Add timestamps for create operation
    if (!isUpdate) {
      prismaFacility.createdAt = new Date();
      prismaFacility.updatedAt = new Date();
    } else {
      prismaFacility.updatedAt = new Date();
    }

    return prismaFacility;
  }
}