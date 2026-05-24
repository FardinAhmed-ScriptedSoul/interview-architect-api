const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');


const app = express();

// ==========================================
// 🛠️ CORE MIDDLEWARES
// ==========================================
app.use(cors({
    origin: 'https://glowing-space-computing-machine-pj649v65rqjqc674-5173.app.github.dev', 
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// 🗺️ ROUTE BINDINGS
// ==========================================
/**
 * AUTH router bindings
 */
const authRouter = require('./routes/auth.routes.js');
app.use("/api/auth", authRouter);

/**
 * INTERVIEW router bindings
 */
const interviewRouter = require("./routes/interview.routes.js")
app.use("/api/interview/",interviewRouter)



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