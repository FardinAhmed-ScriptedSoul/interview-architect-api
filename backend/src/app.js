// app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const app = express();

// ==========================================
// 🛠️ CORE MIDDLEWARES
// ==========================================
app.use(cors({
    origin: function (origin, callback) {
        if (
            !origin || 
            /^https?:\/\/localhost:\d+$/.test(origin) ||          // ✅ Localhost origins (e.g. 5173, 3000)
            /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin)          // ✅ Local loopback IP address variants
        ) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy restriction blocked: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']   // ✅ Added explicitly for secure credential parsing
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// ==========================================
// 🗺️ ROUTE BINDINGS
// ==========================================

/**
 * AUTH router bindings
 */
const authRouter = require('./routes/auth.routes.js');
app.use("/api/auth", authRouter);

/**
 * USER specific router bindings
 */
const userRouter = require('./routes/user.routes.js');
app.use("/api/user", userRouter);

/**
 * INTERVIEW router bindings
 */
const interviewRouter = require("./routes/interview.routes.js");
app.use("/api/interview", interviewRouter);

/**
 * PRACTICE SANDBOX router bindings
 */
const sandboxRouter = require('./routes/sandbox.routes.js');
app.use("/api/sandbox", sandboxRouter);

/**
 * @route       GET /health
 * @description System health diagnostic check to verify operational server states
 * @access      Public
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString()
    });
});

// ==========================================
// 💥 GLOBAL CENTRALIZED ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
    console.error(`💥 Runtime Intercept: ${err.stack}`);
    
    const statusCode = err.name === 'ValidationError' ? 400 : 500;
    return res.status(statusCode).json({
        status: "error",
        message: err.message || "Internal server error occurred within application lifecycle core."
    });
});

module.exports = app;