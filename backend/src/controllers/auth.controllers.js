const config = require('../config/config.js');
const userModel = require('../models/user.model.js');
const blacklistModel = require('../models/blackList.model.js');
const redisClient = require('../config/redis.js');
const { sendEmail } = require('../services/sendmail.js'); 
const { sendAndStoreOTP, verifyCachedOTPToken } = require('./otp.controllers.js');
const jwt = require('jsonwebtoken');

const crypto = require('crypto');

const { generateResetToken } = require('../utils/token.util.js');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',   
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
    maxAge: 7 * 24 * 60 * 60 * 1000 
};

/**
 * @controller registerUserController
 * @description Phase 1: Validates profile options and hands off orchestration to the OTP Controller
 */
async function registerUserController(req, res, next) {
    try {
        const { userName, email, password } = req.body;

        if (!userName || !email || !password) {
            return res.status(400).json({ status: "failed", message: "Please provide all required parameters." });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ status: "failed", message: "An account with this email address already exists." });
        }

        await sendAndStoreOTP(userName, email, { userName, email, password });

        return res.status(200).json({
            status: "success",
            message: "A verification validation code has been sent to your email. Please verify within 5 minutes."
        });
    } catch (error) {
        next(error); 
    }
}

/**
 * @controller verifyOTPAndRegisterController
 * @description Phase 2: Interrogates the OTP controller. On a true evaluation context, registers profile to MongoDB disk
 */
async function verifyOTPAndRegisterController(req, res, next) {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ status: "failed", message: "Email and confirmation OTP parameters are required." });
        }

        const validatedPayload = await verifyCachedOTPToken(email, otp);
        
        if (!validatedPayload) {
            return res.status(401).json({ 
                status: "failed", 
                message: "Invalid or expired confirmation verification token provided." 
            });
        }

        const user = await userModel.create({
            userName: validatedPayload.userName,
            email: validatedPayload.email,
            password: validatedPayload.password
        });

        const token = user.generateAuthToken();
        user.password = undefined;

        await redisClient.del(`registration_pending:${email}`);

        const welcomeSubject = `Welcome to Interview Architect! 🚀`;
        const welcomeTextFallback = `Hello ${user.userName},\n\nWelcome to Interview Architect! We are excited to help you prepare for your technical and system design interviews.`;
        const welcomeHtmlBody = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4A90E2; text-align: center;">Welcome to Interview Architect, ${user.userName}! 👋</h2>
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

        sendEmail(user.email, welcomeSubject, welcomeTextFallback, welcomeHtmlBody).catch(err => {
            console.error("❌ Silent Fallback: Welcome email failed to send:", err.message);
        });

        return res
            .status(201)
            .cookie("token", token, COOKIE_OPTIONS)
            .json({
                status: "success",
                message: "Email identity verified. Account established successfully.",
                data: { user }
            });
    } catch (error) {
        next(error);
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
        const token = req.token; 
        let remainingSeconds = 3600; 

        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
            }
        } catch (e) { }

        if (remainingSeconds > 0) {
            if (redisClient && redisClient.isOpen) {
                await redisClient.set(`blacklist:${token}`, 'true', { EX: remainingSeconds });
            }
            const expiresAtDate = new Date(Date.now() + remainingSeconds * 1000);
            await blacklistModel.create({ token, expiresAt: expiresAtDate }).catch(() => {});
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
 * @description High-security concern: increments tokenVersion and dispatches a Security Alert email.
 */
async function logoutFromAllDevicesController(req, res, next) {
    try {
        const targetUser = await userModel.findById(req.user._id);
        if (!targetUser) {
            return res.status(404).json({ status: "failed", message: "User not found." });
        }

        await userModel.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });

        const token = req.token;
        if (token) {
            if (redisClient && redisClient.isOpen) {
                await redisClient.set(`blacklist:${token}`, 'true', { EX: 3600 });
            }
            await blacklistModel.create({ token, expiresAt: new Date(Date.now() + 3600 * 1000) }).catch(() => {});
        }

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
                <hr style="border: 0; border-top: 1px solid #ecc8c5; margin-top: 30px;">
                <p style="font-size: 0.8em; color: #777; text-align: center;">Securely dispatched by the Interview Architect Security Module.</p>
            </div>
        `;

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


/**
 * @controller forgotPasswordController
 * @description Generates reset token, stores hashed version in DB, emails raw link to user
 */
async function forgotPasswordController(req, res, next) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: "failed",
                message: "Email address is required."
            });
        }

        // Always return success even if email not found — prevents user enumeration attacks
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(200).json({
                status: "success",
                message: "If an account with that email exists, a reset link has been sent."
            });
        }

        const { rawToken, hashedToken } = generateResetToken();

        // Store hashed token in DB — never store raw token
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();

        // Build reset link pointing to frontend
        const frontendUrl = config.env === 'production'
            ? process.env.FRONTEND_URL
            : 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password/${rawToken}`;

        // Send email — non-blocking failure
        const subject = '🔑 Reset Your Interview.AI Password';
        const textFallback = `Reset your password: ${resetLink}`;
        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; background: #0d1117; border: 1px solid #2a3348; border-radius: 16px;">
                <h2 style="color: #ff2d78; text-align: center;">Reset Your Password</h2>
                <p style="color: #e6edf3;">Hi <strong>${user.userName}</strong>,</p>
                <p style="color: #7d8590; line-height: 1.7;">
                    We received a request to reset your Interview.AI password. 
                    Click the button below — this link expires in <strong style="color:#e6edf3">15 minutes</strong>.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetLink}" 
                       style="display:inline-block; padding: 14px 32px; background: #ff2d78; color: #fff; 
                              font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 8px;">
                        Reset My Password
                    </a>
                </div>
                <div style="background: rgba(255,45,120,0.08); border: 1px solid rgba(255,45,120,0.2); border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
                    <p style="color: #ff6b9d; font-size: 13px; margin: 0; line-height: 1.6;">
                        🔒 If you didn't request this, ignore this email. Your password won't change.
                    </p>
                </div>
                <p style="color: #484f58; font-size: 11px; word-break: break-all;">
                    Link: ${resetLink}
                </p>
            </div>
        `;

        sendEmail(user.email, subject, textFallback, htmlBody).catch(err => {
            console.error("❌ Reset email failed (non-blocking):", err.message);
        });

        return res.status(200).json({
            status: "success",
            message: "If an account with that email exists, a reset link has been sent."
        });

    } catch (error) {
        next(error);
    }
}

/**
 * @controller resetPasswordController
 * @description Validates reset token from URL, updates password, clears token fields
 */
async function resetPasswordController(req, res, next) {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                status: "failed",
                message: "Reset token and new password are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                status: "failed",
                message: "Password must be at least 6 characters."
            });
        }

        // Hash incoming token to compare against DB stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with matching token that hasn't expired
        const user = await userModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpiry: { $gt: new Date() } // token must not be expired
        }).select('+password');

        if (!user) {
            return res.status(400).json({
                status: "failed",
                message: "Reset token is invalid or has expired. Please request a new one."
            });
        }

        // Update password — pre-save hook in user model will hash it
        user.password = password;
        user.resetPasswordToken = null;
        user.resetPasswordExpiry = null;

        // Invalidate all existing sessions by bumping tokenVersion
        user.tokenVersion = (user.tokenVersion || 0) + 1;

        await user.save();

        return res.status(200).json({
            status: "success",
            message: "Password reset successfully. Please log in with your new password."
        });

    } catch (error) {
        next(error);
    }
}
module.exports = {
    registerUserController,
    verifyOTPAndRegisterController,
    loginUserController,
    logoutUserController,
    logoutFromAllDevicesController,
    getMe,
    forgotPasswordController,   
    resetPasswordController     
};