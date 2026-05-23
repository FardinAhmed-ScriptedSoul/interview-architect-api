const userModel = require('../models/user.model.js');
const blacklistModel = require('../models/blackList.model.js');
// const jwt = require('jsonwebtoken');
// const config = require('../config/config.js');

const redisClient = require('../config/redis.js');
// Helper configurations for production-grade cookies
const COOKIE_OPTIONS = {
    httpOnly: true, // Prevents XSS script execution reads
    secure: process.env.NODE_ENV === 'production', // Forces SSL encryption transmission
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required cross-origin support for cloud setups
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days active life span
};

/**
 * @controller registerUserController
 * @description Validates unique payloads and creates pristine secure accounts
 */
async function registerUserController(req, res, next) {
    try {
        const { userName, email, password } = req.body;

        // 1. Basic Payload Validation Check
        if (!userName || !email || !password) {
            return res.status(400).json({ status: "failed", message: "Please provide all required parameters." });
        }

        // 2. Prevent duplication conflicts
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ status: "failed", message: "An account with this email address already exists." });
        }

        // 3. Create document instance
        const user = await userModel.create({ userName, email, password });
        
        // 4. Generate dynamic credentials session
        const token = user.generateAuthToken();
        user.password = undefined; // Strip hash sequence from response output

        return res
            .status(201)
            .cookie("token", token, COOKIE_OPTIONS)
            .json({
                status: "success",
                message: "Account provisioned successfully.",
                data: { user }
            });
    } catch (error) {
        next(error); // Hand off to global centralized router handler safely
    }
}

/**
 * @controller loginUserController
 * @description Validates credentials and handles credential authorization
 */

async function loginUserController(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: "failed", message: "Email and password parameters are mandatory." });
        }

        // Fetch user with hidden elements
        const user = await userModel.findOne({ email }).select("+password +tokenVersion");
        
        // 💡 FIXED: Invoke the method directly on the 'user' instance document!
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ status: "failed", message: "Invalid credentials provided." });
        }

        const token = user.generateAuthToken();
        user.password = undefined;
        user.tokenVersion = undefined;

        return res
            .status(200)
            .cookie("token", token, COOKIE_OPTIONS)
            .json({
                status: "success",
                message: "Authentication successful.",
                data: { user }
            });
    } catch (error) {
        next(error);
    }
}

/**
 * @controller logoutUserController
 * @description Instantly invalidates token on both local RAM and permanent storage
 */
async function logoutUserController(req, res, next) {
    try {
        const token = req.token; // Pulled straight from updated authMiddleware
        
        // 📐 Calculate exact expiration delta to prevent bloating storage space
        let remainingSeconds = 3600; // Default fallback to 1 hour
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
            }
        } catch (e) { /* use fallback if decoding fails */ }

        if (remainingSeconds > 0) {
            // 1. If Redis is alive, cache it instantly to RAM
            if (redisClient && redisClient.isOpen) {
                await redisClient.set(`blacklist:${token}`, 'true', { EX: remainingSeconds });
            }
            
            // 2. Always persist to MongoDB TTL index collection as a reliable source of truth
            const expiresAtDate = new Date(Date.now() + remainingSeconds * 1000);
            await blacklistModel.create({ token, expiresAt: expiresAtDate }).catch(() => {
                // Catch silent duplicate entries gracefully
            });
        }

        return res
            .status(200)
            .clearCookie("token", { ...COOKIE_OPTIONS, maxAge: 0 })
            .json({ status: "success", message: "Logged out completely and securely." });
    } catch (error) {
        next(error);
    }
}

/**
 * @controller logoutFromAllDevicesController
 * @description High-security cross-cutting concern: increments tokenVersion, invalidating all issued tokens
 */
async function logoutFromAllDevicesController(req, res, next) {
    try {
        // Increment the atomic version counter on the user document
        await userModel.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });

        // Blacklist the current token immediately for extra protection
        const token = req.token;
        if (token) {
            if (redisClient && redisClient.isOpen) {
                await redisClient.set(`blacklist:${token}`, 'true', { EX: 3600 });
            }
            await blacklistModel.create({ token, expiresAt: new Date(Date.now() + 3600 * 1000) }).catch(() => {});
        }

        return res
            .status(200)
            .clearCookie("token", { ...COOKIE_OPTIONS, maxAge: 0 })
            .json({ status: "success", message: "Global authorization revoked. Logged out of all devices." });
    } catch (error) {
        next(error);
    }
}
module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    logoutFromAllDevicesController
};