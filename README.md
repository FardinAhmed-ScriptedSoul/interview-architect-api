# 🏗️ Interview Architect

An AI-powered, system-engineered career acceleration ecosystem designed to map out professional profiles and close critical tech gaps. By ingestion of a user's self-description, targeted job role, and baseline resume (.pdf), the platform crafts structured technical roadmaps, dynamically generates tailored resumes, and fields an interactive, anti-cheat sandbox environment to thoroughly test and verify candidate readiness.

---

## 🚀 Core Platform Workflow

1. **Profile Onboarding & Verification**: Users create an account through a secure OTP verification loop delivered directly to their email inbox.
2. **AI Intelligence Analysis & Roadmap Generation**: Users provide their target job description, a self-description, and upload their current resume (.pdf). The automated text-extraction pipeline parses the PDF asset and routes it through the **Google Gemini Pro** engine to generate a comprehensive assessment report complete with behavioral questions, technical questions, a milestone roadmap, and an active **Technical Skill Gap** evaluation card.
3. **Role-Targeted Resume Engineering**: Based on the generated report metrics and target role parameters, the platform utilizes a headless layout generator to tailor an ATS-optimized resume and stream down a clean, print-ready binary PDF document.
4. **Interactive Sandbox & Anti-Cheat Environment**: To actively close the items highlighted on their Technical Skill Gap card, users launch a dynamic 10-problem assessment sandbox stack. To ensure total exam integrity, the sandbox is reinforced with a strict window event tracker; tab switches or loss of focus trigger immediate backend infraction penalties, locking down the session permanently upon reaching the security threshold.

---

## 🛠️ System Technology Matrix

### Backend Layer
* **Runtime Framework**: Node.js & Express.js asynchronous processing layer
* **Persistence Databases**: MongoDB Atlas (Core Schemas) & Upstash Redis (Ephemeral OTP & Session Token Blacklists)
* **Ingestion Pipeline**: Multer memory-buffer routing coupled with automated PDF textual stream readers
* **Orchestration Matrix**: Google Generative AI (Gemini Pro) SDK & Puppeteer dynamic document generation lines

### Frontend Layer
* **Core Framework**: React.js bundled via Vite high-speed compilation
* **State & Navigation**: Declared tree routing via React Router DOM (v7) with custom hook orchestration
* **Design & Layout**: Highly responsive component trees styled via global modular Sass/SCSS compilers

---

## 📂 System File Tree Topology

```text
interview/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── config.js               # Frozen app configuration context manager
│   │   │   └── redis.js                # Upstash Redis database connector client
│   │   ├── controllers/
│   │   │   ├── auth.controllers.js     # Identity session, cookie & blacklist controls
│   │   │   ├── interview.controller.js # AI report generator and PDF generator engine
│   │   │   ├── otp.controllers.js      # Redis verification token control processors
│   │   │   ├── sandboxController.js    # Live exam lifecycle and penalty engine execution
│   │   │   └── user.controller.js      # Profile dashboards and document slot managers
│   │   ├── db/
│   │   │   └── db_connection.js        # MongoDB Atlas connection pool driver lifecycle
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js      # Bearer JWT token state verification guard
│   │   │   ├── file.middleware.js      # Multer multipart multi-stream file interceptor
│   │   │   ├── pdfUpload.middleware.js # Automated text parsing sequence line for raw PDFs
│   │   │   └── sandbox.middleware.js   # Integrity check preventing interaction if user is banned
│   │   ├── models/
│   │   │   ├── blackList.model.js      # Expired/revoked token tracking schema
│   │   │   ├── interviewReport.model.js# AI structured comprehensive roadmap blueprint
│   │   │   ├── sandbox.model.js        # Focus penalty metrics and assessment stack tracking
│   │   │   └── user.model.js           # Password encryption parameters and user definitions
│   │   ├── routes/
│   │   │   ├── auth.routes.js          # REST authentication path bindings
│   │   │   ├── interview.routes.js     # Report orchestration and resume printing paths
│   │   │   ├── sandboxRoutes.js        # Anti-cheat evaluation assessment path configurations
│   │   │   └── user.routes.js          # Private profile dashboard state router bindings
│   │   ├── services/
│   │   │   ├── ai.service.js           # Google Gen AI (Gemini) API orchestration gate
│   │   │   ├── mail.services.js        # Rich SMTP mail layout templates
│   │   │   ├── resumePdf.service.js    # Puppeteer programmatic layout engine channel
│   │   │   └── sendmail.js             # Low-level Google OAuth2 email transporter
│   │   └── utils/
│   │       ├── otp.util.js             # 6-digit cryptographic registration generator
│   │       └── token.util.js           # Secure JWT sign and encryption builders
│   ├── app.js                          # Core downstream Express app orchestration init
│   ├── .env                            # Application secure environment configuration keys
│   ├── package-lock.json               # Package tree lock dependency snapshot
│   ├── package.json                    # Backend script execution configurations
│   └── server.js                       # Primary application production process bootstrapper
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── api.client.js           # Configured Axios instance with cross-origin credentials
    │   ├── features/
    │   │   ├── auth/
    │   │   │   ├── components/         # FloatingTextField, LoadingAnimation, Protected route gates
    │   │   │   ├── hooks/              # useAuth context validation hooks
    │   │   │   ├── pages/              # Login, Register, ForgotPassword, ResetPassword views
    │   │   │   └── services/           # auth.api backend routing actions
    │   │   ├── interview/
    │   │   │   ├── components/         # Header, NavbarProfile, Sidebar modular view trees
    │   │   │   ├── hooks/              # useInterview dashboard management hooks
    │   │   │   ├── pages/              # Home and full Interview report workspace sheets
    │   │   │   └── services/           # interview.api execution handlers
    │   │   └── users/
    │   │       ├── components/         # ProfileDashboard and interactive SandboxSession portals
    │   │       └── hooks/              # useSandbox tracker and useUserProfile pipeline controls
    │   ├── style/
    │   │   ├── button.scss             # Shared application interaction styles
    │   │   ├── LoadingAnimation.scss   # Keyframe processing spinner styles
    │   │   └── style.scss              # Global layout compiler entrypoint
    │   ├── App.jsx                     # Top-level feature provider structural root
    │   ├── app.routes.jsx              # Declarative client-side routing hierarchy maps
    │   ├── main.jsx                    # Presentation tree DOM mounting node
    │   ├── .env                        # Local target client environment configurations
    │   ├── eslint.config.js            # Frontend formatting code quality schema
    │   ├── index.html                  # Client canvas single-page asset target shell
    │   ├── package.json                # Frontend asset mapping registry
    │   └── vite.config.js              # Reverse proxy development configuration engine


🏗️ Interview Architect System Topology Map

                  +-----------------------------+
                               |     React Client (Vite)     |
                               +--------------+--------------+
                                              |
                       +----------------------+----------------------+
                       | (HTTPS Cookies)                             | (REST API Payload Ingestion)
                       v                                             v
         +---------------------------+                 +---------------------------+
         | /api/auth Routing Layer   |                 | /api/interview & /api/user|
         +-------------+-------------+                 +-------------+-------------+
                       |                                             |
                       v                                             v
        +--------------+--------------+               +--------------+--------------+
        |   authMiddleware Pipeline   |               |    Multer Memory Buffer     |
        +--------------+--------------+               +--------------+--------------+
                       |                                             | (Intercept & Parse Stream)
                       v                                             v
        +--------------+--------------+               +--------------+--------------+
        |  tokenVersion / Revocation  |               |   pdfUpload.middleware.js   |
        +--------------+--------------+               +--------------+--------------+
                       |                                             | (Extracted Text Layout)
                       |                                             v
                       |                              +--------------+--------------+
                       |                              |     Google Gemini Pro AI    |
                       |                              +--------------+--------------+
                       |                                             | (Analyze Gaps & Plans)
                       v                                             v
        +--------------+--------------+               +--------------+--------------+
        |     Upstash Redis Cache     |               |      MongoDB Atlas DB       |
        |  [Ephemeral OTP / Sessions] |               |  [Users, Reports, Sandbox]  |
        +-----------------------------+               +--------------+--------------+
                                                                     ^
                                                                     |
                              +--------------------------------------+
                              | (State Verification Check)
                              v
               +--------------+--------------+
               |    /api/sandbox Intercept   |
               +--------------+--------------+
                              |
                              v
               +--------------+--------------+
               |     sandboxGuard Engine     |
               +--------------+--------------+

🔄 End-to-End Operational Lifecycle & Anti-Cheat Pipeline


            [STAGE 1: IDENTITY ONBOARDING]
   User Registration ──► POST /register-request ──► Generate 6-Digit OTP ──► Redis Memory Store
                                                                                   │
                                                                                   ▼
   Cookie Session Issued ◄── HTTP Cookie 201 ◄── Match Token In Redis ◄── POST /register-verify

---

 [STAGE 2: INTEL INGESTION & ROADMAP FACTORY]
   User Ingestion Data ──► Body: Job & Self Description + Binary File (Resume.pdf)
                                                    │
                                                    ▼
   Structured AI Document ◄── Ingest Output ◄── Gemini Pro SDK Engine Parsing Text
    * Technical Questions Stack
    * Behavioral Evaluation Profiling
    * Skill Gap Vector Cards  ──────┐
                                    │
                                    ▼
 [STAGE 3: THE ANTI-CHEAT EVALUATION SANDBOX]
                                    │
                                    v
                         POST /sandbox/initialize  ◄── Checks Ban State Via sandboxGuard
                                    │
                                    ▼
                           POST /sandbox/start     ──► Activating Server-Side Live Stopwatch
                                    │
                                    ▼
                     ┌──────────────┴──────────────┐
                     │ Live Operational Testing    │
                     └──────────────┬──────────────┘
                                    │
                     [User Switches Tab / Loses Focus]
                                    │
                                    ▼
                           POST /sandbox/penalty   ──► Modifies DB Penalty Tracking Flag
                                    │
                         ┌──────────┴──────────┐
                         │   Is Penalty >= 5?  │
                         └────┬────────────┬───┘
                              │            │
                     YES ─────┘            └───── NO
                      ▼                           ▼
          [IMMEDIATE SESSION LOCKOUT]     Permit Execution ──► POST /sandbox/submit
          Status Context: 'terminated'                                 │
          Account Restricted Vector                                    ▼
                                                              Calculate Final Evaluation Matrix
                                                              Shift Status to 'completed'

---

 [STAGE 4: AUTOMATED TAILORED DOCUMENT STREAM]
   Request Print Asset ──► POST /resume/pdf/:interviewReportId ──► Load Target Match Context
                                                                           │
                                                                           ▼
   Raw print-ready binary PDF application stream ◄──────────────── Puppeteer Headless Print Engine

   


    🏗️ Central API Reference Directory
🔑 Identity & Session Subsystem (/api/auth)
1. Registration Process Initializer
Endpoint URL: POST /api/auth/register-request

Access Control: Public

Payload Structure (application/json):

JSON
{
  "userName": "syed",
  "email": "syed@example.com",
  "password": "secure_pass_phrase"
}
Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "message": "A verification validation code has been sent to your email. Please verify within 5 minutes."
}
2. Registration Verification Confirmer
Endpoint URL: POST /api/auth/register-verify

Access Control: Public

Payload Structure (application/json):

JSON
{
  "email": "syed@example.com",
  "otp": "482910"
}
Success Assessment Context (21 Created):

Response Headers: Set-Cookie: token=<JWT_String>; HttpOnly; Secure; SameSite=Lax; Path=/;

JSON
{
  "status": "success",
  "message": "Email identity verified. Account established successfully.",
  "data": {
    "user": {
      "_id": "",
      "userName": "syed",
      "email": "syed@example.com"
    }
  }
}
3. Credentials Authentication Target
Endpoint URL: POST /api/auth/login

Access Control: Public

Payload Structure (application/json):

JSON
{
  "email": "syed@example.com",
  "password": "secure_pass_phrase"
}
Success Assessment Context (200 OK):

Response Headers: Set-Cookie: token=<JWT_String>; HttpOnly; Secure; SameSite=Lax; Path=/;

JSON
{
  "status": "success",
  "message": "Authentication successful.",
  "data": {
    "user": {
      "_id": "",
      "userName": "syed",
      "email": "syed@example.com"
    }
  }
}
4. Active Browser State Session Invalidator
Endpoint URL: POST /api/auth/logout

Access Control: Private (Requires validation cookie context parsed match)

Success Assessment Context (200 OK):

Response Headers: Set-Cookie: token=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/;

JSON
{
  "status": "success",
  "message": "Logged out completely and securely."
}
5. High-Security Multi-Device Termination System
Endpoint URL: POST /api/auth/logout-all

Access Control: Private

Description: Global sign-out mechanism that increments the user's tokenVersion field on-disk, concurrently invalidating all issued tokens across all logged-in devices.

Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "message": "Global authorization revoked. Logged out of all devices."
}
6. Authenticated Session Identity Introspector
Endpoint URL: GET /api/auth/get-me

Access Control: Private

Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "message": "User profile retrieved successfully.",
  "data": {
    "user": {
      "_id": "",
      "userName": "syed",
      "email": "syed@example.com"
    }
  }
}
7. Password Reset Token Dispatcher
Endpoint URL: POST /api/auth/forgot-password

Access Control: Public

Payload Structure (application/json):

JSON
{
  "email": "syed@example.com"
}
Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "message": "Password reset link dispatched to your email address cleanly."
}
8. Password Reset Parameter Modifier
Endpoint URL: POST /api/auth/reset-password/:token

Access Control: Public

URL Path Variables: token (Cryptographic verification hash string)

Payload Structure (application/json):

JSON
{
  "password": "new_highly_secure_pass_phrase"
}
Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "message": "Password updated successfully."
}
🤖 Intelligence Evaluation & Resume Pipeline (/api/interview)
1. Public Shareable Report Target Fetcher
Endpoint URL: GET /api/interview/share/:interviewId

Access Control: Public

URL Path Variables: interviewId (Target report unique reference id)

Description: Public view to read a shared layout report without passing credentials headers (Controller asserts isPublic === true).

Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "isPublicView": true,
  "interviewReport": {
    "_id": "",
    "title": "Backend Engineering Architect Prep Evaluation Report",
    "technicalQuestions": [ "Explain how you troubleshoot memory leaks in Node.js applications." ],
    "behavioralQuestions": [ "Describe a technical dispute regarding database engines and your solution." ],
    "skillGaps": [ "Redis Clustering", "Distributed Locking Architecture" ],
    "preparationPlan": { "timeline": "3 Weeks", "focus": "System Scaling" }
  }
}
2. Report Visibility Parameter Toggler
Endpoint URL: PATCH /api/interview/:interviewId/visibility

Access Control: Private

URL Path Variables: interviewId (Target report unique reference id)

Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "message": "Report visibility modified successfully.",
  "isPublic": true
}
3. Blueprint Multipart Profiler Generator
Endpoint URL: POST /api/interview

Access Control: Private

Payload Structure (multipart/form-data):

selfDescription: "I am a backend developer experienced with basic Express.js and looking to target distributed systems roles."

jobDescription: "Seeking a senior systems architect fluent in high-availability backend cluster design, cache invalidation, and data streaming configurations."

resume: [Binary PDF Asset Stream Ingestion]

Success Assessment Context (21 Created):

JSON
{
  "status": "success",
  "message": "Interview report generated successfully.",
  "interviewReport": {
    "_id": "",
    "user": "",
    "title": "Backend Engineering Architect Prep Evaluation Report",
    "technicalQuestions": [
      "Explain the design trade-offs of single-threaded event loops versus multi-threaded execution runtimes."
    ],
    "behavioralQuestions": [
      "Tell me about a project failure where you managed code debt under severe time constraints."
    ],
    "skillGaps": [ "Advanced Redis Caching", "Systems Optimization", "Asynchronous Processing Design" ],
    "preparationPlan": {
      "timeline": "3 Weeks",
      "focus": "High Availability Backend Cluster Structures"
    }
  }
}
4. Unique Identifier Record Target Fetcher
Endpoint URL: GET /api/interview/report/:interviewId

Access Control: Private

URL Path Variables: interviewId (Target report unique reference id)

Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "interviewReport": {
    "_id": "",
    "user": "",
    "title": "Backend Engineering Architect Prep Evaluation Report",
    "technicalQuestions": [ ... ],
    "behavioralQuestions": [ ... ],
    "skillGaps": [ ... ],
    "preparationPlan": { ... }
  }
}
5. Logged-In User Timeline Indexer
Endpoint URL: GET /api/interview

Access Control: Private

Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "interviewReports": [
    {
      "_id": "",
      "title": "Backend Engineering Architect Prep Evaluation Report",
      "createdAt": "2026-05-27T12:00:00.000Z"
    }
  ]
}
6. Automated HTML-to-PDF Resume Stream Renderer
Endpoint URL: POST /api/interview/resume/pdf/:interviewReportId

Access Control: Private

URL Path Variables: interviewReportId (Source assessment snapshot id)

Network Action: Prompts Puppeteer to programmatically construct an ATS-optimized layout matching keyword gaps, and streams a raw binary payload back to the interface layer.

Network Response Interface Setup Matrix:

Headers: Content-Type: application/pdf

Headers: Content-Disposition: attachment; filename=tailored_resume_6654c10f.pdf

🛡️ Interactive Sandbox Prototyping & Anti-Cheat Engine (/api/sandbox)
1. Active State Identity Synchronization
Endpoint URL: GET /api/sandbox/current

Access Control: Private

Description: Queries the persistence layer for any initialized or active sandbox instances assigned to the logged-in user context. Reconstructs running configurations seamlessly if the user refreshes or crashes.

Success Assessment Context (200 OK):

JSON
{
  "success": true,
  "sandbox": {
    "_id": "",
    "status": "active",
    "penaltyCount": 1,
    "problems": [
      {
        "id": "q1",
        "question": "Implement an optimized token-bucket algorithm using an active Redis distributed memory cluster context.",
        "difficulty": "Hard"
      }
    ]
  }
}
2. Assessment Stack Compilation Initializer
Endpoint URL: POST /api/sandbox/initialize

Access Control: Private (Enforced via verifySandboxAccess verification lock parameters)

Description: Scans running skill gap arrays, invokes Gemini Pro, locks a 10-problem customized evaluation stack on-disk, and shifts context.

State Transition: null ➔ 'initialized'

Success Assessment Context (200 OK):

JSON
{
  "success": true,
  "message": "Targeted evaluation profile compiled from matching skill gaps. Environment ready.",
  "status": "initialized"
}
3. Execution Lifecycle Server-Side Activator
Endpoint URL: POST /api/sandbox/start

Access Control: Private

Description: Activates the authoritative exam timeframe records inside MongoDB and reveals the un-scrubbed problem payload to UI state machines.

State Transition: 'initialized' ➔ 'active'

Success Assessment Context (200 OK):

JSON
{
  "success": true,
  "startTime": "2026-05-27T12:05:00.000Z",
  "status": "active"
}
4. Focus Infraction Penalty Log Incrementer
Endpoint URL: POST /api/sandbox/penalty

Access Control: Private

Description: Increments infraction metrics inside MongoDB memory blocks when clients emit blur, tab switch, or secondary view triggers. Reaching 5 instances forces an automatic ban, halting execution.

State Transition: 'active' ➔ 'terminated' (Triggered only if threshold is violated)

Success Assessment Context (200 OK):

JSON
{
  "success": true,
  "penaltyCount": 3,
  "message": "Focus infraction recorded. Platform security threshold warning: 3/5 entries."
}
5. Evaluation Payload Structural Committer
Endpoint URL: POST /api/sandbox/submit

Access Control: Private

Payload Structure (application/json):

JSON
{
  "answers": [
    { "questionId": "q1", "codeSubmission": "const client = require('redis').createClient()..." }
  ]
}
State Transition: 'active' ➔ 'completed'

Success Assessment Context (200 OK):

JSON
{
  "success": true,
  "status": "completed",
  "message": "Evaluation payload structural checks successfully passed.",
  "score": {
    "correctCount": 8,
    "totalCount": 10,
    "percentage": 80
  }
}
6. Sandbox Runtime Destruction Surrender Engine
Endpoint URL: DELETE /api/sandbox/quit

Access Control: Private

State Transition: 'initialized' or 'active' ➔ Deleted

Success Assessment Context (200 OK):

JSON
{
  "success": true,
  "message": "Sandbox session aborted and deleted."
}
👤 User Workspace & Profile Slot Management (/api/user)
1. Profile Dashboard Component Engine
Endpoint URL: GET /api/user/profile

Access Control: Private

Description: Computes system telemetry metrics including global averages, system tracking records, historical report arrays, and storage limits.

Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "data": {
    "user": { "userName": "syed", "email": "syed@example.com" },
    "metrics": {
      "totalReportsCompiled": 4,
      "currentActivePenalties": 0,
      "averageMatchIndex": "76%"
    },
    "storedResumes": [
      { "_id": "res_01", "nickname": "Primary Backend CV", "uploadedAt": "2026-05-20T10:00:00.000Z" }
    ]
  }
}
2. Persistent Document Slot Allocator
Endpoint URL: POST /api/user/resume

Access Control: Private

Payload Structure (multipart/form-data):

resume: [Raw application/pdf Stream Data Asset Input]

Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "message": "Resume asset saved and locked into profile document slot successfully.",
  "resumeSlot": {
    "_id": "res_01",
    "nickname": "Uploaded Resume #1",
    "storagePath": "secure_cloud_bucket_path_string"
  }
}
3. Slot Identity Parameter Renamer
Endpoint URL: PATCH /api/user/resume/:resumeId

Access Control: Private

URL Path Variables: resumeId (Target document reference key)

Payload Structure (application/json):

JSON
{
  "nickname": "System Architect Tailored Master"
}
Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "message": "Resume document moniker modified successfully."
}
4. Allocated Document Asset Deallocator
Endpoint URL: DELETE /api/user/resume/:resumeId

Access Control: Private

URL Path Variables: resumeId (Target document reference key)

Success Assessment Context (200 OK):

JSON
{
  "status": "success",
  "message": "Resume document entry cleared from cloud registry records."
}