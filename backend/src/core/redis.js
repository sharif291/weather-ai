import Redis from 'ioredis';
import { config } from './config.js';

class CacheService {
  constructor() {
    this.redis = null;
    this.isRedisActive = false;
    this.logs = [];
    this.localCache = new Map();

    if (!config.redisUrl) {
      console.warn('[Cache Warning]  REDIS_URL environment variable is required but not configured. Falling back to in-memory telemetry cache.');
      return;
    }

    console.log(`[Cache] Connecting to Redis at: ${config.redisUrl}`);
    try {
      this.redis = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 3,
        connectTimeout: 5000
      });

      this.redis.on('connect', () => {
        console.log('[Cache] Redis connection established successfully.');
        this.isRedisActive = true;
      });

      this.redis.on('error', (err) => {
        console.error('[Cache] Redis error encountered:', err.message);
        this.isRedisActive = false;
      });
    } catch (err) {
      console.error('[Cache] Redis client creation failed:', err.message);
    }
  }

  logTelemetry(type, key, source, elapsedMs) {
    this.logs.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      type, // 'HIT' | 'MISS' | 'SET' | 'DELETE'
      key,
      source, // 'REDIS'
      elapsedMs
    });
    
    // Cap logs at 50 entries
    if (this.logs.length > 50) {
      this.logs.pop();
    }
  }

  getTelemetryLogs() {
    return this.logs;
  }

  async get(key) {
    const startTime = Date.now();
    if (!this.redis) {
      const val = this.localCache.get(key);
      const elapsed = Date.now() - startTime;
      if (val) {
        this.logTelemetry('HIT', key, 'IN_MEMORY', elapsed);
        return val;
      }
      this.logTelemetry('MISS', key, 'IN_MEMORY', elapsed);
      return null;
    }
    
    const val = await this.redis.get(key);
    const elapsed = Date.now() - startTime;
    if (val) {
      this.logTelemetry('HIT', key, 'REDIS', elapsed);
      return JSON.parse(val);
    }
    this.logTelemetry('MISS', key, 'REDIS', elapsed);
    return null;
  }

  async set(key, value, ttlSeconds = 900) {
    const startTime = Date.now();
    if (!this.redis) {
      this.localCache.set(key, value);
      const elapsed = Date.now() - startTime;
      this.logTelemetry('SET', key, 'IN_MEMORY', elapsed);
      return true;
    }

    const strVal = JSON.stringify(value);
    await this.redis.setex(key, ttlSeconds, strVal);
    const elapsed = Date.now() - startTime;
    this.logTelemetry('SET', key, 'REDIS', elapsed);
    return true;
  }

  async delete(key) {
    const startTime = Date.now();
    if (!this.redis) {
      this.localCache.delete(key);
      const elapsed = Date.now() - startTime;
      this.logTelemetry('DELETE', key, 'IN_MEMORY', elapsed);
      return true;
    }

    await this.redis.del(key);
    const elapsed = Date.now() - startTime;
    this.logTelemetry('DELETE', key, 'REDIS', elapsed);
    return true;
  }
}

export const cacheService = new CacheService();
export default cacheService;
