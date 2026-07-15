import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config.js';

class S3Service {
  constructor() {
    this.s3 = null;
    this.bucketName = config.aws.s3UploadBucket;
    this.isS3Active = false;

    if (!config.aws.accessKeyId || !config.aws.secretAccessKey || !this.bucketName) {
      throw new Error('[S3 Config Error] AWS S3 configuration variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_UPLOAD_BUCKET) are required but not configured.');
    }

    console.log(`[S3] Connecting to AWS S3 Client in region: ${config.aws.region}`);
    this.s3 = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      }
    });
    this.isS3Active = true;
  }

  async getPresignedUploadUrl(fileName, contentType) {
    if (!this.s3) {
      throw new Error('[S3] AWS S3 client is not initialized.');
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectKey = `farms/${Date.now()}-${sanitizedName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        ContentType: contentType
      });

      // Signed URL expires in 15 minutes (900 seconds)
      const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 900 });
      
      // Public download URL (assumes the S3 bucket is configured for public read access)
      const downloadUrl = `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${objectKey}`;
      
      console.log(`[S3] Generated S3 presigned upload URL for key: ${objectKey}`);
      return {
        uploadUrl,
        downloadUrl,
        objectKey,
        isMock: false
      };
    } catch (err) {
      console.error('[S3] Failed to generate AWS S3 presigned URL:', err.message);
      throw err;
    }
  }
}

export const s3Service = new S3Service();
export default s3Service;
