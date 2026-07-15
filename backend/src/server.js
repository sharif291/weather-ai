import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './core/config.js';
import weatherRouter from './modules/weather/weather.routes.js';
import farmsRouter from './modules/farms/farms.routes.js';
import notificationsRouter from './modules/notifications/notifications.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Expose the local uploads folder statically
// Serves images uploaded during mock S3 local development runs
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    redis: config.redisUrl ? 'configured' : 'in-memory-fallback',
    sqs: config.aws.sqsQueueUrl ? 'configured' : 'in-memory-fallback',
    s3: config.aws.s3UploadBucket ? 'configured' : 'local-disk-fallback',
    firebase: config.firebase.projectId ? 'configured' : 'mock-active'
  });
});

// Register feature module routers
app.use('/api/weather', weatherRouter);
app.use('/api/farms', farmsRouter);
app.use('/api/notifications', notificationsRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Error]:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start listening if executed directly (not inside AWS Lambda)
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log('====================================================');
    console.log(`[Server] TerraClimate API listening on port: ${config.port}`);
    console.log(`[Server] Health URL: http://localhost:${config.port}/health`);
    console.log('====================================================');
  });
}

export default app;
