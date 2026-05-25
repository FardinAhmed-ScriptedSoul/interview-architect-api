const transporter = require('./mail.services.js'); // Import the initialized instance from sibling file
const config = require('../config/config.js');

/**
 * Modular Utility to Dispatch Emails
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} text - Fallback plain text representation 
 * @param {string} html - Formatted HTML message body
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Interview Architect" <${config.mail.user}>`,
            to,
            subject,
            text,
            html,
        });

        console.log('✉️ Email dispatched successfully! Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Mail execution routing runtime fault:', error.message);
        throw error; // Propagate the error so controllers can handle API error states gracefully
    }
};

module.exports = { sendEmail };