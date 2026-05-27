const { generateInterviewReport, generateTailoredResume } = require("../services/ai.service.js");
const generateResumePdf = require("../services/resumePdf.service.js");
const interviewReportModel = require("../models/interviewReport.model.js");
const mongoose = require('mongoose');

/**
 * @controller generateInterviewReportController
 * @description Processes multi-part text elements, generating BOTH the analysis matrix and the tailored resume object using Promise.all before saving to MongoDB.
 */
async function generateInterviewReportController(req, res, next) {
    try {
        const { selfDescription, jobDescription } = req.body;
        const resumeTextContent = req.resumeTextContent;

        console.log("🚀 Invoking parallel Gemini analysis & tailoring pipelines...");
        
        // Execute both generation tasks concurrently
        const [interViewReportByAi, tailoredResumeData] = await Promise.all([
            generateInterviewReport({
                resume: resumeTextContent,
                selfDescription,
                jobDescription
            }),
            generateTailoredResume({
                resume: resumeTextContent,
                selfDescription,
                jobDescription
            })
        ]);

        console.log("Saving unified analysis report and tailored resume to MongoDB...");
        const userId = req.user?._id || req.user?.id;

        const interviewReport = await interviewReportModel.create({
            user: userId,
            title: interViewReportByAi.title,
            resume: resumeTextContent,
            selfDescription,
            jobDescription,
            ...interViewReportByAi,
            tailoredResume: tailoredResumeData // 💾 Storing the custom structured resume data here!
        });

        return res.status(201).json({
            status: "success",
            message: "Interview report and tailored resume generated successfully.",
            interviewReport
        });

    } catch (error) {
        console.error("💥 Controller Pipeline Error:", error);
        next(error);
    }
}

/**
 * @controller getInterviewReportByIdController
 * @description Extracts a comprehensive algorithmic, technical question set, and matching analysis block from MongoDB matching the specified ID parameter.
 */
async function getInterviewReportByIdController(req, res, next) {
    try {
        const { interviewId } = req.params;
        const userId = req.user?._id || req.user?.id;

        if (!mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(404).json({
                status: "failed",
                message: "Interview report not found due to an invalid record identifier layout."
            });
        }

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewId,
            user: userId
        });

        if (!interviewReport) {
            return res.status(404).json({
                status: "failed",
                message: "Interview report not found."
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Interview report fetched successfully.",
            interviewReport
        });
    } catch (error) {
        console.error("💥 Error fetching report by ID:", error);
        next(error); 
    }
}

/**
 * @controller getAllInterviewOfAuserController
 * @description Collects a historical time-sorted array tracing every single preview report summary block associated with the active profile token.
 */
async function getAllInterviewOfAuserController(req, res, next) {
    try {
        const userId = req.user?._id || req.user?.id;
        
        const interviewReports = await interviewReportModel.find({ user: userId })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan -tailoredResume");

        return res.status(200).json({
            status: "success",
            message: "Interview reports fetched successfully.",
            interviewReports
        });
    } catch (error) {
        console.error("💥 Error fetching user interviews:", error);
        next(error);
    }
}

/**
 * @controller generateResumePdfController
 * @description Pulls pre-generated tailored data or runs an on-the-fly fallback generation catch-up block, then pipes the layout into the PDF engine.
 */
async function generateResumePdfController(req, res, next) {
    try {
        const { interviewReportId } = req.params;

        const interviewReport = await interviewReportModel.findById(interviewReportId);
        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." });
        }

        let tailoredResumeData = interviewReport.tailoredResume;

        // 🛡️ CRITICAL FALLBACK LAYER: Automatically intercept historical records missing the data layout
        if (!tailoredResumeData || !tailoredResumeData.fullName || tailoredResumeData.fullName === 'Candidate Name') {
            console.log("⚠️ Historical report detected without pre-saved tailored data. Executing on-the-fly recovery generation...");
            
            const { resume, jobDescription, selfDescription } = interviewReport;
            
            // Build the structural resume dataset dynamically
            tailoredResumeData = await generateTailoredResume({
                resume,
                jobDescription,
                selfDescription
            });

            // Persist the missing data block directly back down to this record state
            interviewReport.tailoredResume = tailoredResumeData;
            await interviewReport.save();
        }

        console.log(`📄 Compiling high-fidelity PDF layout from data for: ${tailoredResumeData.fullName}`);
        const pdfBuffer = await generateResumePdf(tailoredResumeData);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=Tailored_Resume_${interviewReportId}.pdf`,
            "Content-Length": pdfBuffer.length
        });

        return res.send(pdfBuffer);

    } catch (error) {
        console.error("💥 Error generating tailored resume PDF:", error);
        next(error);
    }
}

/**
 * @controller getPublicShareableReportController
 * @description Bypasses default user ownership validation, serving the analytical roadmap anonymously IF it has been made public.
 */
async function getPublicShareableReportController(req, res, next) {
    try {
        const { interviewId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(404).json({
                status: "failed",
                message: "Shared link format is invalid."
            });
        }

        const interviewReport = await interviewReportModel.findById(interviewId);

        if (!interviewReport) {
            return res.status(404).json({
                status: "failed",
                message: "The requested interview report does not exist."
            });
        }

        // 🛡️ Access Guard: Ensure report visibility is active
        if (!interviewReport.isPublic) {
            return res.status(403).json({
                status: "failed",
                message: "This report profile is restricted to private view mode by the candidate."
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Public shareable report fetched successfully.",
            interviewReport
        });
    } catch (error) {
        console.error("💥 Public Fetch Pipeline Error:", error);
        next(error);
    }
}

/**
 * @controller toggleReportVisibilityController
 * @description Locks onto a user's own interview file profile and safely flips the true/false visibility switch state.
 */
async function toggleReportVisibilityController(req, res, next) {
    try {
        const { interviewId } = req.params;
        const userId = req.user?._id || req.user?.id;

        if (!mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(404).json({
                status: "failed",
                message: "Invalid record layout payload configuration."
            });
        }

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewId,
            user: userId
        });

        if (!interviewReport) {
            return res.status(404).json({
                status: "failed",
                message: "Interview record missing or access unauthorized."
            });
        }

        // Flip boolean value status seamlessly
        interviewReport.isPublic = !interviewReport.isPublic;
        await interviewReport.save();

        return res.status(200).json({
            status: "success",
            message: `Report visibility successfully turned ${interviewReport.isPublic ? 'PUBLIC' : 'PRIVATE'}.`,
            isPublic: interviewReport.isPublic
        });
    } catch (error) {
        console.error("💥 Visibility Update Pipeline Error:", error);
        next(error);
    }
}

module.exports = {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewOfAuserController,
    generateResumePdfController,
    getPublicShareableReportController,
    toggleReportVisibilityController
};