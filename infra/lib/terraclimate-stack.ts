import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
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
    // 3. FRONTEND S3 BUCKET & CLOUDFRONT CDN
    // ----------------------------------------------------
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `terraclimate-frontend-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          // Support clean React Router browser paths by rewriting 404/403 errors to index.html
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
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
        DATABASE_URL: 'your-production-postgres-db-url',
        WEATHER_AI_API_KEY: 'your-production-weather-ai-key',
        AWS_SQS_QUEUE_URL: notificationQueue.queueUrl,
        AWS_S3_UPLOAD_BUCKET: uploadsBucket.bucketName,
        AWS_REGION: this.region,
        // Firebase configurations will be mounted during runtime configuration/deployment stage
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
    new cdk.CfnOutput(this, 'CloudFrontDistributionUrl', {
      value: distribution.distributionDomainName,
      description: 'The live public URL for the React static frontend distribution.',
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

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'The CloudFront distribution ID for static web hosting.',
    });
  }
}
