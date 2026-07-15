import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { config } from './config.js';

class QueueService {
  constructor() {
    this.sqs = null;
    this.queueUrl = config.aws.sqsQueueUrl;
    this.logs = [];
    this.isSqsActive = false;

    if (!config.aws.accessKeyId || !config.aws.secretAccessKey || !this.queueUrl) {
      throw new Error('[Queue Config Error] AWS SQS configuration variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SQS_QUEUE_URL) are required but not configured.');
    }

    console.log(`[Queue] Connecting to AWS SQS Client in region: ${config.aws.region}`);
    this.sqs = new SQSClient({
      region: config.aws.region,
      endpoint: config.aws.endpointUrlSqs || undefined,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      }
    });
    this.isSqsActive = true;
  }

  logTelemetry(action, payload, source, status) {
    this.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      action, // 'ENQUEUE' | 'DEQUEUE' | 'DELETE'
      payload,
      source, // 'AWS_SQS'
      status  // 'SUCCESS' | 'FAILED'
    });

    if (this.logs.length > 50) {
      this.logs.pop();
    }
  }

  getTelemetryLogs() {
    return this.logs;
  }

  async enqueue(payload) {
    const bodyStr = JSON.stringify(payload);

    if (!this.sqs) {
      throw new Error('[Queue] AWS SQS client is not initialized.');
    }

    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: bodyStr
      });
      const res = await this.sqs.send(command);
      this.logTelemetry('ENQUEUE', payload, 'AWS_SQS', 'SUCCESS');
      console.log(`[Queue] Task pushed to AWS SQS. MsgId: ${res.MessageId}`);
      return { success: true, messageId: res.MessageId };
    } catch (err) {
      console.error('[Queue] AWS SQS SendMessage failed:', err.message);
      this.logTelemetry('ENQUEUE', payload, 'AWS_SQS', 'FAILED');
      throw err;
    }
  }

  async dequeue() {
    if (!this.sqs) {
      throw new Error('[Queue] AWS SQS client is not initialized.');
    }

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 5 // Long-polling
      });
      const res = await this.sqs.send(command);
      
      if (res.Messages && res.Messages.length > 0) {
        const msg = res.Messages[0];
        const payload = JSON.parse(msg.Body);
        this.logTelemetry('DEQUEUE', payload, 'AWS_SQS', 'SUCCESS');
        return {
          messageId: msg.MessageId,
          receiptHandle: msg.ReceiptHandle,
          payload
        };
      }
      return null;
    } catch (err) {
      console.error('[Queue] AWS SQS ReceiveMessage failed:', err.message);
      throw err;
    }
  }

  async delete(receiptHandle) {
    if (!this.sqs) {
      throw new Error('[Queue] AWS SQS client is not initialized.');
    }

    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle
      });
      await this.sqs.send(command);
      this.logTelemetry('DELETE', { receiptHandle }, 'AWS_SQS', 'SUCCESS');
      return true;
    } catch (err) {
      console.error('[Queue] AWS SQS DeleteMessage failed:', err.message);
      this.logTelemetry('DELETE', { receiptHandle }, 'AWS_SQS', 'FAILED');
      throw err;
    }
  }
}

export const queueService = new QueueService();
export default queueService;
