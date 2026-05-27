// src/test/interview.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// =========================================================================
// 🚧 PRE-LOAD MOCKS — must be hoisted before any require()
// =========================================================================

jest.mock('../config/config.js', () => ({
    jwt: { secret: 'super_secret_test_encryption_key' },
    mail: {
        user: 'mock-email@example.com',
        clientId: 'mock-client-id',
        clientSecret: 'mock-client-secret',
        refreshToken: 'mock-refresh-token'
    },
    google: { genApiKey: 'mock_google_gemini_api_key_override_token' }
}));

jest.mock('../services/mail.services.js', () => ({
    transporter: {
        verify: jest.fn((cb) => cb(null, true)),
        sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' })
    },
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' })
}));

jest.mock('../config/redis.js', () => ({
    isOpen: true,
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1)
}));

// ✅ Multer mock: parse multipart fields from raw stream so req.body is populated
jest.mock('../middlewares/file.middleware.js', () => ({
    single: () => (req, res, next) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString();
            req.body = req.body || {};
            const selfMatch  = raw.match(/name="selfDescription"\r\n\r\n([^\r\n-]+)/);
            const jobMatch   = raw.match(/name="jobDescription"\r\n\r\n([^\r\n-]+)/);
            if (selfMatch) req.body.selfDescription = selfMatch[1].trim();
            if (jobMatch)  req.body.jobDescription  = jobMatch[1].trim();
            req.file = {
                originalname: 'resume.pdf',
                mimetype:     'application/pdf',
                buffer:       Buffer.from('%PDF-1.4 mock content')
            };
            next();
        });
    }
}));

// ✅ PDF upload middleware — injects extracted text content
jest.mock('../middlewares/pdfUpload.middleware.js', () => ({
    processPdfUpload: (req, res, next) => {
        req.resumeTextContent = 'Mocked extracted resume text content.';
        next();
    }
}));

// ✅ AI service mock — returns a realistic report shape
jest.mock('../services/ai.service.js', () => ({
    generateInterviewReport: jest.fn().mockResolvedValue({
        title:               'Senior Backend Engineer',
        matchScore:          82,
        technicalQuestions:  [{ question: 'Explain event loop', intention: 'Node.js depth', answer: 'Single-threaded...' }],
        behavioralQuestions: [{ question: 'Describe a conflict', intention: 'Teamwork', answer: 'STAR method...' }],
        skillGaps:           [{ skill: 'Kubernetes', severity: 'medium' }],
        preparationPlan:     [{ day: '1', focus: 'Node.js', tasks: ['Read docs', 'Build demo'] }]
    }),
    generateTailoredResume: jest.fn().mockResolvedValue({
        fullName:  'Syed Developer',
        email:     'syed@example.com',
        phone:     '+880123456789',
        location:  'Dhaka, BD',
        linkedin:  'linkedin.com/in/syed',
        github:    'github.com/syed',
        summary:   'Experienced backend engineer...',
        skills:    ['Node.js', 'MongoDB', 'Express'],
        experience:[{ title: 'Backend Dev', company: 'TechCorp', duration: '2yr', bullets: ['Built APIs'] }],
        projects:  [{ name: 'InterviewAI', tech: 'Node.js', bullets: ['Built feature'] }],
        education: [{ degree: 'BSc CS', institution: 'BUET', year: '2022' }]
    }),
    gradePracticeAnswer:   jest.fn().mockResolvedValue({}),
    generatePracticeQuestions: jest.fn().mockResolvedValue([])
}));

// ✅ PDF generation service mock — returns a dummy buffer
jest.mock('../services/resumePdf.service.js', () =>
    jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 generated resume pdf'))
);

const User            = require('../models/user.model.js');
const InterviewReport = require('../models/interviewReport.model.js');
const Blacklist       = require('../models/blackList.model.js');

jest.mock('../models/user.model.js');
jest.mock('../models/interviewReport.model.js');
jest.mock('../models/blackList.model.js');

const app = require('../app.js');

// =========================================================================
// 🧪 INTERVIEW REPORT SUBSYSTEM TEST SUITE
// =========================================================================
describe('📋 Interview Report Subsystem (/api/interview)', () => {

    let validMockToken;
    let mockUserId;
    let mockInterviewId;

    beforeAll(() => {
        mockUserId      = new mongoose.Types.ObjectId();
        mockInterviewId = new mongoose.Types.ObjectId();

        validMockToken = jwt.sign(
            { _id: mockUserId.toString(), tokenVersion: 1 },
            'super_secret_test_encryption_key'
        );
    });

    beforeEach(() => {
        jest.clearAllMocks();
        const redisClient = require('../config/redis.js');
        redisClient.get.mockResolvedValue(null);
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    // =========================================================================
    // 🏗️ HELPERS
    // =========================================================================

    const buildMockUser = () => ({
        _id:          mockUserId,
        userName:     'syed_developer',
        email:        'syed@example.com',
        tokenVersion: 1,
        createdAt:    new Date(),
    });

    const buildMockReport = (overrides = {}) => ({
        _id:                mockInterviewId,
        user:               mockUserId,
        title:              'Senior Backend Engineer',
        matchScore:         82,
        resume:             'Mocked extracted resume text content.',
        selfDescription:    'I am a backend developer.',
        jobDescription:     'We need a Node.js expert.',
        technicalQuestions: [{ question: 'Explain event loop', intention: 'Node.js', answer: '...' }],
        behavioralQuestions:[{ question: 'Describe conflict',  intention: 'Teamwork', answer: '...' }],
        skillGaps:          [{ skill: 'Kubernetes', severity: 'medium' }],
        preparationPlan:    [{ day: '1', focus: 'Node.js', tasks: ['Read docs'] }],
        tailoredResume:     { fullName: 'Syed Developer', email: 'syed@example.com' },
        isPublic:           false,
        createdAt:          new Date(),
        save:               jest.fn().mockResolvedValue(true),
        ...overrides
    });

    // Auth middleware always calls findById().select("+tokenVersion")
    const mockAuthPass = (mockUser) => {
        User.findById.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce(mockUser)
        });
    };

    // -----------------------------------------------------------------------
    // 🌐 PUBLIC SHARE ROUTE — no auth required
    // -----------------------------------------------------------------------
    describe('GET /api/interview/share/:interviewId', () => {

        it('should return a public report when isPublic is true', async () => {
            const publicReport = buildMockReport({ isPublic: true });
            InterviewReport.findById = jest.fn().mockResolvedValueOnce(publicReport);

            const response = await request(app)
                .get(`/api/interview/share/${mockInterviewId}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.interviewReport._id).toBe(mockInterviewId.toString());
        });

        it('should return 403 when report is private', async () => {
            const privateReport = buildMockReport({ isPublic: false });
            InterviewReport.findById = jest.fn().mockResolvedValueOnce(privateReport);

            const response = await request(app)
                .get(`/api/interview/share/${mockInterviewId}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toMatch(/restricted to private/i);
        });

        it('should return 404 when report does not exist', async () => {
            InterviewReport.findById = jest.fn().mockResolvedValueOnce(null);

            const response = await request(app)
                .get(`/api/interview/share/${mockInterviewId}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/does not exist/i);
        });

        it('should return 404 for an invalid ObjectId format', async () => {
            const response = await request(app)
                .get('/api/interview/share/not-a-valid-id');

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/invalid/i);
        });
    });

    // -----------------------------------------------------------------------
    // 🔒 AUTH GUARD — protected routes reject missing tokens
    // -----------------------------------------------------------------------
    describe('🔒 Auth guard on protected routes', () => {

        it('should block POST / with no token', async () => {
            const response = await request(app).post('/api/interview');
            expect(response.status).toBe(401);
        });

        it('should block GET / with no token', async () => {
            const response = await request(app).get('/api/interview');
            expect(response.status).toBe(401);
        });

        it('should block GET /report/:id with no token', async () => {
            const response = await request(app)
                .get(`/api/interview/report/${mockInterviewId}`);
            expect(response.status).toBe(401);
        });

        it('should block PATCH /:id/visibility with no token', async () => {
            const response = await request(app)
                .patch(`/api/interview/${mockInterviewId}/visibility`);
            expect(response.status).toBe(401);
        });

        it('should block POST /resume/pdf/:id with no token', async () => {
            const response = await request(app)
                .post(`/api/interview/resume/pdf/${mockInterviewId}`);
            expect(response.status).toBe(401);
        });
    });

    // -----------------------------------------------------------------------
    // ✨ POST /api/interview — generate report
    // -----------------------------------------------------------------------
    describe('POST /api/interview', () => {

        it('should generate and save a new interview report', async () => {
            const mockUser   = buildMockUser();
            const mockReport = buildMockReport();

            mockAuthPass(mockUser);
            InterviewReport.create = jest.fn().mockResolvedValueOnce(mockReport);

            const response = await request(app)
                .post('/api/interview')
                .set('Cookie', [`token=${validMockToken}`])
                .field('selfDescription', 'I am a backend developer.')
                .field('jobDescription',  'We need a Node.js expert.')
                .attach('resume', Buffer.from('%PDF-1.4 dummy'), 'resume.pdf');

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.interviewReport.title).toBe('Senior Backend Engineer');
        });

        it('should return 500 when AI service throws', async () => {
            const mockUser = buildMockUser();
            mockAuthPass(mockUser);

            const { generateInterviewReport } = require('../services/ai.service.js');
            generateInterviewReport.mockRejectedValueOnce(new Error('AI pipeline failure'));

            const response = await request(app)
                .post('/api/interview')
                .set('Cookie', [`token=${validMockToken}`])
                .field('selfDescription', 'I am a backend developer.')
                .field('jobDescription',  'We need a Node.js expert.')
                .attach('resume', Buffer.from('%PDF-1.4 dummy'), 'resume.pdf');

            // Error handler returns 500
            expect(response.status).toBe(500);
        });
    });

    // -----------------------------------------------------------------------
    // 📋 GET /api/interview — list all user reports
    // -----------------------------------------------------------------------
    describe('GET /api/interview', () => {

        it('should return all interview summaries for the user', async () => {
            const mockUser = buildMockUser();
            mockAuthPass(mockUser);

            const mockReports = [buildMockReport(), buildMockReport()];

            // Controller calls .find().sort().select() — mock the full chain
            InterviewReport.find = jest.fn().mockReturnValueOnce({
                sort:   jest.fn().mockReturnThis(),
                select: jest.fn().mockResolvedValueOnce(mockReports)
            });

            const response = await request(app)
                .get('/api/interview')
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.interviewReports).toHaveLength(2);
        });

        it('should return an empty array when user has no reports', async () => {
            const mockUser = buildMockUser();
            mockAuthPass(mockUser);

            InterviewReport.find = jest.fn().mockReturnValueOnce({
                sort:   jest.fn().mockReturnThis(),
                select: jest.fn().mockResolvedValueOnce([])
            });

            const response = await request(app)
                .get('/api/interview')
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.interviewReports).toHaveLength(0);
        });
    });

    // -----------------------------------------------------------------------
    // 🔍 GET /api/interview/report/:interviewId
    // -----------------------------------------------------------------------
    describe('GET /api/interview/report/:interviewId', () => {

        it('should return a specific report by ID', async () => {
            const mockUser   = buildMockUser();
            const mockReport = buildMockReport();
            mockAuthPass(mockUser);

            InterviewReport.findOne = jest.fn().mockResolvedValueOnce(mockReport);

            const response = await request(app)
                .get(`/api/interview/report/${mockInterviewId}`)
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.interviewReport.title).toBe('Senior Backend Engineer');
        });

        it('should return 404 when report is not found', async () => {
            const mockUser = buildMockUser();
            mockAuthPass(mockUser);

            InterviewReport.findOne = jest.fn().mockResolvedValueOnce(null);

            const response = await request(app)
                .get(`/api/interview/report/${mockInterviewId}`)
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/not found/i);
        });

        it('should return 404 for an invalid ObjectId', async () => {
            const mockUser = buildMockUser();
            mockAuthPass(mockUser);

            const response = await request(app)
                .get('/api/interview/report/invalid-id-string')
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/invalid/i);
        });
    });

    // -----------------------------------------------------------------------
    // 👁️ PATCH /api/interview/:interviewId/visibility
    // -----------------------------------------------------------------------
    describe('PATCH /api/interview/:interviewId/visibility', () => {

        it('should flip isPublic from false to true', async () => {
            const mockUser   = buildMockUser();
            const mockReport = buildMockReport({ isPublic: false });
            mockAuthPass(mockUser);

            // Simulate the flip that the controller does
            mockReport.save = jest.fn().mockImplementationOnce(() => {
                mockReport.isPublic = true;
                return Promise.resolve(true);
            });

            InterviewReport.findOne = jest.fn().mockResolvedValueOnce(mockReport);

            const response = await request(app)
                .patch(`/api/interview/${mockInterviewId}/visibility`)
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.isPublic).toBe(true);
            expect(response.body.message).toMatch(/PUBLIC/);
        });

        it('should flip isPublic from true to false', async () => {
            const mockUser   = buildMockUser();
            const mockReport = buildMockReport({ isPublic: true });
            mockAuthPass(mockUser);

            mockReport.save = jest.fn().mockImplementationOnce(() => {
                mockReport.isPublic = false;
                return Promise.resolve(true);
            });

            InterviewReport.findOne = jest.fn().mockResolvedValueOnce(mockReport);

            const response = await request(app)
                .patch(`/api/interview/${mockInterviewId}/visibility`)
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.isPublic).toBe(false);
            expect(response.body.message).toMatch(/PRIVATE/);
        });

        it('should return 404 when report not found or not owned by user', async () => {
            const mockUser = buildMockUser();
            mockAuthPass(mockUser);

            InterviewReport.findOne = jest.fn().mockResolvedValueOnce(null);

            const response = await request(app)
                .patch(`/api/interview/${mockInterviewId}/visibility`)
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/missing or access unauthorized/i);
        });

        it('should return 404 for invalid ObjectId', async () => {
            const mockUser = buildMockUser();
            mockAuthPass(mockUser);

            const response = await request(app)
                .patch('/api/interview/bad-id/visibility')
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/invalid/i);
        });
    });

    // -----------------------------------------------------------------------
    // 📄 POST /api/interview/resume/pdf/:interviewReportId
    // -----------------------------------------------------------------------
    describe('POST /api/interview/resume/pdf/:interviewReportId', () => {

        it('should stream back a PDF buffer for a report with pre-saved tailored data', async () => {
            const mockUser   = buildMockUser();
            const mockReport = buildMockReport({
                tailoredResume: {
                    fullName: 'Syed Developer',
                    email:    'syed@example.com',
                    phone:    '+880123',
                    location: 'Dhaka',
                    summary:  'Backend dev',
                    skills:   ['Node.js'],
                    experience: [],
                    projects:   [],
                    education:  []
                }
            });
            mockAuthPass(mockUser);

            InterviewReport.findById = jest.fn().mockResolvedValueOnce(mockReport);

            const response = await request(app)
                .post(`/api/interview/resume/pdf/${mockInterviewId}`)
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/application\/pdf/);
            expect(response.headers['content-disposition']).toMatch(/attachment/);
        });

        it('should run fallback generation when tailoredResume is missing and still return PDF', async () => {
            const mockUser   = buildMockUser();
            // No tailoredResume — triggers the fallback path
            const mockReport = buildMockReport({ tailoredResume: null });
            mockAuthPass(mockUser);

            InterviewReport.findById = jest.fn().mockResolvedValueOnce(mockReport);

            const response = await request(app)
                .post(`/api/interview/resume/pdf/${mockInterviewId}`)
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/application\/pdf/);

            // Verify the fallback AI call was triggered
            const { generateTailoredResume } = require('../services/ai.service.js');
            expect(generateTailoredResume).toHaveBeenCalled();

            // Verify the fallback result was persisted
            expect(mockReport.save).toHaveBeenCalled();
        });

        it('should run fallback when tailoredResume has placeholder fullName', async () => {
            const mockUser   = buildMockUser();
            const mockReport = buildMockReport({
                tailoredResume: { fullName: 'Candidate Name' } // placeholder triggers fallback
            });
            mockAuthPass(mockUser);

            InterviewReport.findById = jest.fn().mockResolvedValueOnce(mockReport);

            const response = await request(app)
                .post(`/api/interview/resume/pdf/${mockInterviewId}`)
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(200);
            const { generateTailoredResume } = require('../services/ai.service.js');
            expect(generateTailoredResume).toHaveBeenCalled();
        });

        it('should return 404 when interview report is not found', async () => {
            const mockUser = buildMockUser();
            mockAuthPass(mockUser);

            InterviewReport.findById = jest.fn().mockResolvedValueOnce(null);

            const response = await request(app)
                .post(`/api/interview/resume/pdf/${mockInterviewId}`)
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/not found/i);
        });
    });
});