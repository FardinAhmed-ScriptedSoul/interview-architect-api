import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import "../style/home.scss";
import { useInterview } from "../hooks/useInterview.js";
import Sidebar from "../components/Sidebar.jsx";
import Header from "../components/Header.jsx";

// 1. Import the toaster utilities
import toast, { Toaster } from "react-hot-toast";

const Home = () => {
  // Pull error from your hook if you want to use it globally
  const { loading, generateReport, reports, error } = useInterview();
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const resumeInputRef = useRef();
  const navigate = useNavigate();

  // Theme persistence
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") !== "light",
  );

  useEffect(() => {
    document.body.classList.toggle("light-mode", !isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Handle file validation logic
  const validateAndSetFile = (file) => {
    if (!file) return;

    const allowedExtensions = /(\.pdf|\.docx)$/i;
    if (!allowedExtensions.exec(file.name)) {
      toast.error("Invalid file type! Please upload a PDF or DOCX file.");
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large! Please upload a resume under 5MB.");
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Handle file selection via browse click
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  // Drag and Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateReport = async () => {
    if (!jobDescription.trim()) {
      toast.error("Job Description is required.");
      return;
    }

    if (!selectedFile && !selfDescription.trim()) {
      toast.error("Please provide either a Resume or a Self Description.");
      return;
    }

    const payload = {
      jobDescription: jobDescription.trim(),
      selfDescription: selfDescription.trim(),
      resumeFile: selectedFile,
    };

    console.log("🚀 Dispatching Strategy Generation Request Payload:", payload);
    
    // 2. Wrap execution inside a try-catch blocks to pop up notifications
    try {
      const data = await generateReport(payload);

      if (data) {
        const targetId = data._id || data.interviewReport?._id;
        if (targetId) {
          toast.success("Analysis complete! Redirecting...");
          navigate(`/interview/${targetId}`);
        }
      }
    } catch (err) {
      console.error("Caught component error:", err);
      // Fired instantly on failure using your customized or fallback error message
      const errorReason = err.response?.data?.message || "API Quota Exhausted or Server error encountered.";
      toast.error(`Generation Failed: ${errorReason}`, {
        duration: 6000, // Give them 6 seconds to read the issue
        position: "top-right"
      });
    }
  };

  return (
    <div className="app-layout">
      {/* 3. Drop the Toaster component placeholder into the layout tree */}
      <Toaster />

      <Sidebar
        reports={reports || []}
        onThemeToggle={() => setIsDark((d) => !d)}
        isDark={isDark}
      />

      <div className="home-page">
        <Header />

        <div className="content-wrapper">
          {loading ? (
            <main className="loading-screen">
              <div className="inline-spinner" />
              <h1>Analyzing your profile...</h1>
              <p>Building your optimal technical interview plan.</p>
            </main>
          ) : (
            <>
              <header className="page-header">
                <h1>
                  Create Your Custom{" "}
                  <span className="highlight">Interview Plan</span>
                </h1>
                <p>
                  Let our AI build a winning strategy based on your target job
                  and profile.
                </p>
              </header>

              <div className="interview-card">
                <div className="interview-card__body">
                  <div className="panel panel--left">
                    <div className="panel__header">
                      <h2>Target Job Description</h2>
                      <span className="badge badge--required">Required</span>
                    </div>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="panel__textarea"
                      placeholder="Paste the job description here..."
                      maxLength={5000}
                    />
                    <div className="char-counter">
                      {jobDescription.length} / 5000 chars
                    </div>
                  </div>

                  <div className="panel-divider" />

                  <div className="panel panel--right">
                    <div className="panel__header">
                      <h2>Your Profile</h2>
                    </div>

                    <div className="upload-section">
                      <label className="section-label">
                        Upload Resume{" "}
                        <span className="badge badge--best">Best Results</span>
                      </label>
                      <label
                        className={`dropzone ${isDragActive ? "dropzone--active" : ""} ${selectedFile ? "dropzone--has-file" : ""}`}
                        htmlFor="resume"
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          ref={resumeInputRef}
                          hidden
                          type="file"
                          id="resume"
                          accept=".pdf,.docx"
                          onChange={handleFileChange}
                        />
                        <span className="dropzone__icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="16 16 12 12 8 16" />
                            <line x1="12" y1="12" x2="12" y2="21" />
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                          </svg>
                        </span>
                        <p className="dropzone__title">
                          {selectedFile
                            ? selectedFile.name
                            : "Click to upload or drag & drop"}
                        </p>
                        <p className="dropzone__subtitle">
                          PDF or DOCX (Max 5MB)
                        </p>
                      </label>
                    </div>

                    <div className="or-divider">
                      <span>OR</span>
                    </div>

                    <div className="self-description">
                      <label
                        className="section-label"
                        htmlFor="selfDescription"
                      >
                        Quick Self-Description
                      </label>
                      <textarea
                        value={selfDescription}
                        onChange={(e) => setSelfDescription(e.target.value)}
                        id="selfDescription"
                        className="panel__textarea panel__textarea--short"
                        placeholder="Briefly describe your tech stack, projects, and experience..."
                      />
                    </div>
                  </div>
                </div>

                <div className="interview-card__footer">
                  <button 
                    className="generate-btn"
                    onClick={handleGenerateReport}
                    disabled={loading}
                  >
                    <svg
                      className="ai-star-icon"
                      viewBox="0 0 32 32"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16 6H9C6.23858 6 4 8.23858 4 11V22C4 24.7614 6.23858 27 9 27H20C22.7614 27 25 24.7614 25 22V15"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M8.5 21L11.5 13L14.5 21"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9.5 18.5H13.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M18.5 13V21"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M23 11C23 7.5 24.5 6 28 6C24.5 6 23 4.5 23 1C23 4.5 21.5 6 18 6C21.5 6 23 7.5 23 11Z"
                        fill="currentColor"
                      />
                      <path
                        d="M28.5 16C28.5 14 29.5 13 31.5 13C29.5 13 28.5 12 28.5 10C28.5 12 27.5 13 25.5 13C27.5 13 28.5 14 28.5 16Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>Generate My Interview Strategy</span>
                  </button>
                </div>
              </div>

              {reports?.length > 0 && (
                <section className="recent-reports">
                  <h2>My Recent Interview Plans</h2>
                  <ul className="reports-list">
                    {reports.map((report) => (
                      <li
                        key={report._id}
                        className="report-item"
                        onClick={() => navigate(`/interview/${report._id}`)}
                      >
                        <h3>{report.title || "Untitled Position"}</h3>
                        <p className="report-meta">
                          Generated on{" "}
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        <span
                          className={`match-score ${report.matchScore >= 80 ? "score--high" : "score--mid"}`}
                        >
                          Match: {report.matchScore}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;