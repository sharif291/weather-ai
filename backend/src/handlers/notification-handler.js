import { firebaseAdmin } from '../core/firebase.js';
import { prisma } from '../core/db.js';
import { emailService } from '../services/email.service.js';
import { smsService } from '../services/sms.service.js';
import { discordService } from '../services/discord.service.js';

const processMessage = async (msg) => {
  const { payload } = msg;
  console.log(`[NotificationHandler] Processing task [ID: ${msg.messageId}]:`, payload);

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
      console.log(`[NotificationHandler] Master Switch is OFF for farm: ${farmName}. Skipping all dispatches.`);
      return;
    }

    const shouldNotifyInApp = !config || config.notifyInApp;
    const shouldNotifyEmail = config && config.notifyEmail;
    const shouldNotifySms = config && config.notifySms;
    const shouldNotifyDiscord = config && config.notifyDiscord;

    // Create the AlertLog unconditionally in PostgreSQL first, so geocoder duplicate scanners can track it
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
      console.log(`[NotificationHandler] PostgreSQL AlertLog created successfully for farm ID: ${farmId}`);
    }

    // 1. In-App Notification Flow
    if (shouldNotifyInApp) {
      const firestore = firebaseAdmin.firestore();
      const timestamp = new Date();

      if (firestore) {
        if (type === 'GLOBAL_BROADCAST') {
          await firestore.collection('global_broadcasts').add({
            message,
            createdAt: timestamp
          });
          console.log(`[NotificationHandler] [In-App Channel] Realtime global alert written to Firestore /global_broadcasts`);
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
          console.log(`[NotificationHandler] [In-App Channel] Realtime targeted alert written to Firestore for User: ${userId}`);
        }
      } else {
        console.warn(`[NotificationHandler] [In-App Channel] Skipped writing to Firestore: SDK is not active.`);
      }
    } else {
      console.log(`[NotificationHandler] [In-App Channel] Disabled by user alert configuration.`);
    }

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
  } catch (err) {
    console.error(`[NotificationHandler] Failed to process message [ID: ${msg.messageId}]:`, err.message);
    throw err;
  }
};

export const handler = async (event) => {
  console.log(`[NotificationHandler] SQS Event received: ${JSON.stringify(event)}`);
  
  if (!event || !event.Records) {
    console.log('[NotificationHandler] No SQS records found in event.');
    return;
  }

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body);
      await processMessage({
        messageId: record.messageId,
        payload
      });
    } catch (err) {
      console.error(`[NotificationHandler] Error processing SQS record [ID: ${record.messageId}]:`, err.message);
      throw err;
    }
  }
};
