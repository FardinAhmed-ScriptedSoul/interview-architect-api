// middlewares/sandboxGuard.js
const User = require('../models/user.model.js');
const Sandbox = require('../models/sandbox.model.js');

const verifySandboxAccess = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // 🛠️ DEVELOPER BACKDOOR BYPASS FOR TESTING
        // Simply append '?reset=true' to your initialization URL, or leave this active while testing
        if (req.query.reset === 'true') {
            await User.findByIdAndUpdate(userId, {
                $set: { sandboxBanUntil: null, penaltyCount: 0 }
            });
            // Also wipe any abandoned active sessions for this test user
            await Sandbox.deleteMany({ userId, status: { $in: ['initialized', 'active'] } });
            console.log("🛠️ Dev Bypass: Cleared all bans and stale sessions for user:", userId);
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User profile record not found." });
        }

        // Check 1: Check for active temporal ban boundaries
        if (user.sandboxBanUntil && user.sandboxBanUntil > new Date()) {
            const remainingTime = Math.ceil((user.sandboxBanUntil - new Date()) / (1000 * 60 * 60));
            return res.status(403).json({
                message: `Access Denied. You have accumulated maximum cheating penalties. Sandbox access is locked for another ${remainingTime} hours.`
            });
        }

        // Check 2: Find any uncompleted sandbox sessions
        const existingActiveSandbox = await Sandbox.findOne({
            userId,
            status: { $in: ['initialized', 'active'] }
        });

        if (existingActiveSandbox) {
            // 💡 Time Exhaustion Safety: Auto-terminate sessions older than 25 minutes
            if (existingActiveSandbox.status === 'active' && existingActiveSandbox.startTime) {
                const minutesElapsed = (new Date() - existingActiveSandbox.startTime) / (1000 * 60);
                if (minutesElapsed > 25) { 
                    existingActiveSandbox.status = 'terminated';
                    existingActiveSandbox.endTime = new Date();
                    await existingActiveSandbox.save();
                    return next(); // Stale session cleared, allow them to make a new one!
                }
            }

            // 💡 Initialization Safety: If the user is stuck on an "initialized" state 
            // but manually hit 'quit' or the frontend lost trace, let them overwrite it if it's dead weight.
            if (existingActiveSandbox.status === 'initialized') {
                const initAgeMinutes = (new Date() - existingActiveSandbox.createdAt) / (1000 * 60);
                // If it's older than 10 mins and unstarted, flush it out
                if (initAgeMinutes > 10) {
                    await Sandbox.findByIdAndDelete(existingActiveSandbox._id);
                    return next();
                }
            }

            return res.status(400).json({
                message: "You already have an uncompleted sandbox session running.",
                sandboxId: existingActiveSandbox._id,
                status: existingActiveSandbox.status
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal sandbox gatekeeper validation fault.", error: error.message });
    }
};

module.exports = { verifySandboxAccess };