require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config/config');
const connectDB = require('./src/db/db_connection.js');

(async () => {
    try {
        console.log("Starting System Initialization Pipeline...");
        
        // 1. Establish strict connectivity with MongoDB
        await connectDB();
        
        // 2. Start the HTTP application network socket listener
        const server = app.listen(config.port, () => {
            console.log(`🟢 Server running in [${config.env}] mode on port ${config.port}`);
        });

        // Optional: Graceful shutdown handling for modern server orchestration
        process.on('SIGTERM', () => {
            console.log('👋 SIGTERM received. Shutting down server gracefully...');
            server.close(() => {
                console.log('💤 Process terminated.');
            });
        });

    } catch (initializationError) {
        console.error(`💥 Fatal Server Bootstrap Failure: ${initializationError.message}`);
        process.exit(1);
    }
})();