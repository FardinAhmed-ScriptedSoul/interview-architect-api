import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
});

// 🟢 GLOBAL ERROR HANDLER INTERCEPTOR
// Catching global server faults (like 401 Unauthorized or 500 Crashing Pipelines) safely
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const errorMessage = error.response?.data?.message || "An unexpected server network error occurred.";
        console.error("🌐 API Interceptor Catch:", errorMessage);
        
        // Example: Auto-wipe or redirect on dropped validation credentials
        if (error.response?.status === 401) {
            console.warn("Session expired or token invalid. Redirecting to auth entry portal...");
            // Optional: window.location.href = "/login";
        }
        
        return Promise.reject(error);
    }
);

/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription);
    formData.append("resume", resumeFile);

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return response.data;
};

/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`);
    return response.data;
};

/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/");
    return response.data;
};

/**
 * @description Service to generate resume pdf based on user data.
 */
// 🟢 CLEANED NAME SIGNATURE: Dropped "Service" suffix for interface naming convention uniformity
export const generateResumePdf = async (interviewReportId) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, {}, {
        responseType: "blob" // 🚀 CRITICAL: Crucial for browser-side binary download processing 
    });

    return response.data;
};