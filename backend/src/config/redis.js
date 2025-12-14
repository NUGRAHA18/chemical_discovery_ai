const Redis = require("ioredis");

// Create Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  lazyConnect: true,
});

// Connect with error handling
redis.connect().catch((err) => {
  console.warn(
    "⚠️ Redis connection failed (running without cache):",
    err.message
  );
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

redis.on("close", () => {
  console.log("🔌 Redis connection closed");
});

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      // Check if Redis is connected
      if (redis.status !== "ready") {
        console.log("⚠️ Redis not ready, skipping cache");
        return next();
      }

      const cached = await redis.get(key);

      if (cached) {
        console.log(`✅ Cache HIT: ${key}`);
        return res.json(JSON.parse(cached));
      }

      console.log(`❌ Cache MISS: ${key}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      res.json = (data) => {
        redis.setex(key, duration, JSON.stringify(data)).catch((err) => {
          console.error("Cache set error:", err.message);
        });
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error.message);
      next();
    }
  };
};

const getCached = async (key) => {
  try {
    if (redis.status !== "ready") {
      return null;
    }

    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Redis get error:", error.message);
    return null;
  }
};

const setCache = async (key, value, duration = 300) => {
  try {
    if (redis.status !== "ready") {
      return false;
    }

    await redis.setex(key, duration, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Redis set error:", error.message);
    return false;
  }
};

const deleteCache = async (key) => {
  try {
    if (redis.status !== "ready") {
      return false;
    }

    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Redis delete error:", error.message);
    return false;
  }
};

const deleteCachePattern = async (pattern) => {
  try {
    if (redis.status !== "ready") {
      return false;
    }

    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ Deleted ${keys.length} cache keys matching: ${pattern}`);
    }
    return true;
  } catch (error) {
    console.error("Redis delete pattern error:", error.message);
    return false;
  }
};

const flushCache = async () => {
  try {
    if (redis.status !== "ready") {
      return false;
    }

    await redis.flushdb();
    console.log("🗑️ All cache flushed");
    return true;
  } catch (error) {
    console.error("Redis flush error:", error.message);
    return false;
  }
};

const getCacheStats = async () => {
  try {
    if (redis.status !== "ready") {
      return { connected: false };
    }

    const info = await redis.info("stats");
    const dbsize = await redis.dbsize();

    return {
      connected: true,
      keys: dbsize,
      info: info,
    };
  } catch (error) {
    console.error("Redis stats error:", error.message);
    return { connected: false, error: error.message };
  }
};

module.exports = {
  redis,
  cacheMiddleware,
  getCached,
  setCache,
  deleteCache,
  deleteCachePattern,
  flushCache,
  getCacheStats,
};
