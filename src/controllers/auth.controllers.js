const userModel = require('../models/user.model.js');

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
 * @description Clears single active authorization cookie profile session context
 */
async function logoutUserController(req, res, next) {
    try {
        return res
            .status(200)
            .clearCookie("token", { ...COOKIE_OPTIONS, maxAge: 0 })
            .json({
                status: "success",
                message: "Logged out cleanly from current device session."
            });
    } catch (error) {
        next(error);
    }
}

/**
 * @controller logoutFromAllDevicesController
 * @description Atomically increments user token version to invalidate all active tokens globally
 */
async function logoutFromAllDevicesController(req, res, next) {
    try {
        // Enforce atomic integer increment on the specific account context layer
        await userModel.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });

        return res
            .status(200)
            .clearCookie("token", { ...COOKIE_OPTIONS, maxAge: 0 })
            .json({
                status: "success",
                message: "Global account clearance complete. Logged out of all devices successfully."
            });
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