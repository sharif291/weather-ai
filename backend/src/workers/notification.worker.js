import dotenv from 'dotenv';
dotenv.config();

import { queueService } from '../core/queue.js';
import { handler } from '../handlers/notification-handler.js';

const SLEEP_TIME_MS = 2000; // Poll every 2 seconds if queue is empty

console.log('====================================================');
console.log('[Worker] Notification Background Consumer started...');
console.log(`[Worker] Queue type: ${queueService.isSqsActive ? 'AWS SQS' : 'In-Memory Event Queue'}`);
console.log('====================================================');

const runWorker = async () => {
  while (true) {
    try {
      const msg = await queueService.dequeue();
      
      if (msg) {
        // Construct mock SQS event payload envelope
        const event = {
          Records: [
            {
              body: JSON.stringify(msg.payload),
              receiptHandle: msg.receiptHandle,
              messageId: msg.messageId
            }
          ]
        };
        console.log(`[Worker] Received task [ID: ${msg.messageId}]. Dequeuing to handler...`);
        await handler(event);
        await queueService.delete(msg.receiptHandle);
        console.log(`[Worker] Task [ID: ${msg.messageId}] successfully processed and deleted.`);
      } else {
        // Sleep when queue is empty to prevent processor spikes
        await new Promise((resolve) => setTimeout(resolve, SLEEP_TIME_MS));
      }
    } catch (err) {
      console.error('[Worker] Fatal loop error occurred:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

runWorker();
