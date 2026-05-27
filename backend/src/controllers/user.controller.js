const userModel = require("../models/user.model.js");
const interviewReportModel = require("../models/interviewReport.model.js");
const mongoose = require("mongoose");

async function getUserProfileDashboardController(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    const user = await userModel
      .findById(userId)
      .select(
        "-password -tokenVersion -resetPasswordToken -resetPasswordExpiry",
      );
    if (!user) {
      return res
        .status(404)
        .json({ status: "failed", message: "User account profile not found." });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const statsAggregation = await interviewReportModel.aggregate([
      { $match: { user: userObjectId } },
      {
        $facet: {
          generalStats: [
            {
              $group: {
                _id: null,
                totalReports: { $sum: 1 },
                averageMatchScore: { $avg: "$matchScore" },
              },
            },
          ],
          commonSkillGaps: [
            { $unwind: "$skillGaps" },
            {
              $group: {
                _id: "$skillGaps.skill",
                count: { $sum: 1 },
                severity: { $first: "$skillGaps.severity" },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]);

    const general = statsAggregation[0]?.generalStats[0] || {
      totalReports: 0,
      averageMatchScore: 0,
    };
    const frequentSkillGaps = (statsAggregation[0]?.commonSkillGaps || []).map(
      (gap) => ({
        skill: gap._id,
        count: gap.count,
        severity: gap.severity || "medium",
      }),
    );

    // In getUserProfileDashboardController, update the return payload:
    return res.status(200).json({
      status: "success",
      message: "Profile dashboard calculations executed cleanly.",
      data: {
        profile: {
          userName: user.userName,
          email: user.email,
          joinDate: user.createdAt,
          savedResumesCount: user.resume ? user.resume.length : 0,
          resumes: user.resume || [],
          serverTotalPenalties: user.penaltyCount || 0, // ✅ ADDED
          isBanned: !!(
            user.sandboxBanUntil && user.sandboxBanUntil > new Date()
          ), // ✅ ADDED
          banExpiresAt: user.sandboxBanUntil || null, // ✅ ADDED
        },
        stats: {
          totalReports: general.totalReports,
          averageMatchScore: Math.round(general.averageMatchScore || 0),
          frequentSkillGaps,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function saveUserResumeSlotController(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    const rawName = req.body.resumeName || req.body.name || req.body.nickname;
    const resumeTextContent = req.resumeTextContent;

    if (!rawName || !rawName.trim()) {
      return res
        .status(400)
        .json({ status: "failed", message: "A resume nickname is required." });
    }
    if (!resumeTextContent) {
      return res
        .status(400)
        .json({
          status: "failed",
          message:
            "Could not extract text from the PDF. Please upload a valid text-based PDF.",
        });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "failed", message: "User not found." });
    }

    if (!user.resume) user.resume = [];
    if (user.resume.length >= 3) {
      return res.status(400).json({
        status: "failed",
        message:
          "Maximum 3 resume slots allowed. Please delete one before adding a new one.",
      });
    }

    user.resume.push({ name: rawName.trim(), textContent: resumeTextContent });
    await user.save();

    return res.status(201).json({
      status: "success",
      message: "Resume saved successfully.",
      savedResumesCount: user.resume.length,
      resumes: user.resume,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteUserResumeSlotController(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    const { resumeId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "failed", message: "User not found." });
    }

    const resumeIndex = user.resume.findIndex(
      (r) => r._id.toString() === resumeId.toString(),
    );
    if (resumeIndex === -1) {
      return res
        .status(404)
        .json({ status: "failed", message: "Resume slot not found." });
    }

    user.resume.splice(resumeIndex, 1);
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Resume removed successfully.",
      resumes: user.resume,
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserResumeNicknameController(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    const { resumeId } = req.params;
    const { resumeName } = req.body;

    if (!resumeName || !resumeName.trim()) {
      return res
        .status(400)
        .json({
          status: "failed",
          message: "A non-empty nickname is required.",
        });
    }
    if (!resumeId) {
      return res
        .status(400)
        .json({ status: "failed", message: "Resume ID parameter is missing." });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "failed", message: "User profile not found." });
    }

    const targetResume = user.resume.id(resumeId);
    if (!targetResume) {
      return res
        .status(404)
        .json({
          status: "failed",
          message: "Specific resume slot configuration not found.",
        });
    }

    targetResume.name = resumeName.trim();
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Nickname updated successfully.",
      data: {
        profile: {
          userName: user.userName,
          email: user.email,
          joinDate: user.createdAt,
          savedResumesCount: user.resume.length,
          resumes: user.resume,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUserProfileDashboardController,
  saveUserResumeSlotController,
  deleteUserResumeSlotController,
  updateUserResumeNicknameController,
};
