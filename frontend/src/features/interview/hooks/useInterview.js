import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api";
import { useContext, useEffect } from "react";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router";

export const useInterview = () => {
    const context = useContext(InterviewContext);
    const { interviewId } = useParams();

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider");
    }

    // ✅ ADDED: Pull error and setError from context
    const { loading, setLoading, report, setReport, reports, setReports, error, setError } = context;

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true);
        setError(null); // ✅ Clear previous error before each attempt
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile });
            if (response?.interviewReport) {
                setReport(response.interviewReport);
                return response.interviewReport;
            }
        } catch (err) {
            console.error("💥 Error generating interview report:", err);
            // ✅ ADDED: Detect 429 quota error and set a clean error object
            setError({
                status: err.response?.status || err.status,
                message: err.response?.data?.message || err.message
            });
        } finally {
            setLoading(false);
        }
        return null;
    };

    const getReportById = async (id) => {
        setLoading(true);
        setError(null); // ✅ Clear previous error before each attempt
        try {
            const response = await getInterviewReportById(id);
            if (response?.interviewReport) {
                setReport(response.interviewReport);
                return response.interviewReport;
            }
        } catch (err) {
            console.error(`💥 Error fetching report ${id}:`, err);
            // ✅ ADDED: Store structured error for the Interview page to consume
            setError({
                status: err.response?.status || err.status,
                message: err.response?.data?.message || err.message
            });
        } finally {
            setLoading(false);
        }
        return null;
    };

    const getReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getAllInterviewReports();
            if (response?.interviewReports) {
                setReports(response.interviewReports);
                return response.interviewReports;
            }
        } catch (err) {
            console.error("💥 Error fetching user histories:", err);
            setError({
                status: err.response?.status || err.status,
                message: err.response?.data?.message || err.message
            });
        } finally {
            setLoading(false);
        }
        return [];
    };

    const getResumePdfFile = async (interviewReportId) => {
        setLoading(true);
        setError(null);
        try {
            const blobData = await generateResumePdf(interviewReportId);
            const url = window.URL.createObjectURL(blobData);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `resume_${interviewReportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("💥 Error during resume compiler download sequence:", err);
            setError({
                status: err.response?.status || err.status,
                message: err.response?.data?.message || err.message
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId);
        } else {
            getReports();
        }
    }, [interviewId]);

    return {
        loading,
        report,
        reports,
        error,        // ✅ ADDED: Now exposed to Interview.jsx
        generateReport,
        getReportById,
        getReports,
        getResumePdf: getResumePdfFile
    };
};