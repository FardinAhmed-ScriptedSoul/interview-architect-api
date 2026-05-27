import { useContext, useEffect, useCallback } from "react";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router";
import { 
    getAllInterviewReports, 
    generateInterviewReport, 
    getInterviewReportById, 
    generateResumePdf 
} from "../services/interview.api";

export const useInterview = () => {
    const context = useContext(InterviewContext);
    const { interviewId } = useParams();

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider");
    }

    const { 
        loading, setLoading, 
        report, setReport, 
        reports, setReports, 
        error, setError 
    } = context;

    // A reusable wrapper to handle loading/error states consistently
    const execute = useCallback(async (apiCall, onSuccess, errorMessage) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiCall();
            if (onSuccess) onSuccess(data);
            return data;
        } catch (err) {
            console.error(`💥 ${errorMessage}:`, err);
            
            // Normalize error fields from typical Axios responses or native errors
            const errorStatus = err.response?.status || err.status || 500;
            const normalizedMessage = err.response?.data?.message || err.message || errorMessage;

            const normalizedError = {
                status: errorStatus,
                message: normalizedMessage
            };

            setError(normalizedError);
            
            // 🟢 FIXED: Re-throw an enriched error object so components can handle specific 429 hooks natively
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setError]);

    const generateReport = useCallback(async (payload) => {
        return execute(
            () => generateInterviewReport(payload),
            (res) => setReport(res.interviewReport),
            "Failed to generate report"
        );
    }, [execute, setReport]);

    const getReportById = useCallback(async (id) => {
        return execute(
            () => getInterviewReportById(id),
            (res) => setReport(res.interviewReport),
            `Failed to fetch report ${id}`
        );
    }, [execute, setReport]);

    const getReports = useCallback(async () => {
        return execute(
            () => getAllInterviewReports(),
            (res) => setReports(res.interviewReports),
            "Failed to fetch user histories"
        );
    }, [execute, setReports]);

    const getResumePdf = useCallback(async (id) => {
        return execute(
            async () => {
                const blob = await generateResumePdf(id);
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `resume_${id}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            },
            null,
            "Failed to download PDF asset"
        );
    }, [execute]);

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId);
        } else {
            getReports();
        }
    }, [interviewId, getReportById, getReports]);

    return {
        loading,
        report,
        reports,
        error,
        generateReport,
        getReportById,
        getReports,
        getResumePdf
    };
};