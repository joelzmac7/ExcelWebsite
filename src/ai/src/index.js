/**
 * Excel Medical Staffing AI Services
 * Main entry point for the AI services
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Initialize MongoDB client
let mongoClient;

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI service routes
app.use('/api/v1/resume-parser', require('./routes/resume-parser'));
app.use('/api/v1/job-matcher', require('./routes/job-matcher'));
app.use('/api/v1/conversation-ai', require('./routes/conversation-ai'));
app.use('/api/v1/content-generator', require('./routes/content-generator'));

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
    // Connect to MongoDB
    const mongodb = await connectToMongoDB();
    
    // Start Express server
    app.listen(port, () => {
      console.log(`AI Services running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start AI services:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down AI services gracefully...');
  
  // Close database connections
  if (mongoClient) await mongoClient.close();
  
  process.exit(0);
});

// Start the server
startServer();