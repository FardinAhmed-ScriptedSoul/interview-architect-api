
const generateInterviewReport = require("../services/ai.service.js");

// generateResumePdf comes from a different service — create it separately
// (see below)
const generateResumePdf = require("../services/resumePdf.service.js");

const interviewReportModel = require("../models/interviewReport.model.js");
const mongoose = require('mongoose');

/**
 * @description Controller to generate interview report based on user self description, resume and job description
 */
async function generateInterviewReportController(req, res, next) {
    try {
        const { selfDescription, jobDescription } = req.body;
        const resumeTextContent = req.resumeTextContent;

        console.log("Invoking Gemini analysis pipeline...");
        const interViewReportByAi = await generateInterviewReport({
            resume: resumeTextContent,
            selfDescription,
            jobDescription
        });

        console.log("Saving conformant analysis report to MongoDB...");
        // Fallback safety checking for both system layout variations of user ids
        const userId = req.user?._id || req.user?.id;

        // 🟢 FIXED: Updated variable usage
        const interviewReport = await interviewReportModel.create({
            user: userId,
            title: interViewReportByAi.title,
            resume: resumeTextContent,
            selfDescription,
            jobDescription,
            ...interViewReportByAi 
        });

        return res.status(201).json({
            status: "success",
            message: "Interview report generated successfully",
            interviewReport
        });

    } catch (error) {
        console.error("💥 Controller Pipeline Error:", error);
        next(error);
    }
}

/**
 * @description Controller to get interview report by interviewId
 */
async function getInterviewReportByIdController(req, res, next) {
    try {
        const { interviewId } = req.params;
        const userId = req.user?._id || req.user?.id;

        // 🟢 FIXED: Updated variable usage
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewId,
            user: userId
        });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found"
            });
        }

        return res.status(200).json({
            message: "Interview report fetched successfully",
            interviewReport
        });
    } catch (error) {
        console.error("💥 Error fetching report by ID:", error);
        next(error); 
    }
}

/**
 * @description Controller to get all interviews of a logged in user
 */
async function getAllInterviewOfAuserController(req, res, next) {
    try {
        const userId = req.user?._id || req.user?.id;
        
        // 🟢 FIXED: Capitalization mismatch resolved. This will now find perfectly!
        const interviewReports = await interviewReportModel.find({ user: userId })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan");

        return res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        });
    } catch (error) {
        console.error("💥 Error fetching user interviews:", error);
        next(error);
    }
}

/**
 * @description Controller to generate resume PDF based on user data
 */
async function generateResumePdfController(req, res, next) {
    try {
        const { interviewReportId } = req.params;

        // 🟢 FIXED: Updated variable usage
        const interviewReport = await interviewReportModel.findById(interviewReportId);

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            });
        }

        const { resume, jobDescription, selfDescription } = interviewReport;

        // 🟢 FIXED: This will now call the imported Puppeteer renderer successfully
        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription });

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
            "Content-Length": pdfBuffer.length
        });

        return res.send(pdfBuffer);
    } catch (error) {
        console.error("💥 Error generating PDF stream:", error);
        next(error);
    }
}

module.exports = {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewOfAuserController,
    generateResumePdfController
};