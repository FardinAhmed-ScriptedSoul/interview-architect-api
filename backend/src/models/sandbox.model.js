const mongoose = require('mongoose');

// Removed strict required rules on individual answer entries to prevent 400 validation failures
const mcqAnswerSchema = new mongoose.Schema({
    question: { type: String },
    selectedOption: { type: String }
}, { _id: false });

const theoryAnswerSchema = new mongoose.Schema({
    question: { type: String },
    answerText: { type: String }
}, { _id: false });

const codeSnippetAnswerSchema = new mongoose.Schema({
    question: { type: String },
    predictedOutput: { type: String }
}, { _id: false });

const codingChallengeAnswerSchema = new mongoose.Schema({
    title: { type: String },
    submittedCode: { type: String }
}, { _id: false });

const sandboxSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['initialized', 'active', 'completed', 'terminated'],
        default: 'initialized'
    },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    sessionPenalties: { type: Number, default: 0 },
    questions: {
        mcqs: [
            {
                question: { type: String, required: true },
                options: [{ type: String }],
                correctAnswer: { type: String, required: true }, 
                points: { type: Number, default: 1 }
            }
        ],
        theory: [
            {
                question: { type: String, required: true },
                points: { type: Number, default: 5 }
            }
        ],
        codeSnippets: [
            {
                question: { type: String, required: true }, 
                code: { type: String, required: true },     
                correctOutput: { type: String, required: true },
                points: { type: Number, default: 7 }
            }
        ],
        codingChallenge: {
            title: { type: String, required: true },
            problemStatement: { type: String, default: "Implement an optimized backend algorithm." },
            constraints: { type: String, default: "O(N) Time Complexity" },
            testCases: [
                {
                    input: { type: String, required: true },
                    expectedOutput: { type: String, required: true }
                }
            ],
            points: { type: Number, default: 10 }
        }
    },
    userAnswers: {
        mcqAnswers: { type: [mcqAnswerSchema], default: [] },
        theoryAnswers: { type: [theoryAnswerSchema], default: [] },
        codeSnippetAnswers: { type: [codeSnippetAnswerSchema], default: [] },
        codingChallengeSolution: { type: codingChallengeAnswerSchema, default: null }
    },
    evaluation: {
        scoreObtained: { type: Number, default: 0 },
        totalPoints: { type: Number, default: 48 }, 
        rankTier: { type: String, enum: ['Grandmaster', 'Competent Developer', 'Apprentice', 'Novice', null], default: null },
        remarks: { type: String },
        studyRecommendations: [{ type: String }], 
        detailedFeedback: { type: mongoose.Schema.Types.Mixed, default: null } 
    }
}, { timestamps: true });

sandboxSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1200 });

module.exports = mongoose.model('Sandbox', sandboxSchema);