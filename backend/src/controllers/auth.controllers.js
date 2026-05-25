const userModel = require('../models/user.model.js');
const blacklistModel = require('../models/blackList.model.js');
const redisClient = require('../config/redis.js');

// 🟢 NEW: Import your clean, decoupled email dispatch utility function
const { sendEmail } = require('../services/sendmail.js'); 

// Helper configurations with forced cross-origin support for GitHub Codespaces cloud environments
const COOKIE_OPTIONS = {
    httpOnly: true, // Prevents XSS script execution reads
    secure: true,   
    sameSite: 'none', 
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days active life span
};

/**
 * @controller registerUserController
 * @description Validates unique payloads, creates accounts, and dispatches a dynamic Welcome Email.
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

        // 5. 🟢 NEW: Trigger Dynamic HTML Welcome Email
        const welcomeSubject = `Welcome to Interview Architect, ${userName}! 🚀`;
        const welcomeTextFallback = `Hello ${userName},\n\nWelcome to Interview Architect! We are excited to help you prepare for your technical and system design interviews.`;
        const welcomeHtmlBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4A90E2; text-align: center;">Welcome to Interview Architect, ${userName}! 👋</h2>
                <p>We are thrilled to have you join our platform. Our goal is to help you ace your technical coding rounds, master system analysis, and land your dream software engineering role.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4A90E2; margin: 20px 0; border-radius: 4px;">
                    <strong>Get Started Instantly:</strong><br>
                    • Enter your target software engineer job description.<br>
                    • Input your personal engineering skill stack profile.<br>
                    • Generate structured, production-grade AI prep blueprints.
                </div>
                <p style="font-size: 0.9em; color: #666; text-align: center; margin-top: 30px;">
                    Happy practicing!<br><strong>The Interview Architect Team</strong>
                </p>
            </div>
        `;

        // Fire the email asynchronously (allowing it to execute without blocking the HTTP response)
        sendEmail(email, welcomeSubject, welcomeTextFallback, welcomeHtmlBody).catch(err => {
            console.error("❌ Silent Fallback: Welcome email failed to send:", err.message);
        });

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
        
        let remainingSeconds = 3600; // Default fallback to 1 hour
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
            }
        } catch (e) { /* use fallback if decoding fails */ }

        if (remainingSeconds > 0) {
            if (redisClient && redisClient.isOpen) {
                await redisClient.set(`blacklist:${token}`, 'true', { EX: remainingSeconds });
            }
            
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
 * @description High-security concern: increments tokenVersion and dispatches a Security Security Alert email.
 */
async function logoutFromAllDevicesController(req, res, next) {
    try {
        // 1. Fetch user data before modifying token version to personalize the security warning email
        const targetUser = await userModel.findById(req.user._id);
        if (!targetUser) {
            return res.status(404).json({ status: "failed", message: "User not found." });
        }

        // 2. Increment the atomic version counter on the user document
        await userModel.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });

        // 3. Blacklist the current token immediately for extra protection
        const token = req.token;
        if (token) {
            if (redisClient && redisClient.isOpen) {
                await redisClient.set(`blacklist:${token}`, 'true', { EX: 3600 });
            }
            await blacklistModel.create({ token, expiresAt: new Date(Date.now() + 3600 * 1000) }).catch(() => {});
        }

        // 4. 🟢 NEW: Trigger Global Security Account Invalidation Email Warning
        const warningSubject = `⚠️ Security Notification: Logged out of all devices`;
        const warningTextFallback = `Hello ${targetUser.userName},\n\nThis is a security alert confirming that your account was logged out of all active devices. If this wasn't you, please reset your password immediately.`;
        const warningHtmlBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ecc8c5; border-radius: 8px;">
                <h2 style="color: #D0021B; text-align: center;">⚠️ Account Security Notification</h2>
                <p>Hello <strong>${targetUser.userName}</strong>,</p>
                <p>You are receiving this security notification because a global sign-out command was executed for your account. **All active authentication sessions, devices, and browser states have been terminated and blacklisted.**</p>
                
                <div style="background-color: #FFF5F5; border-left: 4px solid #D0021B; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <strong>Activity Details:</strong><br>
                    • <strong>Action:</strong> Global Session Invalidation (Log out from all devices)<br>
                    • <strong>Timestamp:</strong> ${new Date().toUTCString()}
                </div>
                
                <p style="font-size: 0.95em;">
                    <strong>If you authorized this action:</strong> You don't need to do anything. Simply log back in with your password on your current device.
                </p>
                <p style="font-size: 0.95em; color: #D0021B;">
                    <strong>If this wasn't you:</strong> Your account security may have been compromised. Please update your account credentials immediately or contact support.
                </p>
                <hr style="border: 0; border-top: 1px solid #ecc8c5; margin-top: 30px;">
                <p style="font-size: 0.8em; color: #777; text-align: center;">
                    Securely dispatched by the Interview Architect Security Module.
                </p>
            </div>
        `;

        // Dispatched safely into the service tracking stream
        sendEmail(targetUser.email, warningSubject, warningTextFallback, warningHtmlBody).catch(err => {
            console.error("❌ Silent Fallback: Security alert email failed to send:", err.message);
        });

        return res
            .status(200)
            .clearCookie("token", { ...COOKIE_OPTIONS, maxAge: 0 })
            .json({ status: "success", message: "Global authorization revoked. Logged out of all devices." });
    } catch (error) {
        next(error);
    }
}

/**
 * @controller getMe
 * @description Fetches profile information of the currently logged-in user
 * @access Private (Requires valid authMiddleware session)
 */
async function getMe(req, res, next) {
    try {
        const user = req.user;

        return res.status(200).json({
            status: "success",
            message: "User profile retrieved successfully.",
            data: {
                id: user._id,
                userName: user.userName,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        next(error); 
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    logoutFromAllDevicesController,
    getMe
};