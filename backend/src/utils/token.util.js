const crypto = require('crypto');

/**
 * Generates a cryptographically secure reset token
 * Returns both the raw token (for email link) and hashed version (for DB storage)
 */
function generateResetToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, hashedToken };
}

module.exports = { generateResetToken };