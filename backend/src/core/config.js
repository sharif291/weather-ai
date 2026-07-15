import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  weatherAiApiKey: process.env.WEATHER_AI_API_KEY,
  weatherAiBaseUrl: 'https://api.weather-ai.co',
  redisUrl: process.env.REDIS_URL,
  
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sqsQueueUrl: process.env.AWS_SQS_QUEUE_URL,
    s3UploadBucket: process.env.AWS_S3_UPLOAD_BUCKET,
    endpointUrlSqs: process.env.AWS_ENDPOINT_URL_SQS || '',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : null,
  },

  email: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_APP_PASSWORD || '',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_PHONE_NUMBER || '',
  }
};
