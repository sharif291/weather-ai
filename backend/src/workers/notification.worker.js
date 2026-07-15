import dotenv from 'dotenv';
dotenv.config();

import { queueService } from '../core/queue.js';
import { firebaseAdmin } from '../core/firebase.js';
import { prisma } from '../core/db.js';
import { emailService } from '../services/email.service.js';
import { smsService } from '../services/sms.service.js';
import { discordService } from '../services/discord.service.js';

const SLEEP_TIME_MS = 2000; // Poll every 2 seconds if queue is empty

console.log('====================================================');
console.log('[Worker] Notification Background Consumer started...');
console.log(`[Worker] Queue type: ${queueService.isSqsActive ? 'AWS SQS' : 'In-Memory Event Queue'}`);
console.log('====================================================');

const processMessage = async (msg) => {
  const { payload, receiptHandle } = msg;
  console.log(`[Worker] Received task [ID: ${msg.messageId}]:`, payload);

  try {
    const { type, userId, farmId, farmName, alertType, message } = payload;

    let config = null;
    if (farmId) {
      config = await prisma.alertConfig.findUnique({
        where: { farmId }
      });
    }

    // Master Switch check
    if (config && !config.enabled) {
      console.log(`[Worker] Master Switch is OFF for farm: ${farmName}. Skipping all dispatches.`);
      await queueService.delete(receiptHandle);
      return;
    }

    const shouldNotifyInApp = !config || config.notifyInApp;
    const shouldNotifyEmail = config && config.notifyEmail;
    const shouldNotifySms = config && config.notifySms;
    const shouldNotifyDiscord = config && config.notifyDiscord;

    // 1. In-App Notification Flow
    if (shouldNotifyInApp) {
      let alertLogId = null;
      if (farmId) {
        const log = await prisma.alertLog.create({
          data: {
            farmId,
            type: alertType || 'ALERT',
            message,
            status: 'DISPATCHED'
          }
        });
        alertLogId = log.id;
        console.log(`[Worker] [In-App Channel] PostgreSQL AlertLog updated successfully for farm ID: ${farmId}`);
      }

      const firestore = firebaseAdmin.firestore();
      const timestamp = new Date();

      if (firestore) {
        if (type === 'GLOBAL_BROADCAST') {
          await firestore.collection('global_broadcasts').add({
            message,
            createdAt: timestamp
          });
          console.log(`[Worker] [In-App Channel] Realtime global alert written to Firestore /global_broadcasts`);
        } else if (type === 'USER_ALERT') {
          await firestore.collection('users').doc(userId).collection('notifications').add({
            message,
            farmId: farmId || null,
            farmName: farmName || 'Your Farm',
            alertType: alertType || 'WEATHER_ALERT',
            createdAt: timestamp,
            read: false,
            alertLogId: alertLogId
          });
          console.log(`[Worker] [In-App Channel] Realtime targeted alert written to Firestore for User: ${userId}`);
        }
      } else {
        console.warn(`[Worker] [In-App Channel] Skipped writing to Firestore: SDK is not active.`);
      }
    } else {
      console.log(`[Worker] [In-App Channel] Disabled by user alert configuration.`);
    }

    // 2. Email Notification Flow
    // 2. Email Notification Flow
    if (shouldNotifyEmail && config.emailAddress) {
      await emailService.send(
        config.emailAddress, 
        `TerraClimate Alert: ${alertType || 'Weather Alert'} for ${farmName}`, 
        message
      );
    }

    // 3. SMS Notification Flow
    if (shouldNotifySms && config.phoneNumber) {
      await smsService.send(config.phoneNumber, message);
    }

    // 4. Discord Notification Flow
    if (shouldNotifyDiscord && config.discordWebhook) {
      await discordService.send(config.discordWebhook, message, farmName);
    }

    // 5. Delete the successfully processed message from the queue
    await queueService.delete(receiptHandle);
    console.log(`[Worker] Task [ID: ${msg.messageId}] successfully processed and deleted.`);
  } catch (err) {
    console.error(`[Worker] Failed to process message [ID: ${msg.messageId}]:`, err.message);
  }
};

const runWorker = async () => {
  while (true) {
    try {
      const msg = await queueService.dequeue();
      
      if (msg) {
        await processMessage(msg);
      } else {
        // Sleep when queue is empty to prevent processor spikes
        await new Promise((resolve) => setTimeout(resolve, SLEEP_TIME_MS));
      }
    } catch (err) {
      console.error('[Worker] Fatal loop error occurred:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // sleep longer on error
    }
  }
};

runWorker();
