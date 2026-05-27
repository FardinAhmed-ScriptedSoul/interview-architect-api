import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export const useSandbox = (apiBaseUrl = '/api/sandbox') => {
    const [sandboxId, setSandboxId] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | initialized | active | completed | terminated
    const [questions, setQuestions] = useState(null);
    const [penalties, setPenalties] = useState(0);
    const [lifetimePenaltyCount, setLifetimePenaltyCount] = useState(0); 
    const [timeLeft, setTimeLeft] = useState(0); 
    const [evaluation, setEvaluation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Placeholder local states used by your injected security infraction hook
    const [localPenalties, setLocalPenalties] = useState(0);
    const [isFrozen, setIsFrozen] = useState(false);
    const [securityWarning, setSecurityWarning] = useState("");

    const timerRef = useRef(null);
    const stateRef = useRef({ status, sandboxId });
    
    // Safeguard locks to prevent concurrent tab-switching events from double-firing penalties
    const isProcessingPenalty = useRef(false);
    const isHandlingInfraction = useRef(false); // ✅ Single clear declaration at the top

    // Dummy navigate fallback to prevent compilation failure if missing
    const navigate = (path) => { window.location.href = path; };

    useEffect(() => {
        stateRef.current = { status, sandboxId };
    }, [status, sandboxId]);

    // New Sync Function: Re-aligns frontend with backend single source of truth
    const syncActiveSession = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${apiBaseUrl}/current`);
            const { data } = response;
            
            if (data.success && data.hasActiveSession && data.sandbox) {
                const session = data.sandbox;
                setSandboxId(session._id);
                setStatus(session.status);
                setQuestions(session.questions || null);
                setPenalties(session.sessionPenalties || 0);
                
                // Calculate time left if the session is actively running
                if (session.status === 'active' && session.startTime) {
                    const elapsedSeconds = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
                    const totalDurationSeconds = 20 * 60; // 20 minutes limit
                    const remaining = totalDurationSeconds - elapsedSeconds;
                    setTimeLeft(remaining > 0 ? remaining : 0);
                } else {
                    setTimeLeft(20 * 60); // Default to 20 minutes for initialized state
                }
            }
        } catch (err) {
            console.error("⚠️ Background session sync failed:", err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);

    // Automatically sync active state from the database on hook mount
    useEffect(() => {
        syncActiveSession();
    }, [syncActiveSession]);

    const initializeSandbox = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${apiBaseUrl}/initialize`);
            const { data } = response;
            if (data.success) {
                setSandboxId(data.sandboxId);
                setStatus(data.status); // Expecting 'initialized' from updated backend
                setTimeLeft(data.timeLimitMinutes * 60);
                setQuestions(data.questions || null); // Load initial schema data structural fields
                setPenalties(0);    // Clear old strike states
                return data;
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to initialize practice sandbox.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);

    const startSandbox = useCallback(async () => {
        const currentId = stateRef.current.sandboxId;
        if (!currentId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${apiBaseUrl}/start`, { sandboxId: currentId });
            const { data } = response;
            if (data.success) {
                setStatus(data.status);
                setQuestions(data.questions);
                return data;
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to start active sequence.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);

    // Unified and Fixed single recordPenalty instance matching requirements
    const recordPenalty = useCallback(async () => {
        const { status: currentStatus, sandboxId: currentId } = stateRef.current;
        if (currentStatus !== 'active' || !currentId || isProcessingPenalty.current) return null;
        
        isProcessingPenalty.current = true;
        
        try {
            const response = await axios.post(`${apiBaseUrl}/penalty`, { sandboxId: currentId });
            const { data } = response;
            
            if (data.terminated) {
                setStatus('terminated');
                setQuestions(null);
                if (timerRef.current) clearInterval(timerRef.current);
                // Update lifetime penalty count so profile card refreshes
                if (data.penaltyCount !== undefined) {
                    setLifetimePenaltyCount(data.penaltyCount);
                }
            } else {
                setPenalties(data.sessionPenalties);
            }
            return data;
        } catch (err) {
            console.error("Failed to sync penalty:", err);
            throw err;
        } finally {
            setTimeout(() => {
                isProcessingPenalty.current = false;
            }, 1000);
        }
    }, [apiBaseUrl]);

    const submitSandbox = useCallback(async (userAnswers) => {
        const currentId = stateRef.current.sandboxId;
        if (!currentId) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${apiBaseUrl}/submit`, {
                sandboxId: currentId,
                userAnswers
            });
            const { data } = response;
            if (data.success) {
                setStatus('completed');
                setEvaluation(data.evaluation);
                if (timerRef.current) clearInterval(timerRef.current);
                return data;
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error submitting runtime answers.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);

    const quitSandbox = useCallback(async () => {
        const currentId = stateRef.current.sandboxId;
        if (!currentId) return;
        
        setLoading(true);
        try {
            await axios.delete(`${apiBaseUrl}/quit`, { data: { sandboxId: currentId } });
            
            setSandboxId(null);
            setStatus('idle');
            setQuestions(null);
            setPenalties(0);
            setTimeLeft(0);
            setEvaluation(null);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to drop sandbox instance cleanly.");
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);

    // Timer clock stream controller
    useEffect(() => {
        if (status === 'active') {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setStatus('completed');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status]);

    // Infraction Tracking Event Pipeline
    useEffect(() => {
        if (status !== 'active') return;

        const handleSecurityInfraction = async () => {
            if (isHandlingInfraction.current) return;
            isHandlingInfraction.current = true;

            const nextStrikeCount = localPenalties + 1;
            setLocalPenalties(nextStrikeCount);
            setIsFrozen(true);

            if (nextStrikeCount === 1) {
                setSecurityWarning(
                    "⚠️ SECURITY WARNING: Window focus or tab switch detected. Your sandbox has been frozen. One more violation will terminate this session."
                );
                try {
                    await recordPenalty();
                } catch (err) {
                    console.error("Penalty sync failed:", err);
                }
            } else if (nextStrikeCount >= 2) {
                setSecurityWarning(
                    "❌ SECOND VIOLATION DETECTED: This session has been terminated. Your lifetime penalty count has been incremented."
                );
                try {
                    const data = await recordPenalty();
                    if (!data || !data.terminated) {
                        setStatus('terminated');
                    }
                } catch (err) {
                    setStatus('terminated');
                }

                setTimeout(() => {
                    navigate('/profile');
                }, 5000);
            }

            setTimeout(() => {
                isHandlingInfraction.current = false;
            }, 2000);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) handleSecurityInfraction();
        };

        const handleWindowBlur = () => {
            handleSecurityInfraction();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [status, localPenalties, recordPenalty, setStatus]);

    return {
        sandboxId,
        status,
        setStatus,
        questions,
        penalties,
        lifetimePenaltyCount, 
        timeLeft,
        evaluation,
        loading,
        error,
        isFrozen,            // Added to returned schema properties
        securityWarning,      // Added to returned schema properties
        localPenalties,       // Added to returned schema properties
        initializeSandbox,
        startSandbox,
        recordPenalty,
        submitSandbox,
        quitSandbox,
        syncActiveSession
    };
};