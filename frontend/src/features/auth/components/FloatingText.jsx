import React, { useState, useEffect } from 'react';

const PHRASES = [
    { prefix: "Empower Yourself to", word: "Learn Mechanics.", color: "#ff2d78" },
    { prefix: "Architect Systems to", word: "Build Infrastructure.", color: "#10b981" },
    { prefix: "Sharpen Skills to", word: "Get Skilled.", color: "#06b6d4" }
];

export default function FloatingText() {
    const [index, setIndex] = useState(0);
    const [animState, setAnimState] = useState("fade-in");

    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Instantly trigger the fast fade out (0.2s)
            setAnimState("fade-out");
            
            setTimeout(() => {
                // 2. Cycle index values instantly while text is completely transparent
                setIndex((prev) => (prev + 1) % PHRASES.length);
                setAnimState("fade-prep");
                
                // 3. Snap up into frame instantly with crisp deceleration
                setTimeout(() => {
                    setAnimState("fade-in");
                }, 30); // 30ms framework processing delay

            }, 220); // Aligns perfectly with the 0.22s SCSS fade window

        }, 5450); // 5 seconds perfectly frozen + ~0.45s combined transition times

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="auth-banner-pane">
            <div className="ambient-glow" />
            <div className="ambient-glow glow-secondary" />

            <div className="banner-content">
                <div className="version-pill">
                    <div className="pulse-dot" />
                    <span className="pill-text">Interview Arena Engine</span>
                </div>

                <h1 className="banner-title">
                    <span className="action-prefix">{PHRASES[index].prefix}</span> <br />
                    <span className="sliding-word-wrapper">
                        <span 
                            className={`floating-keyword ${animState}`} 
                            style={{ color: PHRASES[index].color }}
                        >
                            {PHRASES[index].word}
                        </span>
                    </span>
                </h1>

                <p className="banner-description">
                    Stop memorizing static question answers. Train inside highly realistic, real-time reactive interview sandbox environments graded by premium generative models.
                </p>
            </div>
        </div>
    );
}