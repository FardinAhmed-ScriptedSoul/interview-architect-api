const config = require('../config/config.js');
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: config.GOOGLE_GEN_API_KEY
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const promptText = `
        You are a principal technical interviewer evaluating a candidate profile against a targeted job specification.
        
        [TARGET JOB POSITION SPECIFICATION]:
        ${jobDescription}

        [CANDIDATE RESUME PROFILE]:
        ${resume}

        [CANDIDATE SELF-DESCRIPTION]:
        ${selfDescription}

        CRITICAL OUTPUT MANDATE:
        Analyze the inputs and assemble a cohesive Interview Analysis Report object.
        You must strictly match the following properties as native JSON arrays of objects. 
        DO NOT wrap array elements inside string blocks, do not embed markdown, and do not use backticks.

        Strictly follow these property criteria:
        - "title": Clean, short target job position title.
        - "matchScore": Integer between 0 and 100.
        - "technicalQuestions": Array of exactly 3 objects containing "question", "intention", and "answer".
        - "behavioralQuestions": Array of exactly 2 objects containing "question", "intention", and "answer".
        - "skillGaps": Array of objects containing "skill" and "severity" (MUST be exactly "low", "medium", or "high").
        - "preparationPlan": Array of exactly 3 objects containing "day" (string like "Day 1"), "focus" (string), and "tasks" (array of strings).

        CRITICAL SIZE & SPEED CONSTRAINT:
        Keep all generated question text, intentions, and answers brief and punchy (under 3 sentences per field). This is mandatory to prevent payload truncation and transmission timeouts.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptText,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING" },
                        matchScore: { type: "INTEGER" },
                        technicalQuestions: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    question: { type: "STRING" },
                                    intention: { type: "STRING" },
                                    answer: { type: "STRING" }
                                },
                                required: ["question", "intention", "answer"]
                            }
                        },
                        behavioralQuestions: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    question: { type: "STRING" },
                                    intention: { type: "STRING" },
                                    answer: { type: "STRING" }
                                },
                                required: ["question", "intention", "answer"]
                            }
                        },
                        skillGaps: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    skill: { type: "STRING" },
                                    severity: { type: "STRING", enum: ["low", "medium", "high"] }
                                },
                                required: ["skill", "severity"]
                            }
                        },
                        preparationPlan: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    day: { type: "STRING" },
                                    focus: { type: "STRING" },
                                    tasks: {
                                        type: "ARRAY",
                                        items: { type: "STRING" }
                                    }
                                },
                                required: ["day", "focus", "tasks"]
                            }
                        }
                    },
                    required: ["title", "matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan"]
                }
            }
        });

        let rawText = response.text.trim();
        
        // Clean away any markdown formatting noise
        rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

        if (!rawText.startsWith('{') || !rawText.endsWith('}')) {
            throw new Error("Gemini returned an incomplete or truncated JSON response payload.");
        }

        const rawReport = JSON.parse(rawText);

        // 🟢 SANITATION LAYER: Explicitly map fields to strip extra keys and guarantee type arrays
        const cleanReport = {
            title: rawReport.title || "Backend Engineer",
            matchScore: typeof rawReport.matchScore === 'number' ? rawReport.matchScore : 80,
            technicalQuestions: Array.isArray(rawReport.technicalQuestions) 
                ? rawReport.technicalQuestions.map(q => ({
                    question: q.question || "Technical Scenario Question",
                    intention: q.intention || "Evaluate core technical alignment",
                    answer: q.answer || "Conceptual explanation blueprint"
                  }))
                : [],
            behavioralQuestions: Array.isArray(rawReport.behavioralQuestions)
                ? rawReport.behavioralQuestions.map(q => ({
                    question: q.question || "Behavioral Scenario Question",
                    intention: q.intention || "Evaluate professional soft skills",
                    answer: q.answer || "STAR framework methodology response"
                  }))
                : [],
            skillGaps: Array.isArray(rawReport.skillGaps)
                ? rawReport.skillGaps.map(gap => ({
                    skill: gap.skill || "General Technology Requirement",
                    severity: ["low", "medium", "high"].includes(gap.severity?.toLowerCase()) 
                        ? gap.severity.toLowerCase() 
                        : "medium"
                  }))
                : [],
            preparationPlan: Array.isArray(rawReport.preparationPlan)
                ? rawReport.preparationPlan.map((plan, index) => ({
                    day: plan.day || `Day ${index + 1}`,
                    focus: plan.focus || "Core Curricular Focus",
                    tasks: Array.isArray(plan.tasks) ? plan.tasks : ["Review documentation and sample modules"]
                  }))
                : []
        };

        return cleanReport;

    } catch (error) {
        console.error("💥 Gemini Schema Structuring Failure:", error);
        throw error;
    }
}

module.exports = generateInterviewReport;