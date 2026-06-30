const { createClient } = require('redis');
const config = require('./config.js'); // Imports your frozen config object

let redisClient = null;

if (config.redis.uri) {
    // Initialize standard redis driver client targeting the Upstash URI string
    const client = createClient({ url: config.redis.uri });

    client.on('error', (err) => console.error('🔴 Redis Client Runtime Error:', err.message));
    client.on('connect', () => console.log('⚡ Redis Connected Successfully (Upstash RAM Engine Active)'));

    // Bind the global reference to the active connection handle
    redisClient = client;

    // Trigger non-blocking asynchronous socket handshake
    client.connect().catch((err) => {
        console.warn('⚠️ Redis connection failed:', err.message);
        console.warn('⚙️ Falling back to MongoDB storage engine safely for Blacklist / OTP lookups.');
        redisClient = null; // Wipe out reference on failure to redirect operational execution
    });
} else {
    console.log('ℹ️ No REDIS_URL provided. Session/Blacklist management defaulting to MongoDB engine.');
}

module.exports = redisClient;