import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useSandbox } from "../hooks/useSandbox";
import { useUserProfile } from '../../users/hooks/useUserProfile';

export default function SandboxSession() {
  const navigate = useNavigate();
  const { refreshProfile } = useUserProfile(); // ✅ Added profile hook instantiation
  
  const {
    status,
    setStatus,
    questions,
    penalties,
    timeLeft,
    evaluation,
    loading,
    error,
    initializeSandbox,
    startSandbox,
    recordPenalty,
    submitSandbox,
    quitSandbox,
  } = useSandbox();

  // Structural user answer states matching backend models
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [theoryAnswers, setTheoryAnswers] = useState({});
  const [snippetAnswers, setSnippetAnswers] = useState({});
  const [challengeCode, setChallengeCode] = useState("");

  // 🔒 LOCAL ANTI-CHEAT SECURITY ENGINE STATES
  const [localPenalties, setLocalPenalties] = useState(0);
  const [isFrozen, setIsFrozen] = useState(false);
  const [securityWarning, setSecurityWarning] = useState("");

  // Guard flag ref to catch concurrent event bubble loops from firing twice
  const isHandlingInfraction = useRef(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const structuralPayload = {
      mcqAnswers:
        questions?.mcqs?.map((q, idx) => ({
          question: q.question,
          selectedOption: mcqAnswers[idx] || "",
        })) || [],
      theoryAnswers:
        questions?.theory?.map((q, idx) => ({
          question: q.question,
          answerText: theoryAnswers[idx] || "",
        })) || [],
      codeSnippetAnswers:
        questions?.codeSnippets?.map((q, idx) => ({
          question: q.question,
          predictedOutput: snippetAnswers[idx] || "",
        })) || [],
      codingChallengeSolution: {
        title: questions?.codingChallenge?.title || "Challenge Solution",
        submittedCode: challengeCode,
      },
    };

    submitSandbox(structuralPayload);
  };

  // 🛡️ ACCELERATED FOCUS VIOLATION INTERCEPTOR
  useEffect(() => {
    if (status !== "active") return;

    const handleSecurityInfraction = async () => {
      // ✅ Guard block to prevent double-firing concurrent penalty triggers
      if (isHandlingInfraction.current) return;
      isHandlingInfraction.current = true;

      // Calculate next client-side strike threshold
      const nextStrikeCount = localPenalties + 1;
      setLocalPenalties(nextStrikeCount);
      setIsFrozen(true);

      if (nextStrikeCount === 1) {
        // Strike 1: Freeze Viewport, Open Security Warning Confirmation Gate
        setSecurityWarning(
          "⚠️ SECURITY WARNING: Window focus or tab switch detected. Your active sandbox engine has been frozen. Changing tabs or windows to check outside solutions is strictly forbidden. Acknowledge below to clear the screen lock.",
        );

        try {
          // Sync penalty counter to backend database tracking
          await recordPenalty();
        } catch (err) {
          console.error(
            "Telemetry failure syncing first strike infraction:",
            err,
          );
        }
        
        // Clear lock once pipeline finishes
        isHandlingInfraction.current = false;
      } else if (nextStrikeCount >= 2) {
        // Strike 2: Final Strike for this runtime sandbox. Kill immediately.
        setSecurityWarning(
          "❌ WORKSPACE RECOGNIZED REPEATED VIOLATIONS: This instance has been force-closed due to successive security policy failures. Tracking structures have locked your sandbox sequence.",
        );

        try {
          // This second call hits the endpoint, incrementing to server limit or causing backend termination flag
          const data = await recordPenalty();

          // Force complete hook status overwrite to hard lock screen layouts if backend didn't auto-flag 'terminated'
          if (!data || !data.terminated) {
            setStatus("terminated");
          }
          
          // ✅ FIX LOCATION: Refresh profile so lifetime penalty counters align on the layout deck
          await refreshProfile();
        } catch (err) {
          // Fallback to strict UI blocking if server triggers an immediate 403 / 400 ban validation response
          setStatus("terminated");
        }

        // Redirect out after viewing terminal message
        setTimeout(() => {
          isHandlingInfraction.current = false; // Reset lock prior to navigation unmount
          navigate("/profile");
        }, 5000);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleSecurityInfraction();
    };

    const handleWindowBlur = () => {
      handleSecurityInfraction();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [status, localPenalties, recordPenalty, setStatus, navigate, refreshProfile]);

  // Reset components client-side hooks tracking state when entering clean initial status frames
  useEffect(() => {
    if (status === "idle" || status === "initialized") {
      setLocalPenalties(0);
      setIsFrozen(false);
      setSecurityWarning("");
    }
  }, [status]);

  return (
    <div
      style={{
        padding: "2rem",
        color: "#f4f4f5",
        background: "#09090b",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      {/* 🔒 THE FREEZING ANTI-CHEAT UI SCREEN BARRIER */}
      {isFrozen && status === "active" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(9, 9, 11, 0.99)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "#f4f4f5",
            padding: "2rem",
            textAlign: "center",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              maxWidth: "550px",
              padding: "2.5rem",
              background: "#121214",
              borderRadius: "12px",
              border: `1px solid ${localPenalties >= 2 ? "#ef4444" : "#f59e0b"}`,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            }}
          >
            <h2
              style={{
                color: localPenalties >= 2 ? "#ef4444" : "#f59e0b",
                marginTop: 0,
                fontSize: "1.75rem",
                fontWeight: "700",
              }}
            >
              {localPenalties >= 2
                ? "Security Bridge Intercepted"
                : "Sandbox Execution Frozen"}
            </h2>
            <p
              style={{
                color: "#a1a1aa",
                fontSize: "0.95rem",
                lineHeight: "1.6",
                margin: "1.5rem 0 2.5rem 0",
              }}
            >
              {securityWarning}
            </p>

            {localPenalties === 1 && (
              <button
                onClick={() => setIsFrozen(false)}
                style={{
                  background: "#ff2d78",
                  color: "#fff",
                  border: "none",
                  padding: "0.8rem 2.2rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                }}
              >
                Clear Warning & Resume Test
              </button>
            )}
          </div>
        </div>
      )}

      {/* ENGINE MONITOR PANEL */}
      {status === "active" && (
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            fontSize: "0.9rem",
            fontFamily: "monospace",
          }}
        >
          <span
            style={{
              color: localPenalties >= 1 ? "#ef4444" : "#a1a1aa",
              fontWeight: "bold",
            }}
          >
            ⚠️ Session Strikes: {localPenalties} / 2
          </span>
          <span style={{ color: "#a1a1aa" }}>
            (Lifetime Penalties: {penalties} / 5)
          </span>
          <span style={{ color: "#60a5fa", fontWeight: "bold" }}>
            ⏱️ Clock: {formatTime(timeLeft)}
          </span>
        </div>
      )}
      
      {/* STATE 1: IDLE STATE */}
      {status === "idle" && (
        <div
          style={{
            padding: "2rem",
            background: "#121214",
            borderRadius: "8px",
            border: "1px solid #27272a",
            textAlign: "center",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Initialize Dynamic Sandbox Engine</h3>
          <p
            style={{
              color: "#a1a1aa",
              fontSize: "0.95rem",
              marginBottom: "1.5rem",
            }}
          >
            Queries the Gemini API engine to compile a personalized 10-problem
            assessment stack balanced explicitly around your technical gaps.
          </p>
          <button
            onClick={initializeSandbox}
            style={{
              background: "#ff2d78",
              color: "#fff",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Compile Technical Sandbox
          </button>
        </div>
      )}

      {/* STATE 2: INITIALIZED STATE (PRE-FLIGHT SECURITY GATE) */}
      {status === "initialized" && (
        <div
          style={{
            maxWidth: "650px",
            margin: "2rem auto",
            padding: "2rem",
            background: "#1c1917",
            borderRadius: "8px",
            border: "1px solid #f59e0b",
          }}
        >
          <h3
            style={{
              color: "#f59e0b",
              marginTop: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            ⚠️ Security Constraints & Policy Notice
          </h3>
          <p
            style={{ lineHeight: "1.6", color: "#d6d3d1", fontSize: "0.95rem" }}
          >
            You are about to launch an active sandbox execution environment
            runtime. To maintain structural assessment integrity, please observe
            the following anti-cheat constraints:
          </p>
          <ul
            style={{
              color: "#a8a29e",
              fontSize: "0.9rem",
              lineHeight: "1.8",
              marginBottom: "2rem",
            }}
          >
            <li>
              Do <strong style={{ color: "#fca5a5" }}>NOT</strong> change window
              tabs, applications, or toggle open secondary tools.
            </li>
            <li>
              Losing active window target focus will trigger an immediate
              workspace freeze.
            </li>
            <li>
              Executing a{" "}
              <strong style={{ color: "#fca5a5" }}>second tab violation</strong>{" "}
              inside the same workspace will instantly terminate the session and
              commit database penalties.
            </li>
          </ul>
          <div
            style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
          >
            <button
              onClick={() => navigate("/profile")}
              style={{
                background: "transparent",
                color: "#a8a29e",
                border: "1px solid #44403c",
                padding: "0.6rem 1.25rem",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Go Back Home
            </button>
            <button
              onClick={startSandbox}
              style={{
                background: "#10b981",
                color: "#fff",
                border: "none",
                padding: "0.6rem 1.5rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Start Live Run
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: ACTIVE TEST WORKSPACE */}
      {status === "active" && questions && (
        <form
          onSubmit={handleFormSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
        >
          {/* SECTION A: MCQS */}
          {questions.mcqs && questions.mcqs.length > 0 && (
            <div
              style={{
                padding: "1.5rem",
                background: "#121214",
                borderRadius: "8px",
                border: "1px solid #27272a",
              }}
            >
              <h3 style={{ color: "#ff2d78", marginTop: 0 }}>
                Section 1: Multiple Choice Logic Core
              </h3>
              {questions.mcqs.map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: "1.5rem",
                    borderBottom: "1px solid #1f1f23",
                    paddingBottom: "1rem",
                  }}
                >
                  <p style={{ fontSize: "0.95rem", fontWeight: "500" }}>
                    {idx + 1}. {q.question}
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    {q.options?.map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.75rem",
                          background: "#18181b",
                          borderRadius: "4px",
                          border: "1px solid #27272a",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name={`mcq-${idx}`}
                          value={opt}
                          checked={mcqAnswers[idx] === opt}
                          onChange={(e) =>
                            setMcqAnswers({
                              ...mcqAnswers,
                              [idx]: e.target.value,
                            })
                          }
                          required
                        />
                        <span style={{ fontSize: "0.9rem" }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION B: THEORY */}
          {questions.theory && questions.theory.length > 0 && (
            <div
              style={{
                padding: "1.5rem",
                background: "#121214",
                borderRadius: "8px",
                border: "1px solid #27272a",
              }}
            >
              <h3 style={{ color: "#ff2d78", marginTop: 0 }}>
                Section 2: Engineering Theory & Architecture Analysis
              </h3>
              {questions.theory.map((q, idx) => (
                <div key={idx} style={{ margin: "1.25rem" }}>
                  <p style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                    {idx + 1}. {q.question}
                  </p>
                  <textarea
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      minHeight: "80px",
                      background: "#18181b",
                      color: "#fff",
                      border: "1px solid #27272a",
                      borderRadius: "4px",
                      padding: "0.5rem",
                      outline: "none",
                    }}
                    value={theoryAnswers[idx] || ""}
                    onChange={(e) =>
                      setTheoryAnswers({
                        ...theoryAnswers,
                        [idx]: e.target.value,
                      })
                    }
                    placeholder="Type structural processing architecture explanation details..."
                    required
                  />
                </div>
              ))}
            </div>
          )}

          {/* SECTION C: CODE SNIPPETS */}
          {questions.codeSnippets && questions.codeSnippets.length > 0 && (
            <div
              style={{
                padding: "1.5rem",
                background: "#121214",
                borderRadius: "8px",
                border: "1px solid #27272a",
              }}
            >
              <h3 style={{ color: "#ff2d78", marginTop: 0 }}>
                Section 3: Runtime Code Compilation Predictors
              </h3>
              {questions.codeSnippets.map((q, idx) => (
                <div key={idx} style={{ marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                    {idx + 1}. {q.question}
                  </p>
                  <pre
                    style={{
                      padding: "1rem",
                      background: "#09090b",
                      borderRadius: "4px",
                      border: "1px solid #27272a",
                      color: "#a1a1aa",
                      fontFamily: "monospace",
                      overflowX: "auto",
                    }}
                  >
                    {q.code}
                  </pre>
                  <input
                    type="text"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "#18181b",
                      color: "#60a5fa",
                      border: "1px solid #27272a",
                      borderRadius: "4px",
                      padding: "0.6rem",
                      fontFamily: "monospace",
                    }}
                    value={snippetAnswers[idx] || ""}
                    onChange={(e) =>
                      setSnippetAnswers({
                        ...snippetAnswers,
                        [idx]: e.target.value,
                      })
                    }
                    placeholder="Predict direct compilation output code value..."
                    required
                  />
                </div>
              ))}
            </div>
          )}

          {/* SECTION D: CODING CHALLENGE */}
          {questions.codingChallenge && (
            <div
              style={{
                padding: "1.5rem",
                background: "#121214",
                borderRadius: "8px",
                border: "1px solid #27272a",
              }}
            >
              <h3 style={{ color: "#ff2d78", marginTop: 0 }}>
                Section 4: Algorithmic Engineering Core Challenge
              </h3>
              <h4 style={{ margin: "0 0 0.25rem 0", color: "#f4f4f5" }}>
                {questions.codingChallenge.title}
              </h4>
              <p
                style={{
                  color: "#a1a1aa",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                }}
              >
                {questions.codingChallenge.problemStatement}
              </p>
              {questions.codingChallenge.constraints && (
                <p style={{ fontSize: "0.85rem", color: "#f59e0b" }}>
                  <strong>Complexity Constraint target:</strong>{" "}
                  {questions.codingChallenge.constraints}
                </p>
              )}
              <textarea
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: "260px",
                  background: "#09090b",
                  color: "#58a6ff",
                  border: "1px solid #27272a",
                  padding: "0.75rem",
                  fontFamily: "monospace",
                  outline: "none",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
                placeholder="// Implement structural algorithmic loops with clean performance code lines..."
                value={challengeCode}
                onChange={(e) => setChallengeCode(e.target.value)}
                required
              />
            </div>
          )}

          {/* ACTION TRAILER ROW */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "flex-end",
              marginBottom: "3rem",
            }}
          >
            <button
              type="button"
              onClick={quitSandbox}
              style={{
                background: "#3f3f46",
                color: "#fff",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Quit and Terminate
            </button>
            <button
              type="submit"
              style={{
                background: "#10b981",
                color: "#fff",
                border: "none",
                padding: "0.75rem 2rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Commit Complete Sandbox Run
            </button>
          </div>
        </form>
      )}

      {/* STATE 4: COMPLETED SUMMARY VIEW */}
      {status === "completed" && evaluation && (
        <div
          style={{
            padding: "2rem",
            background: "#121214",
            borderRadius: "8px",
            border: "1px solid #10b981",
          }}
        >
          <h3 style={{ color: "#10b981", marginTop: 0 }}>
            ✓ Verification Evaluation Completed
          </h3>
          <div
            style={{
              display: "flex",
              gap: "2rem",
              margin: "1.5rem 0",
              background: "#18181b",
              padding: "1rem",
              borderRadius: "6px",
            }}
          >
            <div>
              <strong>Score:</strong> {evaluation.scoreObtained} /{" "}
              {evaluation.totalPoints}
            </div>
            <div>
              <strong>Rank Achieved:</strong>{" "}
              <span style={{ color: "#ff2d78", fontWeight: "bold" }}>
                {evaluation.rankTier}
              </span>
            </div>
          </div>
          <p style={{ fontSize: "0.95rem", color: "#a1a1aa", lineHeight: 1.5 }}>
            <strong>Remarks:</strong> {evaluation.remarks}
          </p>
          <button
            onClick={() => navigate("/profile")}
            style={{
              background: "#ff2d78",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.5rem",
              borderRadius: "6px",
              cursor: "pointer",
              marginTop: "1rem",
            }}
          >
            Return to Profile Fleet
          </button>
        </div>
      )}

      {/* STATE 5: ANTI-CHEAT FORCE TERMINATED BAN SCREEN (Unified Single Instance) */}
      {status === "terminated" && (
        <div
          style={{
            padding: "3rem 2rem",
            background: "#451a03",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#fca5a5", marginTop: 0 }}>
            ⛔ Core Session Locked & Blacklisted
          </h2>
          <p
            style={{
              maxWidth: "600px",
              margin: "1rem auto",
              color: "#fde047",
              fontSize: "0.95rem",
              lineHeight: 1.6,
            }}
          >
            This sandbox cluster execution runtime has been frozen due to safety
            rule policy breaches (5 cumulative server infractions tracked). Your
            profile window permission state is locked out for 24 hours.
          </p>
          <button
            onClick={() => navigate("/profile")}
            style={{
              background: "#f87171",
              color: "#111",
              border: "none",
              padding: "0.6rem 1.5rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              marginTop: "1rem",
            }}
          >
            Exit Security Environment
          </button>
        </div>
      )}
    </div>
  );
}