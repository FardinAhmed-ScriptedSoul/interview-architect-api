require('dotenv').config();

// 🚨 Core System Configuration Validation Guards
if (!process.env.MONGODB_URI) {
    console.error("❌ FATAL CONFIGURATION ERROR: MONGODB_URI is required but missing from environment variables.");
    process.exit(1);
}
if (!process.env.JWT_SECRET) {
    console.error("❌ FATAL CONFIGURATION ERROR: JWT_SECRET is required but missing.");
    process.exit(1);
}

// 📧 Mail Infrastructure Configuration Validation Guards
const requiredMailEnvVars = ['EMAIL_USER', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'REFRESH_TOKEN'];
const missingMailVars = requiredMailEnvVars.filter(key => !process.env[key]);

if (missingMailVars.length > 0) {
    console.error(`❌ FATAL CONFIGURATION ERROR: Mail service variables missing: ${missingMailVars.join(', ')}`);
    process.exit(1);
}

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    db: { 
        uri: process.env.MONGODB_URI 
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    redis: {
        uri: process.env.REDIS_URL || null
    },
    google: {
        genApiKey: process.env.GOOGLE_GEN_API_KEY || null
    },
    mail: {
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
    }
};

Object.freeze(config);
module.exports = config;