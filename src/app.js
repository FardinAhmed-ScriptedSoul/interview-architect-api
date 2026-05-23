const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const app = express();

// ==========================================
// 🛠️ CORE MIDDLEWARES
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: true, 
    credentials: true
}));
app.use(cookieParser)

// ==========================================
// 🗺️ BASE HEALTH CHECK ROUTE
// ==========================================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString()
    });
});



module.exports = app;