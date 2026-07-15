import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class TerraClimateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ----------------------------------------------------
    // 1. SQS MESSAGE BROKER (QUEUE)
    // ----------------------------------------------------
    // Dead Letter Queue to capture poison messages after 3 retries
    const deadLetterQueue = new sqs.Queue(this, 'NotificationDLQ', {
      queueName: 'terraclimate-notification-dlq',
      retentionPeriod: cdk.Duration.days(7),
    });

    const notificationQueue = new sqs.Queue(this, 'NotificationQueue', {
      queueName: 'terraclimate-notification-queue',
      visibilityTimeout: cdk.Duration.seconds(30), // Visibility timeout matching Lambda duration
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3,
      },
    });

    // ----------------------------------------------------
    // 2. S3 STORAGE FOR FILE UPLOADS
    // ----------------------------------------------------
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `terraclimate-uploads-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false, // Allow public ACL reads for image display
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'], // Allow PUT requests directly from clients
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    uploadsBucket.grantPublicAccess();

    // ----------------------------------------------------
    // 3. FRONTEND S3 BUCKET WEBSITE
    // ----------------------------------------------------
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `terraclimate-frontend-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
    });

    // ----------------------------------------------------
    // 4. BACKEND EXPRESS API (LAMBDA + API GATEWAY)
    // ----------------------------------------------------
    const apiLambda = new lambda.Function(this, 'ExpressApiLambda', {
      functionName: 'terraclimate-api-handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'src/lambda.handler',
      code: lambda.Code.fromAsset('../backend'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL||'',
        WEATHER_AI_API_KEY: process.env.WEATHER_AI_API_KEY||'',
        REDIS_URL: process.env.REDIS_URL || '',
        AWS_SQS_QUEUE_URL: notificationQueue.queueUrl,
        AWS_S3_UPLOAD_BUCKET: uploadsBucket.bucketName,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
        EMAIL_USER: process.env.EMAIL_USER || '',
        EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD || '',
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
        TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
      },
    });

    // Wire API Gateway to redirect REST endpoints to Express handler
    const gateway = new apigateway.LambdaRestApi(this, 'ExpressApiGateway', {
      handler: apiLambda,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
      },
    });

    // Grant IAM permissions to Express Lambda
    notificationQueue.grantSendMessages(apiLambda);
    uploadsBucket.grantWrite(apiLambda);
    uploadsBucket.grantRead(apiLambda);

    // ----------------------------------------------------
    // 5. STACK OUTPUT SUMMARY
    // ----------------------------------------------------
    new cdk.CfnOutput(this, 'FrontendWebsiteUrl', {
      value: frontendBucket.bucketWebsiteUrl,
      description: 'The live public URL for the React static frontend hosting.',
    });

    new cdk.CfnOutput(this, 'ApiGatewayBaseUrl', {
      value: gateway.url,
      description: 'The base public URL of the Serverless API Gateway endpoints.',
    });

    new cdk.CfnOutput(this, 'SQSQueueUrl', {
      value: notificationQueue.queueUrl,
      description: 'The SQS Message Broker endpoint.',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'The S3 bucket name where the compiled React assets must be deployed.',
    });
  }
}
