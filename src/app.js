const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/auth.routes.js');

const app = express();

// ==========================================
// 🛠️ CORE MIDDLEWARES
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // 💡 Fixed: Added function parenthesis call invocation bracket layers

app.use(cors({
    origin: true, 
    credentials: true
}));

// ==========================================
// 🗺️ ROUTE BINDINGS
// ==========================================
app.use("/api/auth", authRouter);

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