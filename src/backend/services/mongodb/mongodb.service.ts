import { MongoClient, Db } from 'mongodb';
import { logger } from '../../utils/logger';

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private readonly uri: string;
  private readonly dbName: string;

  constructor() {
    this.uri = process.env.MONGODB_URI || 'mongodb://excel:excel_password@mongodb:27017/excel_medical';
    this.dbName = 'excel_medical';
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('MongoDB: Already connected');
      return;
    }

    try {
      logger.info('MongoDB: Connecting to database...');
      this.client = new MongoClient(this.uri);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.isConnected = true;
      logger.info('MongoDB: Connected successfully');
    } catch (error) {
      logger.error('MongoDB: Connection error', { error });
      throw new Error(`Failed to connect to MongoDB: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.client) {
      logger.info('MongoDB: No active connection to close');
      return;
    }

    try {
      await this.client.close();
      this.isConnected = false;
      this.client = null;
      this.db = null;
      logger.info('MongoDB: Disconnected successfully');
    } catch (error) {
      logger.error('MongoDB: Disconnect error', { error });
      throw new Error(`Failed to disconnect from MongoDB: ${error}`);
    }
  }

  getDb(): Db {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB: No active connection. Call connect() first.');
    }
    return this.db;
  }

  getCollection(collectionName: string) {
    return this.getDb().collection(collectionName);
  }

  async createIndexes(): Promise<void> {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB: No active connection. Call connect() first.');
    }

    try {
      logger.info('MongoDB: Creating indexes...');
      
      // Resume collection indexes
      const resumeCollection = this.db.collection('resumes');
      await resumeCollection.createIndex({ userId: 1 });
      await resumeCollection.createIndex({ createdAt: 1 });
      await resumeCollection.createIndex({ 
        parsedData: 'text',
        'extractedSkills.name': 'text',
        'extractedExperience.employer': 'text',
        'extractedExperience.position': 'text'
      });

      // Chat history collection indexes
      const chatCollection = this.db.collection('chatHistory');
      await chatCollection.createIndex({ userId: 1 });
      await chatCollection.createIndex({ sessionId: 1 });
      await chatCollection.createIndex({ timestamp: 1 });

      // Document collection indexes
      const documentCollection = this.db.collection('documents');
      await documentCollection.createIndex({ userId: 1 });
      await documentCollection.createIndex({ documentType: 1 });
      await documentCollection.createIndex({ createdAt: 1 });

      logger.info('MongoDB: Indexes created successfully');
    } catch (error) {
      logger.error('MongoDB: Error creating indexes', { error });
      throw new Error(`Failed to create MongoDB indexes: ${error}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConnected || !this.db) {
      return false;
    }

    try {
      // Ping the database
      await this.db.command({ ping: 1 });
      return true;
    } catch (error) {
      logger.error('MongoDB: Health check failed', { error });
      return false;
    }
  }
}

// Create a singleton instance
const mongoDBService = new MongoDBService();

export { mongoDBService };