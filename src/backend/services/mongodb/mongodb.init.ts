import { mongoDBService } from './mongodb.service';
import { logger } from '../../utils/logger';

/**
 * Initialize MongoDB collections and indexes
 * This function should be called when the application starts
 */
export async function initializeMongoDB(): Promise<void> {
  try {
    logger.info('Initializing MongoDB...');
    
    // Connect to MongoDB
    await mongoDBService.connect();
    
    // Create collections if they don't exist
    const db = mongoDBService.getDb();
    
    // Get list of existing collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Define required collections
    const requiredCollections = [
      'resumes',
      'chatHistory',
      'documents',
      'contentDrafts',
      'jobMatchData',
      'analyticsEventDetails'
    ];
    
    // Create collections that don't exist
    for (const collectionName of requiredCollections) {
      if (!collectionNames.includes(collectionName)) {
        logger.info(`Creating MongoDB collection: ${collectionName}`);
        await db.createCollection(collectionName);
      }
    }
    
    // Create indexes
    await mongoDBService.createIndexes();
    
    logger.info('MongoDB initialization completed successfully');
  } catch (error) {
    logger.error('Failed to initialize MongoDB', { error });
    throw new Error(`MongoDB initialization failed: ${error}`);
  }
}

/**
 * Validate MongoDB connection
 * This function can be used by health check endpoints
 */
export async function validateMongoDBConnection(): Promise<boolean> {
  try {
    return await mongoDBService.healthCheck();
  } catch (error) {
    logger.error('MongoDB health check failed', { error });
    return false;
  }
}