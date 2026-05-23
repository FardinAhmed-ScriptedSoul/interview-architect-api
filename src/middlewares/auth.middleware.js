const jwt = require('jsonwebtoken');
const config = require('../config/config.js');
const userModel = require('../models/user.model.js');

async function authMiddleware(req, res, next) {
    try {
        // 1. Extract token from secure HttpOnly Cookies
        let token = req.cookies?.token;

        // Fallback option for standard Authorization Bearer header lines
        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                status: "failed",
                message: "Authentication failed: Missing secure session token token credentials."
            });
        }

        // 2. Decode signature integrity against system secret keys
        const decoded = jwt.verify(token, config.jwt.secret);

        // 3. Retrieve user profile and explicitly include tokenVersion for audit tracking
        const user = await userModel.findById(decoded._id).select("+tokenVersion");
        if (!user) {
            return res.status(401).json({
                status: "failed",
                message: "Authentication failed: Bound account no longer exists."
            });
        }

        // 🔒 4. Multi-Device Logout Enforcement Rule
        // If tokenVersion in the JWT is less than the current DB version, the session is revoked.
        if (decoded.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({
                status: "failed",
                message: "Session expired: Security state changed. Please re-authenticate."
            });
        }

        // Attach verified user instance directly to the request cycle stream
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ status: "failed", message: "Session expired. Please log in again." });
        }
        return res.status(401).json({ status: "failed", message: "Invalid token authentication signature payload." });
    }
}

module.exports = { authMiddleware };