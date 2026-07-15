import serverlessExpress from '@vendia/serverless-express';
import app from './server.js';

// Wraps our Express instance for AWS Lambda execution
export const handler = serverlessExpress({ app });
