const jwt = require('jsonwebtoken');
const config = require('../config/config.js');
const userModel = require('../models/user.model.js');
const blacklistModel = require('../models/blackList.model.js');
const redisClient = require('../config/redis.js');

/**
 * 🔒 Central Authentication & Session Validation Middleware
 * Validates active tokens across Memory Caches (Redis), Database Fallbacks, and Rotation Layers.
 */
async function authMiddleware(req, res, next) {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ status: "failed", message: "Access denied. Missing token." });
        }

        // =========================================================================
        // 🛡️ THE BLACKLIST SCANNER LAYER (FAIL-FAST)
        // =========================================================================
        
        // 🏃 STEP A: Query lightning-fast Redis RAM if active
        if (redisClient && redisClient.isOpen) {
            const isBlacklisted = await redisClient.get(`blacklist:${token}`);
            if (isBlacklisted) {
                return res.status(401).json({ status: "failed", message: "Session revoked. Token is invalid." });
            }
        } else {
            // 💾 STEP B: Fallback gracefully to MongoDB disk index check
            const isBlacklistedInDB = await blacklistModel.findOne({ token });
            if (isBlacklistedInDB) {
                return res.status(401).json({ status: "failed", message: "Session revoked. Token is invalid." });
            }
        }

        // Decode token payload signatures
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await userModel.findById(decoded._id).select("+tokenVersion");
        
        if (!user || decoded.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ status: "failed", message: "Session expired. Please re-authenticate." });
        }

        req.user = user;
        req.token = token; // 💡 Attach the raw token string to the request for easy access in logout controllers
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ status: "failed", message: "Session expired. Please log in again." });
        }
        return res.status(401).json({ status: "failed", message: "Invalid authentication parameters." });
    }
}

// 🛡️ Safe Export Pattern: Assigns the primary function directly to the export block
// This guarantees that if it is called directly OR destructured, Express always receives a valid function.
authMiddleware.authMiddleware = authMiddleware;

module.exports = authMiddleware;