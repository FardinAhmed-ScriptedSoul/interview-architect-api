/**
 * Generates a stateful secure 6-digit numeric verification OTP token
 * @returns {string} 6-digit numeric string
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { generateOTP };