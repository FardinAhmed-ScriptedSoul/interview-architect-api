// src/test/user.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// =========================================================================
// 🚧 PRE-LOAD MOCKS
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

jest.mock('../services/resumePdf.service.js', () => ({
    generateResumePdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4...'))
}));

jest.mock('../services/ai.service.js', () => ({
    generateInterviewReport: jest.fn().mockResolvedValue({}),
    generateTailoredResume: jest.fn().mockResolvedValue({}),
    generatePracticeQuestions: jest.fn().mockResolvedValue([]),
    gradePracticeAnswer: jest.fn().mockResolvedValue({})
}));

jest.mock('../config/redis.js', () => ({
    isOpen: true,
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1)
}));

// ✅ FIX 1: Multer mock must manually parse the resumeName from the
// multipart stream — real multer isn't running so req.body stays empty.
// We reach into the request's internal multipart fields via supertest's
// _data or we simply hard-inject a sentinel that the controller accepts.
// The cleanest approach: let the mock read whatever supertest put in
// req.body already (supertest populates it before the middleware fires
// for field() calls when content-type is multipart) — but to be safe,
// we also set a fallback so the controller never sees undefined.
jest.mock('../middlewares/file.middleware.js', () => ({
    single: (fieldName) => (req, res, next) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString();
            console.log('🔍 RAW MULTIPART BODY:', JSON.stringify(raw.substring(0, 300)));
            const fieldMatch = raw.match(/name="resumeName"\r\n\r\n([^\r\n-]+)/);
            console.log('🔍 FIELD MATCH RESULT:', fieldMatch);
            req.body = req.body || {};
            if (fieldMatch) req.body.resumeName = fieldMatch[1].trim();
            req.file = { originalname: 'resume.pdf', mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.4 mock content') };
            next();
        });
    }
}));

jest.mock('../middlewares/pdfUpload.middleware.js', () => ({
    processPdfUpload: (req, res, next) => {
        req.resumeTextContent = "Mocked resume text content extracted from PDF.";
        next();
    }
}));

const User = require('../models/user.model.js');
const InterviewReport = require('../models/interviewReport.model.js');
const Blacklist = require('../models/blackList.model.js');

jest.mock('../models/user.model.js');
jest.mock('../models/interviewReport.model.js');
jest.mock('../models/blackList.model.js');

const app = require('../app.js');

// =========================================================================
// 🧪 USER PROFILE & SECURITY FEATURE TEST SUITE
// =========================================================================
describe('👤 User Profile & Security Subsystem (/api/user)', () => {
    let validMockToken;
    let mockUserId;
    let mockResumeId;

    beforeAll(() => {
        mockUserId = new mongoose.Types.ObjectId();
        mockResumeId = new mongoose.Types.ObjectId();

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

    const buildMockUserDocument = (resumes = []) => {
        // ✅ FIX 2: Store resumes with _id as plain strings internally so
        // .toString() comparisons are always consistent regardless of whether
        // the caller passed an ObjectId or a string.
        const resumeArray = resumes.map(r => ({
            ...r,
            _id: r._id  // keep original — but .id() will always toString() both sides
        }));

        // ✅ FIX 3: Robust .id() implementation — always compares as strings
        // resumeArray.id = (searchId) => {
        //     if (!searchId) return null;
        //     const searchStr = searchId.toString();
        //     const found = resumeArray.find(r => r._id.toString() === searchStr);
        //     return found || null;
        // };

        resumeArray.id = (searchId) => {
    console.log('🔍 resume.id() called with:', searchId?.toString());
    console.log('🔍 available IDs:', resumeArray.map(r => r._id?.toString()));
    const found = resumeArray.find(r => r._id.toString() === searchId?.toString());
    return found || null;
};

        return {
            _id: mockUserId,
            userName: 'syed_developer',
            email: 'syed@example.com',
            tokenVersion: 1,
            createdAt: new Date(),
            penaltyCount: 0,
            sandboxBanUntil: null,
            resume: resumeArray,
            markModified: jest.fn(),
            save: jest.fn().mockResolvedValue(true)
        };
    };

    // ✅ FIX 4: Auth middleware calls findById().select("+tokenVersion")
    // Controller calls findById() directly (no select) for resume routes,
    // or findById().select(...) for profile route.
    // We use Once variants so the queue drains correctly per-test.
    const mockAuthPass = (mockUser) => {
        User.findById.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce(mockUser)
        });
    };

    // -----------------------------------------------------------------------
    // 🔒 AUTH MIDDLEWARE TESTS
    // -----------------------------------------------------------------------
    describe('🔒 Authentication Layer Edge Cases', () => {
        it('should reject requests with no token', async () => {
            const response = await request(app).get('/api/user/profile');
            expect(response.status).toBe(401);
        });

        it('should block requests with blacklisted token', async () => {
            const redisClient = require('../config/redis.js');
            redisClient.get.mockResolvedValueOnce('revoked_session_marker');

            const response = await request(app)
                .get('/api/user/profile')
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(401);
        });
    });

    // -----------------------------------------------------------------------
    // 📊 GET /api/user/profile
    // -----------------------------------------------------------------------
    describe('GET /api/user/profile', () => {
        it('should return profile dashboard with aggregated stats', async () => {
            const mockUser = buildMockUserDocument();

            // Auth pass
            mockAuthPass(mockUser);
            // Profile controller also uses .select()
            User.findById.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce(mockUser)
            });

            InterviewReport.aggregate = jest.fn().mockResolvedValue([{
                generalStats: [{ totalReports: 12, averageMatchScore: 84.5 }],
                commonSkillGaps: [
                    { _id: 'C++', count: 4, severity: 'high' },
                    { _id: 'Node.js', count: 2, severity: 'medium' }
                ]
            }]);

            const response = await request(app)
                .get('/api/user/profile')
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.stats.totalReports).toBe(12);
            expect(response.body.data.stats.averageMatchScore).toBe(85);
        });

        it('should return 0-state when aggregation is empty', async () => {
            const mockUser = buildMockUserDocument();

            mockAuthPass(mockUser);
            User.findById.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce(mockUser)
            });

            InterviewReport.aggregate = jest.fn().mockResolvedValue([{
                generalStats: [],
                commonSkillGaps: []
            }]);

            const response = await request(app)
                .get('/api/user/profile')
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.data.stats.totalReports).toBe(0);
        });
    });

    // -----------------------------------------------------------------------
    // 📄 POST /api/user/resume
    // -----------------------------------------------------------------------
    describe('POST /api/user/resume', () => {
        it('should save resume slot successfully', async () => {
            const mockUser = buildMockUserDocument([]);

            mockAuthPass(mockUser);
            // ✅ Controller calls findById() with no .select()
            User.findById.mockResolvedValueOnce(mockUser);

            const response = await request(app)
                .post('/api/user/resume')
                .set('Cookie', [`token=${validMockToken}`])
                // ✅ FIX 5: Use send() with explicit content-type instead of
                // .field() + .attach() — since our multer mock bypasses real
                // multipart parsing, req.body never gets populated from .field().
                // We inject resumeName via JSON-like form encoding that Express
                // body-parser CAN read, then let the file mock handle req.file.
                .field('resumeName', 'Backend Engineer Profile Core')
                .attach('resume', Buffer.from('%PDF-1.4 dummy'), 'resume.pdf');

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should reject upload when 3 resume slots are full', async () => {
            const fullResumes = [
                { _id: new mongoose.Types.ObjectId(), name: 'Resume A', textContent: 'text' },
                { _id: new mongoose.Types.ObjectId(), name: 'Resume B', textContent: 'text' },
                { _id: new mongoose.Types.ObjectId(), name: 'Resume C', textContent: 'text' }
            ];
            const mockUser = buildMockUserDocument(fullResumes);

            mockAuthPass(mockUser);
            User.findById.mockResolvedValueOnce(mockUser);

            const response = await request(app)
                .post('/api/user/resume')
                .set('Cookie', [`token=${validMockToken}`])
                .field('resumeName', 'Overflow Resume')
                .attach('resume', Buffer.from('%PDF-1.4 dummy'), 'resume.pdf');

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/Maximum 3 resume slots allowed/);
        });
    });

    // -----------------------------------------------------------------------
    // ✏️ PATCH /api/user/resume/:resumeId
    // -----------------------------------------------------------------------
    describe('PATCH /api/user/resume/:resumeId', () => {
        it('should update resume nickname successfully', async () => {
            const targetResume = {
                _id: mockResumeId,        // ObjectId
                name: 'Old Name',
                textContent: 'some text'
            };
            const mockUser = buildMockUserDocument([targetResume]);

            mockAuthPass(mockUser);
            User.findById.mockResolvedValueOnce(mockUser);

            const response = await request(app)
                .patch(`/api/user/resume/${mockResumeId.toString()}`)
                .set('Cookie', [`token=${validMockToken}`])
                .send({ resumeName: 'Updated Backend CV' });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toMatch(/Nickname updated successfully/);
        });

        it('should return 404 if resume slot not found', async () => {
            // ✅ FIX 6: Use a DIFFERENT ObjectId so .id() genuinely returns null
            const differentId = new mongoose.Types.ObjectId();
            const mockUser = buildMockUserDocument([]);

            mockAuthPass(mockUser);
            User.findById.mockResolvedValueOnce(mockUser);

            const response = await request(app)
                .patch(`/api/user/resume/${differentId.toString()}`)
                .set('Cookie', [`token=${validMockToken}`])
                .send({ resumeName: 'Ghost Resume' });

            expect(response.status).toBe(404);
        });
    });

    // -----------------------------------------------------------------------
    // 🗑️ DELETE /api/user/resume/:resumeId
    // -----------------------------------------------------------------------
    describe('DELETE /api/user/resume/:resumeId', () => {
        it('should return 404 when resume slot does not exist', async () => {
            const differentId = new mongoose.Types.ObjectId();
            const mockUser = buildMockUserDocument([]);

            mockAuthPass(mockUser);
            User.findById.mockResolvedValueOnce(mockUser);

            const response = await request(app)
                .delete(`/api/user/resume/${differentId.toString()}`)
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/Resume slot not found/);
        });

        it('should delete resume slot successfully', async () => {
            const targetResume = {
                _id: mockResumeId,
                name: 'Resume to Delete',
                textContent: 'text'
            };
            const mockUser = buildMockUserDocument([targetResume]);

            mockAuthPass(mockUser);
            User.findById.mockResolvedValueOnce(mockUser);

            const response = await request(app)
                .delete(`/api/user/resume/${mockResumeId.toString()}`)
                .set('Cookie', [`token=${validMockToken}`]);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(mockUser.save).toHaveBeenCalled();
        });
    });
});