const nodemailer = require('nodemailer');
const config = require('../config/config.js'); // Make sure this relative path targets your config.js location

// 1. Initialize the Secure OAuth2 Transporter Instance
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: config.mail.user,
        clientId: config.mail.clientId,
        clientSecret: config.mail.clientSecret,
        refreshToken: config.mail.refreshToken,
    },
});

// 2. Perform Startup Verification Checks
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Nodemailer failed to verify connection profile:', error.message);
    } else {
        console.log('🚀 Nodemailer system verified: Email engine is active');
    }
});

// Export the active transporter instance directly
module.exports = transporter;