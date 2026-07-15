import { prisma } from '../../core/db.js';
import { queueService } from '../../core/queue.js';

export const getAlertLogs = async (req, res) => {
  try {
    const logs = await prisma.alertLog.findMany({
      where: {
        farm: {
          userId: req.user.id
        }
      },
      include: {
        farm: {
          select: { name: true, cropType: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // limit to last 50 entries
    });
    return res.json(logs);
  } catch (err) {
    console.error('[Notifications] Fetch AlertLogs SQL failure:', err.message);
    return res.status(500).json({ error: 'Database error: Failed to fetch notification logs', details: err.message });
  }
};

export const triggerAlertSimulation = async (req, res) => {
  const { farmId, alertType, customMessage } = req.body;

  if (!farmId || !alertType) {
    return res.status(400).json({ error: 'Missing required body fields: farmId and alertType' });
  }

  try {
    // Verify farm exists and belongs to user
    const farm = await prisma.farm.findFirst({
      where: { id: farmId, userId: req.user.id },
      include: { alertConfig: true }
    });

    if (!farm) {
      return res.status(404).json({ error: 'Simulate failed: Target farm not found or permission denied' });
    }

    const config = farm.alertConfig || { windThreshold: 20.0, rainThreshold: 10.0 };

    const defaultMessages = {
      WIND_ALERT: `High wind warnings (${config.windThreshold + 5} km/h) detected on ${farm.name}. Cancel pesticide spraying.`,
      STORM_ALERT: `Severe storm forecast on ${farm.name}. Rain levels expected to exceed ${config.rainThreshold} mm. Hold fertilizer applications.`
    };

    const messageContent = customMessage || defaultMessages[alertType] || `Weather alert triggered for farm: ${farm.name}`;

    const queuePayload = {
      type: alertType === 'GLOBAL' ? 'GLOBAL_BROADCAST' : 'USER_ALERT',
      userId: req.user.id,
      farmId: farm.id,
      farmName: farm.name,
      alertType,
      message: messageContent
    };

    // Push alert task onto the SQS / Memory queue
    const enqueueRes = await queueService.enqueue(queuePayload);

    console.log(`[Notifications] Enqueued SQS warning task for Farm: ${farm.name}, Type: ${alertType}`);
    return res.json({
      success: true,
      messageId: enqueueRes.messageId,
      message: 'Alert task enqueued successfully to the message broker.'
    });
  } catch (err) {
    console.error('[Notifications] Trigger alert failure:', err.message);
    return res.status(500).json({ error: 'Failed to queue alert task', details: err.message });
  }
};

export const markAlertAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const alertLog = await prisma.alertLog.findFirst({
      where: {
        id,
        farm: {
          userId: req.user.id
        }
      }
    });

    if (!alertLog) {
      return res.status(404).json({ error: 'Alert log not found or permission denied' });
    }

    const updated = await prisma.alertLog.update({
      where: { id },
      data: { read: true }
    });

    console.log(`[Notifications] PostgreSQL AlertLog marked as read. ID: ${id}`);
    return res.json({ success: true, alertLog: updated });
  } catch (err) {
    console.error('[Notifications] Mark AlertLog read failure:', err.message);
    return res.status(500).json({ error: 'Database error: Failed to update notification status', details: err.message });
  }
};

export const markAllAlertsAsRead = async (req, res) => {
  try {
    const updateResult = await prisma.alertLog.updateMany({
      where: {
        read: false,
        farm: {
          userId: req.user.id
        }
      },
      data: { read: true }
    });

    console.log(`[Notifications] PostgreSQL AlertLogs bulk read completed. Count: ${updateResult.count}`);
    return res.json({ success: true, count: updateResult.count });
  } catch (err) {
    console.error('[Notifications] Mark all AlertLogs read failure:', err.message);
    return res.status(500).json({ error: 'Database error: Failed to update notification statuses', details: err.message });
  }
};
