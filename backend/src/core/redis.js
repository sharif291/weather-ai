import Redis from 'ioredis';
import { config } from './config.js';

class CacheService {
  constructor() {
    this.redis = null;
    this.isRedisActive = false;
    this.logs = [];

    if (!config.redisUrl) {
      throw new Error('[Cache Config Error] REDIS_URL environment variable is required but not configured.');
    }

    console.log(`[Cache] Connecting to Redis at: ${config.redisUrl}`);
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
    if (!this.redis) throw new Error('[Cache] Redis client is not initialized.');
    
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
    const strVal = JSON.stringify(value);
    if (!this.redis) throw new Error('[Cache] Redis client is not initialized.');

    await this.redis.setex(key, ttlSeconds, strVal);
    const elapsed = Date.now() - startTime;
    this.logTelemetry('SET', key, 'REDIS', elapsed);
    return true;
  }

  async delete(key) {
    const startTime = Date.now();
    if (!this.redis) throw new Error('[Cache] Redis client is not initialized.');

    await this.redis.del(key);
    const elapsed = Date.now() - startTime;
    this.logTelemetry('DELETE', key, 'REDIS', elapsed);
    return true;
  }
}

export const cacheService = new CacheService();
export default cacheService;
