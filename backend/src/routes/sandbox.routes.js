// routes/sandboxRoutes.js
const express = require('express');

const User = require('../models/user.model.js');
const Sandbox = require('../models/sandbox.model.js');
const router = express.Router();
const { 
    initializeSandbox, 
    startSandbox, 
    handlePenalty, 
    submitSandbox,
    quitSandbox,
    getCurrentSandbox // 1. Imported the new controller method
} = require('../controllers/sandboxController.js');
const { verifySandboxAccess } = require('../middlewares/sandboxGuard.js');
const verifyToken = require('../middlewares/auth.middleware.js'); 

/**
 * @route       GET /api/sandbox/current
 * @description Fetches any active or initialized sandbox session for the logged-in user.
 * Used by frontend hooks to synchronize UI state with the database.
 * @access      Protected (Bearer Token)
 */
router.get('/current', verifyToken, getCurrentSandbox); // 2. Added the GET route

/**
 * @route       POST /api/sandbox/initialize
 * @description Evaluates user access, scans active penalty locks, queries the Gemini API engine 
 * to compile a 10-problem assessment stack based on user profile context, and registers an initial sandbox.
 * @access      Protected (Bearer Token)
 * @state       Transition: null ➔ 'initialized'
 */
router.post('/initialize', verifyToken, verifySandboxAccess, initializeSandbox);

/**
 * @route       POST /api/sandbox/start
 * @description Starts the active session lifecycle by activating a frontend stopwatch trigger, 
 * stamping the server-side startTime, and exposing the scrubbed evaluation payload.
 * @access      Protected (Bearer Token)
 * @state       Transition: 'initialized' ➔ 'active'
 */
router.post('/start', verifyToken, startSandbox);

/**
 * @route       POST /api/sandbox/penalty
 * @description Increments cumulative focus-lost penalties during live test execution.
 * Triggers automatic account ban parameters if violation threshold hits 5 entries.
 * @access      Protected (Bearer Token)
 * @state       Transition: 'active' ➔ 'terminated' (only if limit breached)
 */
router.post('/penalty', verifyToken, handlePenalty);

/**
 * @route       POST /api/sandbox/submit
 * @description Commits captured frontend answer structures, executes structural score validation checks,
 * saves processing metrics, and moves session status to completed state.
 * @access      Protected (Bearer Token)
 * @state       Transition: 'active' ➔ 'completed'
 */
router.post('/submit', verifyToken, submitSandbox);

/**
 * @route       DELETE /api/sandbox/quit
 * @description Instantly destroys an active or initialized sandbox session when a student surrenders.
 * @access      Protected (Bearer Token)
 * @state       Transition: 'initialized' or 'active' ➔ Deleted
 */
router.delete('/quit', verifyToken, quitSandbox);


// ADD to sandboxRoutes.js — dev/testing only
// router.post('/dev/reset-ban', verifyToken, async (req, res) => {
//     try {
//         const userId = req.user._id;
//         await User.findByIdAndUpdate(userId, {
//             $set: { sandboxBanUntil: null, penaltyCount: 0 }
//         });
//         await Sandbox.deleteMany({ userId, status: { $in: ['initialized', 'active'] } });
//         res.json({ success: true, message: "Ban and stale sessions cleared." });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// });

module.exports = router;