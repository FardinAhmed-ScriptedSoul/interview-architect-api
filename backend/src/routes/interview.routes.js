const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware.js');
const interviewController = require("../controllers/interview.controller.js");
const upload = require("../middlewares/file.middleware.js");
const { processPdfUpload } = require('../middlewares/pdfUpload.middleware.js');

const interviewRouter = Router();

// Handle either direct export structures or object nested property structures smoothly
const verifyUser = authMiddleware.authMiddleware || authMiddleware;

/**
 * @route GET /api/interview/share/:interviewId
 * @description Public view to access shared interview reports cleanly without bearer auth tokens
 * @access Public (Controller verifies if isPublic is true)
 */
interviewRouter.get(
    "/share/:interviewId",
    interviewController.getPublicShareableReportController
);

/**
 * @route PATCH /api/interview/:interviewId/visibility
 * @description Protected route to flip isPublic state true/false on a report profile
 * @access Private
 */
interviewRouter.patch(
    "/:interviewId/visibility",
    verifyUser,
    interviewController.toggleReportVisibilityController
);

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
    interviewController.generateInterviewReportController
);

/**
 * @route GET /api/interview/report/:interviewId
 * @description Get an individual interview report details by its specific interviewId
 * @access Private
 */
interviewRouter.get(
    "/report/:interviewId",
    verifyUser,
    interviewController.getInterviewReportByIdController
);

/**
 * @route GET /api/interview
 * @description Get a list of all historical interview summaries for the logged-in user
 * @access Private
 */
interviewRouter.get(
    "/",
    verifyUser,
    interviewController.getAllInterviewOfAuserController
);

/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description Tailor an ATS-optimized resume template from a report and stream back a binary PDF file attachment
 * @access Private
 */
interviewRouter.post(
    "/resume/pdf/:interviewReportId",
    verifyUser,
    interviewController.generateResumePdfController
);

module.exports = interviewRouter;