const config = require('../config/config.js');
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ 
    apiKey: config.google.genApiKey || process.env.GOOGLE_GEN_API_KEY 
});

/**
 * Helper function to safely extract text from the @google/genai response object
 */
function extractRawText(response) {
    if (!response) return "";
    if (typeof response.text === 'function') return response.text().trim();
    if (typeof response.text === 'string') return response.text.trim();
    if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.candidates[0].content.parts[0].text.trim();
    }
    return "";
}

/**
 * Helper function to format errors consistently for the Express error middleware
 */
function handleAiError(error, contextMessage) {
    console.error(`💥 ${contextMessage}:`, error.message || error);
    
    // Check for explicit 429 rate limits from Google's API
    if (error.status === 429 || error.statusCode === 429 || error.message?.includes('429')) {
        const quotaError = new Error("API_QUOTA_EXHAUSTED");
        quotaError.status = 429;
        throw quotaError;
    }
    throw error;
}

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
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        matchScore: { type: "integer" },
                        technicalQuestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    question: { type: "string" },
                                    intention: { type: "string" },
                                    answer: { type: "string" }
                                },
                                required: ["question", "intention", "answer"]
                            }
                        },
                        behavioralQuestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    question: { type: "string" },
                                    intention: { type: "string" },
                                    answer: { type: "string" }
                                },
                                required: ["question", "intention", "answer"]
                            }
                        },
                        skillGaps: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    skill: { type: "string" },
                                    severity: { type: "string", enum: ["low", "medium", "high"] }
                                },
                                required: ["skill", "severity"]
                            }
                        },
                        preparationPlan: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    day: { type: "string" },
                                    focus: { type: "string" },
                                    tasks: {
                                        type: "array",
                                        items: { type: "string" }
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

        let rawText = extractRawText(response);
        if (!rawText) throw new Error("Gemini returned an empty raw text payload.");

        rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        const rawReport = JSON.parse(rawText);

        return {
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

    } catch (error) {
        handleAiError(error, "Gemini Schema Structuring Failure");
    }
}

async function generateTailoredResume({ resume, jobDescription, selfDescription }) {
    const promptText = `
        You are an expert ATS resume writer and career coach.
        Your task: Rewrite and tailor the candidate's resume specifically for the target job.

        [TARGET JOB DESCRIPTION]:
        ${jobDescription}

        [CANDIDATE RESUME / PROFILE]:
        ${resume}

        [CANDIDATE SELF DESCRIPTION]:
        ${selfDescription || 'Not provided'}

        CRITICAL INSTRUCTIONS:
        - Extract real information from the resume — do NOT invent fake experience or companies
        - Tailor the summary and bullet points to mirror the job description language
        - Prioritize skills and experience most relevant to the target role
        - Use strong action verbs and quantify achievements wherever possible
        - Make every bullet point ATS-friendly by naturally including job keywords
        - If phone/location/linkedin/github are not in the resume, return empty string
        - Return ONLY valid JSON matching the schema exactly, no extra commentary
    `;

    const rawSchema = {
        type: "object",
        properties: {
            fullName:  { type: "string" },
            email:     { type: "string" },
            phone:     { type: "string" },
            location:  { type: "string" },
            linkedin:  { type: "string" },
            github:    { type: "string" },
            summary:   { type: "string" },
            skills: {
                type: "array",
                items: { type: "string" }
            },
            experience: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title:    { type: "string" },
                        company:  { type: "string" },
                        duration: { type: "string" },
                        bullets: {
                            type: "array",
                            items: { type: "string" }
                        }
                    },
                    required: ["title", "company", "duration", "bullets"]
                }
            },
            education: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        degree:      { type: "string" },
                        institution: { type: "string" },
                        year:        { type: "string" }
                    },
                    required: ["degree", "institution", "year"]
                }
            },
            projects: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name:    { type: "string" },
                        tech:    { type: "string" },
                        bullets: {
                            type: "array",
                            items: { type: "string" }
                        }
                    },
                    required: ["name", "tech", "bullets"]
                }
            }
        },
        required: ["fullName", "email", "summary", "skills", "experience", "education", "projects"]
    };

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = null;

    for (const model of models) {
        try {
            console.log(`🤖 Trying model: ${model}`);

            const response = await ai.models.generateContent({
                model,
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: rawSchema
                }
            });

            let rawText = extractRawText(response);
            if (!rawText) throw new Error("AI returned empty response.");

            rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
            const parsedData = JSON.parse(rawText);

            if (!parsedData || Object.keys(parsedData).length === 0 || (!parsedData.fullName && !parsedData.summary)) {
                throw new Error("AI returned empty context layout wrapper.");
            }

            console.log(`✅ Resume data generated perfectly for: ${parsedData.fullName}`);
            return parsedData;

        } catch (error) {
            lastError = error;
            if (error.status === 429 || error.statusCode === 429 || error.message?.includes('429')) {
                console.warn(`⚠️ ${model} quota exhausted, trying next fallback...`);
                continue;
            }
            console.error(`💥 Non-quota error with ${model}:`, error.message || error);
        }
    }

    handleAiError(lastError || new Error("All AI models exhausted."), "Resume Generation Cascade Loop Failed");
}

async function generatePracticeQuestions(topic) {
    try {
        const prompt = `You are an elite Lead Backend Engineer conducting a technical interview.
Generate exactly 3 deep-dive technical interview questions focusing specifically on the topic: "${topic}".
Each question must target core architectural patterns, execution environments, or advanced optimization engineering principles.`;

        const responseSchema = {
            type: "object",
            properties: {
                topic: { type: "string" },
                questions: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            questionId: { type: "string", description: "A unique short tag string, e.g., 'q1', 'q2'" },
                            question: { type: "string" },
                            intent: { type: "string", description: "What core optimization or mechanics concept does this question evaluate?" },
                            idealAnswerCore: { type: "string", description: "Brief overview of what a candidate must highlight to earn full marks." }
                        },
                        required: ["questionId", "question", "intent", "idealAnswerCore"]
                    }
                }
            },
            required: ["topic", "questions"]
        };

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const textOut = extractRawText(result);
        if (!textOut) throw new Error("Gemini returned an empty questions payload.");

        return JSON.parse(textOut.trim());
    } catch (error) {
        handleAiError(error, "AI Service Error Generating Practice Questions");
    }
}

async function gradePracticeAnswer({ topic, question, intent, candidateAnswer }) {
    try {
        const prompt = `You are an expert technical interviewer evaluating an engineering candidate's response.
Topic: ${topic}
Question Asked: ${question}
Core Concept Being Evaluated: ${intent}
Candidate's Typed Submission: "${candidateAnswer}"

Analyze the correctness, vocabulary accuracy, and depth of the response. Grade it strictly on a scale from 0 to 100.`;

        const responseSchema = {
            type: "object",
            properties: {
                score: { type: "number", description: "Score from 0 to 100 based on accuracy and technical depth." },
                verdict: { type: "string", description: "Brief evaluation tag summary, e.g., 'Strong Pass', 'Partial Alignment', 'Gaps Present'" },
                critique: { type: "string", description: "A balanced review explaining what they hit or what critical elements they missed." },
                strengths: { type: "array", items: { type: "string" }, description: "Specific accurate concepts they called out." },
                gapsToFill: { type: "array", items: { type: "string" }, description: "Missing keywords, architectural concepts, or structural corrections needed." }
            },
            required: ["score", "verdict", "critique", "strengths", "gapsToFill"]
        };

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const textOut = extractRawText(result);
        if (!textOut) throw new Error("Gemini returned an empty grading payload.");

        return JSON.parse(textOut.trim());
    } catch (error) {
        handleAiError(error, "AI Service Error Grading Practice Response");
    }
}

module.exports = { 
    generateInterviewReport, 
    generateTailoredResume,
    generatePracticeQuestions, 
    gradePracticeAnswer
};