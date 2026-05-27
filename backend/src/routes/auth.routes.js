const { Router } = require('express');
const authControllers = require('../controllers/auth.controllers.js');
const { authMiddleware } = require('../middlewares/auth.middleware.js');

const authRouter = Router();

/**
 * @route POST /api/auth/register-request
 * @description Initiate registration process by validating user credentials and dispatching a 6-digit OTP code to the email address
 * @access Public
 */
authRouter.post("/register-request", authControllers.registerUserController);

/**
 * @route POST /api/auth/register-verify
 * @description Complete registration process by validating the email OTP code against the Redis memory cache and establishing the persistent MongoDB user document
 * @access Public
 */
authRouter.post("/register-verify", authControllers.verifyOTPAndRegisterController);

/**
 * @route POST /api/auth/login
 * @description Authenticate an existing user using email and password credentials, returning a secure HttpOnly session JWT token cookie
 * @access Public
 */
authRouter.post("/login", authControllers.loginUserController);

/**
 * @route POST /api/auth/logout
 * @description Terminate the current session by clearing the client cookie and sending the active JWT token to the Redis and MongoDB blacklists
 * @access Private
 */
authRouter.post("/logout", authMiddleware, authControllers.logoutUserController);

/**
 * @route POST /api/auth/logout-all
 * @description Global sign-out mechanism that increments the user's token tokenVersion field, invalidating all issued active tokens across all devices concurrently
 * @access Private
 */
authRouter.post("/logout-all", authMiddleware, authControllers.logoutFromAllDevicesController);

/**
 * @route GET /api/auth/get-me
 * @description Interrogate the active authentication session context to fetch and display the authenticated user's profile details
 * @access Private
 */
authRouter.get("/get-me", authMiddleware, authControllers.getMe);



/**
 * @route POST /api/auth/forgot-password
 * @description Sends a password reset link to the user's email
 * @access Public
 */
authRouter.post("/forgot-password", authControllers.forgotPasswordController);

/**
 * @route POST /api/auth/reset-password/:token
 * @description Validates reset token and updates password
 * @access Public
 */
authRouter.post("/reset-password/:token", authControllers.resetPasswordController);

module.exports = authRouter;