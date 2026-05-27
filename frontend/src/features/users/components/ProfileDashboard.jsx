import React, { useState, useRef } from "react";
import { useNavigate } from "react-router"; 
import { useUserProfile } from "../hooks/useUserProfile";
import { useAuth } from "../../auth/hooks/useAuth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../interview/style/home.scss";

export default function ProfileDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    profile,
    stats,
    loading,
    error,
    saveResumeSlot,
    deleteResumeSlot,
    updateResumeNickname,
  } = useUserProfile();

  const [resumeNickname, setResumeNickname] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editNickname, setEditNickname] = useState("");
  
  const [deletingId, setDeletingId] = useState(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false); 
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const resetUploadForm = () => {
    setResumeNickname("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormSubmission = async (e) => {
    e.preventDefault();
    if (!resumeNickname.trim() || !selectedFile) {
      toast.error("❌ Please provide a customizable nickname and attach a document payload.", {
        position: "top-right",
        autoClose: 4000,
        theme: "dark",
      });
      return;
    }

    try {
      const result = await saveResumeSlot(resumeNickname.trim(), selectedFile);
      
      if (result && result.status === 'success') {
        toast.success("✅ Resume slot updated successfully!", {
          position: "top-right",
          autoClose: 4000,
          theme: "dark",
        });
        resetUploadForm();
      }
    } catch (err) {
      toast.error(`❌ ${err || "Upload sequence failed."}`, {
        position: "top-right",
        autoClose: 5000,
        theme: "dark",
      });
      resetUploadForm(); 
    }
  };

  const handleUpdateNicknameSubmit = async (id) => {
    if (!editNickname.trim()) {
      toast.error("❌ Nickname field cannot be empty.", { 
        position: "top-right", 
        autoClose: 3000, 
        theme: "dark" 
      });
      return;
    }
    
    try {
      const res = await updateResumeNickname(id, editNickname.trim());
      if (res && res.status === 'success') {
        toast.success("📝 Nickname adjusted inside workspace storage.", { 
          position: "top-right", 
          autoClose: 3000, 
          theme: "dark" 
        });
        setEditingId(null);
        setEditNickname("");
      }
    } catch (err) {
      toast.error(`❌ ${err || "Failed to update descriptor."}`, { 
        position: "top-right", 
        autoClose: 4000, 
        theme: "dark" 
      });
    }
  };

  const handleRemoveResumeConfirm = async (id) => {
    try {
      setIsProcessingDelete(true);
      const res = await deleteResumeSlot(id);
      if (res && res.status === 'success') {
        toast.success("🗑️ Resume cleared from workspace profile storage.", {
          position: "top-right",
          autoClose: 4000,
          theme: "dark",
        });
        setDeletingId(null);
      }
    } catch (err) {
      toast.error(`❌ ${err || "Internal deletion operation error encountered."}`, {
        position: "top-right",
        autoClose: 4000,
        theme: "dark",
      });
    } finally {
      setIsProcessingDelete(false);
    }
  };

  const fallbackName = profile?.userName || user?.username || "Developer Workspace";
  const fallbackEmail = profile?.email || user?.email || "developer@internal.node";
  const fallbackInitials = fallbackName.substring(0, 2).toUpperCase();

  if (loading && !profile) {
    return (
      <div className="home-page">
        <ToastContainer 
          position="top-right"
          autoClose={4000}
          theme="dark"
          toastStyle={{ border: "1px solid #27272a", borderRadius: "6px" }} 
        />
        <div className="content-wrapper" style={{ textAlign: "center", paddingTop: "8rem" }}>
          <div
            style={{
              display: "inline-block",
              width: "40px",
              height: "2px",
              background: "#ff2d78",
              marginBottom: "1rem",
            }}
          />
          <p style={{ color: "#a1a1aa", fontSize: "0.9rem", letterSpacing: "0.1em" }}>
            SYNCHRONIZING PROFILE TELEMETRY...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* ─── INJECTED ANIMATION CSS FOR PALE GREEN GLOW ──────── */}
      <style>{`
        @keyframes paleGreenPulse {
          0% {
            box-shadow: 0 0 12px rgba(187, 247, 208, 0.4), inset 0 0 4px rgba(187, 247, 208, 0.2);
          }
          50% {
            box-shadow: 0 0 22px rgba(187, 247, 208, 0.7), inset 0 0 8px rgba(187, 247, 208, 0.3);
          }
          100% {
            box-shadow: 0 0 12px rgba(187, 247, 208, 0.4), inset 0 0 4px rgba(187, 247, 208, 0.2);
          }
        }
        .glowing-home-btn {
          animation: paleGreenPulse 2.5s infinite ease-in-out;
        }
      `}</style>

      <ToastContainer 
        position="top-right"
        autoClose={4000}
        theme="dark"
        toastStyle={{ border: "1px solid #27272a", borderRadius: "6px" }} 
      />

      <div className="content-wrapper">
        
        {/* ─── NEW PALE GREEN GLOWING BACK TO HOME BUTTON ───────── */}
        <div style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "flex-start" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            onMouseEnter={() => setIsBtnHovered(true)}
            onMouseLeave={() => setIsBtnHovered(false)}
            className="glowing-home-btn"
            style={{
              background: "#1e1e24",
              border: "1px solid #bbf7d0",
              color: "#bbf7d0",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textShadow: "0 0 6px rgba(187, 247, 208, 0.6)",
              transition: "transform 0.2s ease-in-out, background-color 0.2s ease-in-out",
              transform: isBtnHovered ? "scale(1.03)" : "scale(1)",
              backgroundColor: isBtnHovered ? "#24242b" : "#1e1e24"
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>←</span> Back to Home
          </button>
        </div>
        {/* ──────────────────────────────────────────────────────── */}

        <div className="page-header" style={{ marginBottom: "2rem" }}>
          <h1>
            Engine <span className="highlight">Workspace Telemetry</span>
          </h1>
          <p>
            Monitor continuous performance statistics, review neural framework
            gap blocks, and launch active debugging sandbox engines.
          </p>
        </div>

        <div className="profile-grid-layout">
          {/* Left Column */}
          <div className="flex-col-gap">
            <div className="premium-profile-card premium-profile-card--glowing">
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                <div
                  className="big-avatar"
                  style={{
                    background: "linear-gradient(135deg, #ff2d78, #ff6b9d)",
                    boxShadow: "0 0 15px rgba(255, 45, 120, 0.3)",
                  }}
                >
                  {fallbackInitials}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#ffffff", fontWeight: "700" }}>
                    {fallbackName}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#71717a" }}>
                    {fallbackEmail}
                  </p>
                </div>
              </div>
              <div
                style={{
                  marginTop: "1.25rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #1f1f23",
                  fontSize: "0.8rem",
                  color: "#a1a1aa",
                }}
              >
                Active Session Engine Node Verified (Role: {user?.role || "Software Engineer"})
              </div>
            </div>

            <div className="premium-profile-card">
              <h3 className="premium-card-title">Performance Metrics Track</h3>

              <div className="telemetry-metric-container">
                <div className="metric-info-row">
                  <span className="metric-title">Total Execution Reports</span>
                  <span className="metric-counter">
                    {stats?.totalReports ?? 0} runs
                  </span>
                </div>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar-fill metric-bar-fill--primary"
                    style={{ width: `${Math.min((stats?.totalReports ?? 0) * 10, 100)}%` }}
                  />
                </div>
              </div>

              <div className="telemetry-metric-container">
                <div className="metric-info-row">
                  <span className="metric-title">Avg Interview Match Score</span>
                  <span className="metric-counter highlight" style={{ color: "#ff2d78" }}>
                    {stats?.averageMatchScore ?? 0}%
                  </span>
                </div>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar-fill metric-bar-fill--accent"
                    style={{ width: `${stats?.averageMatchScore ?? 0}%` }}
                  />
                </div>
              </div>
              
              <div className="telemetry-metric-container" style={{ marginTop: "1rem" }}>
                <div className="metric-info-row">
                  <span className="metric-title" style={{ color: profile?.serverTotalPenalties > 0 ? "#ef4444" : "#a1a1aa" }}>
                    {profile?.serverTotalPenalties > 0 ? "⚠️ Server Total Penalties" : "Server Total Penalties"}
                  </span>
                  <span className="metric-counter" style={{ color: profile?.serverTotalPenalties > 0 ? "#ef4444" : "#ffffff" }}>
                    {profile?.serverTotalPenalties ?? 0} / 5
                  </span>
                </div>
                <div className="metric-bar-track" style={{ background: "#1f1f23" }}>
                  <div
                    className="metric-bar-fill"
                    style={{ 
                      width: `${Math.min(((profile?.serverTotalPenalties ?? 0) / 5) * 100, 100)}%`,
                      background: "#dc2626",
                      boxShadow: profile?.serverTotalPenalties > 0 ? "0 0 10px rgba(220, 38, 38, 0.5)" : "none"
                    }}
                  />
                </div>
              </div>

              <div className="telemetry-metric-container">
                <div className="metric-info-row">
                  <span className="metric-title">Cloud Storage Load Slots</span>
                  <span className="metric-counter">
                    {profile?.resumes?.length ?? 0} / 3
                  </span>
                </div>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar-fill metric-bar-fill--success"
                    style={{ width: `${((profile?.resumes?.length ?? 0) / 3) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            <div className="premium-profile-card">
              <div className="balanced-cyber-header">
                <h3 className="center-glowing-title" style={{ margin: 0 }}>
                  Technical Skill Gaps
                </h3>
                <span
                  className="badge badge--best badge-right-align"
                  style={{
                    background: "rgba(255,45,120,0.1)",
                    color: "#ff2d78",
                    border: "1px solid rgba(255,45,120,0.2)",
                    padding: "4px 8px",
                    fontSize: "0.75rem",
                  }}
                >
                  AI COMPILED
                </span>
              </div>

              <p style={{ color: "#71717a", fontSize: "0.85rem", textAlign: "center", margin: "-0.5rem 0 1.5rem 0" }}>
                The neural pipeline extracted these priority learning blocks across your running strategy logs.
              </p>

              <div className="skill-gaps-block-grid">
                {stats?.frequentSkillGaps && stats.frequentSkillGaps.length > 0 ? (
                  stats.frequentSkillGaps.map((gap, i) => {
                    const severityClass = gap.severity?.toLowerCase() === "high" ? "high" : gap.severity?.toLowerCase() === "low" ? "low" : "medium";
                    return (
                      <div key={gap.skill || i} className={`glowing-gap-block glowing-gap-block--${severityClass}`}>
                        <div className="gap-title-text" style={{ fontSize: "0.95rem", marginBottom: "4px" }}>
                          {gap.skill}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#71717a" }}>
                          Flagged across {gap.count} run scenarios
                        </div>
                        <div
                          style={{ marginTop: "10px", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}
                          className="highlight"
                        >
                          {gap.severity || "Medium"} Priority Node
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: "#71717a", fontSize: "0.85rem", textAlign: "center", width: "100%" }}>
                    No critical technical skill gaps compiled yet.
                  </p>
                )}
              </div>
            </div>

            {/* Practice Sandbox Navigation Card */}
            <div className="premium-profile-card premium-profile-card--glowing">
              <div style={{ borderBottom: "1px solid #1f1f23", paddingBottom: "1rem", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600", color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ color: "#ff2d78" }}>⚡</span> Practice Sandbox Engine
                </h3>
              </div>

              <div className="sandbox-engine-list">
                {profile?.sandboxSessions && profile.sandboxSessions.length > 0 ? (
                  profile.sandboxSessions.map((session) => (
                    <div key={session._id || session.id} className="sandbox-row-item">
                      <div className="sandbox-meta-left">
                        <h4>Session Assignment Node</h4>
                        <div className="sandbox-tags">
                          <span style={{ color: "#ff2d78" }}>Status: {session.status}</span>
                          <span>•</span>
                          <span style={{ color: "#f59e0b" }}>
                            Penalties Accumulation: {session.penalties}
                          </span>
                        </div>
                      </div>
                      <button
                        className="sandbox-action-btn"
                        type="button"
                        onClick={() => navigate(`/sandbox/${session._id || session.id}`)}
                      >
                        Enter Active Sequence
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <p style={{ color: "#71717a", fontSize: "0.85rem", margin: 0 }}>
                      Ready to launch a new coding evaluations window environment.
                    </p>
                    <button
                      className="sandbox-action-btn"
                      type="button"
                      onClick={() => navigate("/sandbox/new")}
                    >
                      Initialize Test
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cloud Resume Target Storage Management */}
            <div className="premium-profile-card">
              <h3 className="premium-card-title" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: "1rem" }}>
                Cloud Resume Target Storage
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {profile?.resumes && profile.resumes.length > 0 ? (
                  profile.resumes.map((res) => {
                    const currentId = res._id || res.id;
                    const isDeletingThis = deletingId === currentId;

                    return (
                      <div
                        key={currentId}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: "#121216",
                          padding: "1rem",
                          borderRadius: "6px",
                          border: isDeletingThis ? "1px solid #ef4444" : "1px solid #1f1f23",
                          gap: "0.5rem",
                          transition: "border-color 0.2s ease-in-out"
                        }}
                      >
                        {!isDeletingThis ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                              <span style={{ fontSize: "1.2rem" }}>📄</span>
                              {editingId === currentId ? (
                                <input
                                  type="text"
                                  value={editNickname}
                                  onChange={(e) => setEditNickname(e.target.value)}
                                  style={{
                                    background: "#09090b",
                                    border: "1px solid #ff2d78",
                                    color: "#ffffff",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    fontSize: "0.9rem",
                                    width: "70%"
                                  }}
                                />
                              ) : (
                                <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#f4f4f5" }}>
                                  {res.name}
                                </h4>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                              {editingId === currentId ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateNicknameSubmit(currentId)}
                                    style={{ background: "transparent", border: "none", color: "#22c55e", cursor: "pointer", fontSize: "0.85rem" }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditNickname("");
                                    }}
                                    style={{ background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: "0.85rem" }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(currentId);
                                      setEditNickname(res.name || "");
                                    }}
                                    style={{ background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "0.85rem" }}
                                  >
                                    Rename
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(currentId)}
                                    style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1rem" }}
                                  >
                                    🗑️
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ color: "#ef4444", fontWeight: "bold" }}>⚠️</span>
                              <p style={{ margin: 0, fontSize: "0.8rem", color: "#e4e4e7" }}>
                                Drop asset <span style={{ color: "#ef4444", fontWeight: "500" }}>"{res.name}"</span> permanently?
                              </p>
                            </div>
                            
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                type="button"
                                disabled={isProcessingDelete}
                                onClick={() => setDeletingId(null)}
                                style={{ background: "#27272a", border: "none", color: "#ffffff", padding: "4px 10px", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer" }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isProcessingDelete}
                                onClick={() => handleRemoveResumeConfirm(currentId)}
                                style={{ background: "#dc2626", border: "none", color: "#ffffff", padding: "4px 10px", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer", opacity: isProcessingDelete ? 0.6 : 1 }}
                              >
                                {isProcessingDelete ? "Purging..." : "Confirm"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: "#71717a", fontSize: "0.85rem", padding: "0.5rem 0" }}>
                    No cloud resume documents connected. Upload a blueprint below.
                  </p>
                )}
              </div>

              <form
                onSubmit={handleFormSubmission}
                style={{
                  background: "#121216",
                  padding: "1.25rem",
                  borderRadius: "8px",
                  border: "1px solid #1f1f23",
                }}
              >
                <input
                  type="text"
                  placeholder="Enter custom payload nickname"
                  className="panel__textarea panel__textarea--short"
                  style={{
                    height: "40px",
                    padding: "0 12px",
                    background: "#09090b",
                    border: "1px solid #1f1f23",
                    color: "#ffffff",
                    width: "100%",
                    borderRadius: "4px",
                    marginBottom: "0.75rem",
                  }}
                  value={resumeNickname}
                  onChange={(e) => setResumeNickname(e.target.value)}
                />
                <input
                  type="file"
                  accept=".pdf"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <div
                  onClick={() => !loading && fileInputRef.current?.click()}
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    border: "1px dashed #27272a",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background: "#09090b",
                    marginBottom: "1rem",
                    fontSize: "0.85rem",
                    color: "#a1a1aa",
                  }}
                >
                  {selectedFile
                    ? `🎯 Payload Linked: ${selectedFile.name}`
                    : "Click to attach updated Resume (PDF Only)"}
                </div>
                <button
                  type="submit"
                  className="generate-btn"
                  style={{ width: "100%", height: "42px" }}
                  disabled={loading || !selectedFile || !resumeNickname.trim()}
                >
                  <span>
                    {loading ? "Processing Action..." : "Push Payload to Cloud Asset Slot"}
                  </span>
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}