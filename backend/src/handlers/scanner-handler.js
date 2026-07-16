import { prisma } from '../core/db.js';
import { queueService } from '../core/queue.js';
import { weatherService } from '../modules/weather/weather.service.js';

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
      const duplicateWind = await prisma.alertLog.findFirst({
        where: {
          farmId: farm.id,
          type: 'WIND_ALERT',
          createdAt: { gte: todayStart }
        }
      });

      if (!duplicateWind) {
        const message = `High wind warnings (${windSpeed.toFixed(1)} km/h) detected on ${farm.name}. Exceeds threshold of ${config.windThreshold} km/h. Please cancel pesticide spraying.`;
        console.log(`[ScannerHandler] [WIND ALERT TRIGGER] Exceeded limit on ${farm.name}. Enqueuing SQS warning task...`);
        
        await queueService.enqueue({
          type: 'USER_ALERT',
          userId: farm.userId,
          farmId: farm.id,
          farmName: farm.name,
          alertType: 'WIND_ALERT',
          message
        });
      } else {
        console.log(`[ScannerHandler] Wind warning already dispatched today for ${farm.name}. Skipping duplicate.`);
      }
    }

    // Evaluate Storm/Precipitation Alert
    if (rainLevel > config.rainThreshold) {
      const duplicateRain = await prisma.alertLog.findFirst({
        where: {
          farmId: farm.id,
          type: 'STORM_ALERT',
          createdAt: { gte: todayStart }
        }
      });

      if (!duplicateRain) {
        const message = `Severe precipitation warnings (${rainLevel.toFixed(1)} mm) forecast on ${farm.name}. Exceeds threshold of ${config.rainThreshold} mm. Hold fertilizer applications.`;
        console.log(`[ScannerHandler] [STORM ALERT TRIGGER] Exceeded limit on ${farm.name}. Enqueuing SQS warning task...`);

        await queueService.enqueue({
          type: 'USER_ALERT',
          userId: farm.userId,
          farmId: farm.id,
          farmName: farm.name,
          alertType: 'STORM_ALERT',
          message
        });
      } else {
        console.log(`[ScannerHandler] Storm/Rain warning already dispatched today for ${farm.name}. Skipping duplicate.`);
      }
    }

  } catch (err) {
    console.error(`[ScannerHandler Error] Failed to scan farm ID: ${farm.id}:`, err.message);
  }
};

export const handler = async (event) => {
  console.log('[ScannerHandler] Advisory Forecast Scan trigger initiated:', JSON.stringify(event));

  try {
    const farms = await prisma.farm.findMany({
      include: { alertConfig: true }
    });

    console.log(`[ScannerHandler] Found ${farms.length} farms to evaluate.`);
    for (const farm of farms) {
      await evaluateFarmAlerts(farm);
    }
    console.log('[ScannerHandler] Advisory Forecast Scan execution completed.');
  } catch (err) {
    console.error('[ScannerHandler] Fatal error in scanner execution:', err.message);
    throw err;
  }
};
