/**
 * Excel Medical Staffing Backend API
 * Main entry point for the backend service
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const { MongoClient } = require('mongodb');
const redis = require('redis');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 4000;

// Initialize database clients
const prisma = new PrismaClient();
let mongoClient;
let redisClient;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(express.json()); // JSON body parser
app.use(morgan('dev')); // Request logging

// Initialize MongoDB connection
async function connectToMongoDB() {
  try {
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    console.log('Connected to MongoDB');
    return mongoClient.db();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Initialize Redis connection
async function connectToRedis() {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });
    
    await redisClient.connect();
    console.log('Connected to Redis');
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/jobs', require('./routes/jobs'));
app.use('/api/v1/facilities', require('./routes/facilities'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/applications', require('./routes/applications'));
app.use('/api/v1/auth', require('./routes/auth'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
async function startServer() {
  try {
    // Connect to databases
    const mongodb = await connectToMongoDB();
    const redis = await connectToRedis();
    
    // Start Express server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  
  // Close database connections
  await prisma.$disconnect();
  if (mongoClient) await mongoClient.close();
  if (redisClient) await redisClient.quit();
  
  process.exit(0);
});

// Start the server
startServer();