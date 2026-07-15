import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../core/db.js';
import { queueService } from '../core/queue.js';
import { weatherService } from '../modules/weather/weather.service.js';

// Scan interval (e.g. check every 60 seconds for active demonstration)
const SCAN_INTERVAL_MS = 60 * 60 * 1000;

console.log('====================================================');
console.log('[Scanner Worker] Advisory Forecast Scanner started...');
console.log('====================================================');

const evaluateFarmAlerts = async (farm) => {
  const config = farm.alertConfig;
  if (!config || !config.enabled) {
    return;
  }

  const coordStr = `${farm.latitude},${farm.longitude}`;

  try {
    // 1. Fetch current weather for wind speed checks
    const currentData = await weatherService.getCurrent(coordStr);
    const windSpeed = currentData?.current?.wind_kph || 0;

    // 2. Fetch forecast data for cumulative daily precipitation checks
    const forecastData = await weatherService.getForecast(coordStr);
    const rainLevel = forecastData?.forecast?.forecastday?.[0]?.day?.totalprecip_mm || 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Evaluate Wind Alert
    if (windSpeed > config.windThreshold) {
      // Prevent duplicate notification alerts on the same calendar day (anti-spam)
      const duplicateWind = await prisma.alertLog.findFirst({
        where: {
          farmId: farm.id,
          type: 'WIND_ALERT',
          createdAt: { gte: todayStart }
        }
      });

      if (!duplicateWind) {
        const message = `High wind warnings (${windSpeed.toFixed(1)} km/h) detected on ${farm.name}. Exceeds threshold of ${config.windThreshold} km/h. Please cancel pesticide spraying.`;
        console.log(`[Scanner] [WIND ALERT TRIGGER] Exceeded limit on ${farm.name}. Enqueuing SQS warning task...`);
        
        await queueService.enqueue({
          type: 'USER_ALERT',
          userId: farm.userId,
          farmId: farm.id,
          farmName: farm.name,
          alertType: 'WIND_ALERT',
          message
        });
      } else {
        console.log(`[Scanner] Wind warning already dispatched today for ${farm.name}. Skipping duplicate.`);
      }
    }

    // Evaluate Storm/Precipitation Alert
    if (rainLevel > config.rainThreshold) {
      // Prevent duplicate notification alerts on the same calendar day (anti-spam)
      const duplicateRain = await prisma.alertLog.findFirst({
        where: {
          farmId: farm.id,
          type: 'STORM_ALERT',
          createdAt: { gte: todayStart }
        }
      });

      if (!duplicateRain) {
        const message = `Severe precipitation warnings (${rainLevel.toFixed(1)} mm) forecast on ${farm.name}. Exceeds threshold of ${config.rainThreshold} mm. Hold fertilizer applications.`;
        console.log(`[Scanner] [STORM ALERT TRIGGER] Exceeded limit on ${farm.name}. Enqueuing SQS warning task...`);

        await queueService.enqueue({
          type: 'USER_ALERT',
          userId: farm.userId,
          farmId: farm.id,
          farmName: farm.name,
          alertType: 'STORM_ALERT',
          message
        });
      } else {
        console.log(`[Scanner] Storm/Rain warning already dispatched today for ${farm.name}. Skipping duplicate.`);
      }
    }

  } catch (err) {
    console.error(`[Scanner Error] Failed to scan farm ID: ${farm.id}:`, err.message);
  }
};

const runScanner = async () => {
  while (true) {
    try {
      console.log(`[Scanner] Beginning farm forecast evaluation scan...`);
      const farms = await prisma.farm.findMany({
        include: { alertConfig: true }
      });

      for (const farm of farms) {
        await evaluateFarmAlerts(farm);
      }

      console.log(`[Scanner] Completed scan. Waiting ${SCAN_INTERVAL_MS / 1000}s for next evaluation cycle.`);
      await new Promise((resolve) => setTimeout(resolve, SCAN_INTERVAL_MS));
    } catch (err) {
      console.error('[Scanner Fatal] Scanner loop error:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
};

runScanner();
