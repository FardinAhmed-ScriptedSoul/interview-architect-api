require('dotenv').config();

// 💡 1. Run Fail-Fast Assertions before even exporting the object
if (!process.env.MONGODB_URI) {
    console.error("❌ FATAL CONFIGURATION ERROR: MONGODB_URI is required but missing from environment variables.");
    process.exit(1); // Stop the server instantly right here
}

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    db: {
        uri: process.env.MONGODB_URI
    }
};

Object.freeze(config);

module.exports = config;