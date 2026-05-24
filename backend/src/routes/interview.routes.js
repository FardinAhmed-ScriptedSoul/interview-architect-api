const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const interviewController = require("../controllers/interview.controller.js");
const upload = require("../middlewares/file.middleware.js");

const interviewRouter = Router();
const { processPdfUpload } = require('../middlewares/pdfUpload.middleware.js');

// 🟢 Safely handle either direct function export or nested property export
const verifyUser = authMiddleware.authMiddleware || authMiddleware;

/**
 * @route POST /api/interview
 * @description Generate a new interview report based on user self-description, job description, and resume PDF
 * @access Private
 */
interviewRouter.post(
    "/",
    verifyUser,
    upload.single("resume"),
    processPdfUpload,
    interviewController. generateInterviewReportController// 🟢 FIXED: Changed from getInterviewReportByIdController
);

/**
 * @route GET /api/interview/report/:interviewId
 * @description Get an individual interview report details by its specific interviewId
 * @access Private
 */
interviewRouter.get(
    "/report/:interviewId",
    verifyUser,
    interviewController.getInterviewReportByIdController // 🟢 FIXED: Changed from getInterviewReport to match your real controller name
);

/**
 * @route GET /api/interview/
 * @description Get a list of all historical interview summaries for the logged-in user
 * @access Private
 */
interviewRouter.get(
    "/",
    verifyUser,
    interviewController.getAllInterviewOfAuserController // 🟢 This matches perfectly!
);

/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description Tailor an ATS-optimized resume template from a report and stream back a binary PDF file attachment
 * @access Private
 */
// 🟢 FIXED: Added the missing route your frontend calls to download tailored resume files
interviewRouter.post(
    "/resume/pdf/:interviewReportId",
    verifyUser,
    interviewController.generateResumePdfController
);

module.exports = interviewRouter;