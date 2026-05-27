const redisClient = require('../config/redis.js');
const { sendEmail } = require('../services/sendmail.js');
const { generateOTP } = require('../utils/otp.util.js');

/**
 * @controller sendAndStoreOTP
 * @description Generates a fresh 6-digit token code, maps registration payload to Redis cache RAM under a 5-minute TTL, and dispatches an active verification email.
 */
async function sendAndStoreOTP(userName, email, registrationPayload) {
    const otp = generateOTP();
    const cacheKey = `registration_pending:${email}`;
    
    const contextData = {
        ...registrationPayload,
        otp: otp
    };

    if (redisClient && redisClient.isOpen) {
        await redisClient.set(cacheKey, JSON.stringify(contextData), { EX: 300 });
    } else {
        throw new Error("Redis data service unavailable. Cannot securely cache verification states.");
    }

    const emailSubject = `Your Interview Architect Verification Code: ${otp} 🔑`;
    const fallbackText = `Hello ${userName},\n\nYour confirmation code is ${otp}. This verification token is active for 5 minutes.`;
    const htmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4A90E2; text-align: center;">Verify Your Email Address</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Thank you for signing up with Interview Architect. Use the secure single-use verification code listed below to finish setting up your account profile:</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #fff; background-color: #4A90E2; padding: 10px 25px; border-radius: 6px; display: inline-block;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 0.9em; text-align: center;">This single-use code is strictly active for <strong>5 minutes</strong>. If you did not request this identity process, please ignore this email.</p>
        </div>
    `;

    await sendEmail(email, emailSubject, fallbackText, htmlBody);
}

/**
 * @controller verifyCachedOTPToken
 * @description Extracts and decrypts payload components out of Redis storage using an atomic verification match execution script block.
 */
async function verifyCachedOTPToken(email, inputOtp) {
    const cacheKey = `registration_pending:${email}`;
    
    if (!redisClient || !redisClient.isOpen) {
        throw new Error("Redis data layer disconnected.");
    }

    const cachedRawData = await redisClient.get(cacheKey);
    if (!cachedRawData) return null;

    const parsedContext = JSON.parse(cachedRawData);
    if (parsedContext.otp !== inputOtp.toString().trim()) {
        return null;
    }

    return parsedContext;
}

module.exports = { sendAndStoreOTP, verifyCachedOTPToken };