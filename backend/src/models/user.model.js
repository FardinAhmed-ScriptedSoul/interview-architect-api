const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config.js');

const userSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: [true, "Name is required for creating an account"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required for creating a user"],
            trim: true,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
            unique: true,
            index: true
        },
        password: {
            type: String,
            required: [true, "Password is required for creating an account"],
            minlength: [6, "Password must contain at least 6 characters"],
            select: false // Prevents leakage during generic queries
        },
        tokenVersion: {
            type: Number,
            default: 0, // Increments to invalidate all active multi-device tokens instantly
            select: false
        }
    },
    { timestamps: true }
);

// 🔒 Pre-Save Automation: Securely Hash Passwords before database writes
userSchema.pre("save", async function () { // 💡 Removed 'next' here
    if (!this.isModified("password")) return; // 💡 Return directly instead of next()
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
});

// 🛠️ Instance Method: Safely compare plain-text inputs with database hashes
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// 🛠️ Instance Method: Generate signed authentication tokens bound to the current tokenVersion
userSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        { 
            _id: this._id, 
            tokenVersion: this.tokenVersion 
        }, 
        config.jwt.secret, 
        { expiresIn: config.jwt.expiresIn }
    );
};

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;