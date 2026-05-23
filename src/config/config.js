require('dotenv').config();

if (!process.env.MONGODB_URI) {
    console.error("❌ FATAL CONFIGURATION ERROR: MONGODB_URI is required but missing from environment variables.");
    process.exit(1);
}
if (!process.env.JWT_SECRET) {
    console.error("❌ FATAL CONFIGURATION ERROR: JWT_SECRET is required but missing.");
    process.exit(1);
}

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    db: { uri: process.env.MONGODB_URI },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    redis: {
        uri: process.env.REDIS_URI || null
    }
};

Object.freeze(config);
module.exports = config;