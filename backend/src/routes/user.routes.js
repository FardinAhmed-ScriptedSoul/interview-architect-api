const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware.js');
const userController = require("../controllers/user.controller.js");
const upload = require("../middlewares/file.middleware.js");
const { processPdfUpload } = require('../middlewares/pdfUpload.middleware.js');

const userRouter = Router();

const verifyUser = authMiddleware.authMiddleware || authMiddleware;

/**
 * @route GET /api/user/profile
 */
userRouter.get("/profile", verifyUser, userController.getUserProfileDashboardController);

/**
 * @route POST /api/user/resume
 */
userRouter.post("/resume", verifyUser, upload.single("resume"), processPdfUpload, userController.saveUserResumeSlotController);

/**
 * @route DELETE /api/user/resume/:resumeId
 */
userRouter.delete("/resume/:resumeId", verifyUser, userController.deleteUserResumeSlotController);

/**
 * @route POST /api/user/sandbox/questions
 */
//userRouter.post("/sandbox/questions", verifyUser, userController.getSandboxQuestionsController);

/**
 * @route POST /api/user/sandbox/evaluate
 */
//userRouter.post("/sandbox/evaluate", verifyUser, userController.evaluateSandboxAnswerController);

/**
 * @route PATCH /api/user/resume/:resumeId
 */
userRouter.patch("/resume/:resumeId", verifyUser, userController.updateUserResumeNicknameController);

module.exports = userRouter;