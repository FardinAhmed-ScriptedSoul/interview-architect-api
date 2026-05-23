const { createClient } = require('redis');
const config = require('./config');

let redisClient = null;

if (config.redis.uri) {
    redisClient = createClient({ url: config.redis.uri });

    redisClient.on('error', (err) => console.error('🔴 Redis Client Error:', err));
    redisClient.on('connect', () => console.log('⚡ Redis Connected Successfully (RAM Engine Active)'));

    // Connect asynchronously without blocking main server event loop
    redisClient.connect().catch(() => {
        console.warn('⚠️ Redis connection failed. Falling back to MongoDB storage engine safely.');
        redisClient = null;
    });
} else {
    console.log('ℹ️ No REDIS_URI provided. Blacklist management defaulting to MongoDB engine.');
}

module.exports = redisClient;