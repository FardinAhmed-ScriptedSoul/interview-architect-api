import { createContext, useState } from "react";
import axios from "axios"; // or wherever your API instance is configured

export const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [reports, setReports] = useState([]);
    const [error, setError] = useState(null);

    // ─── ADD THIS FUNCTION INSIDE YOUR PROVIDER ─────────────────
    const generateReport = async (payload) => {
        setLoading(true);
        setError(null); // Clear any previous errors

        try {
            // Adjust the URL if your backend port/route is different
            const response = await axios.post("/api/interview", payload, {
                headers: {
                    "Content-Type": "application/json",
                }
            });

            const data = response.data;
            setReport(data);
            
            // Optional: Add new report to the list of historical reports
            setReports((prev) => [data, ...prev]); 
            
            return data;
        } catch (err) {
            // Extract the deep nested error string from your backend log
            const backendMessage = err.response?.data?.error?.message 
                || err.response?.data?.message 
                || "API_QUOTA_EXHAUSTED or internal server failure.";
            
            setError(backendMessage); // Save to context state
            
            throw new Error(backendMessage); // CRITICAL: Throw this so Home.jsx can catch it and show the toast!
        } finally {
            setLoading(false);
        }
    };
    // ────────────────────────────────────────────────────────────

    return (
        <InterviewContext.Provider value={{
            loading, setLoading,
            report, setReport,
            reports, setReports,
            error, setError,
            generateReport // 👈 Make sure to pass the function down here!
        }}>
            {children}
        </InterviewContext.Provider>
    );
};