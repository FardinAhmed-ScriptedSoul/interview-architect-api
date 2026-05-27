import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// 🛠️ FIX 1: Point to the accurate singular '/api/user' base URL mapping
export const useUserProfile = (apiBaseUrl = '/api/user') => {
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ totalReports: 0, averageMatchScore: 0, frequentSkillGaps: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Helper to grab your active authentication token from localStorage / state management
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token'); // Adjust this matching how you handle JWTs
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // 1. Fetch Profile and Aggregated Analytics Metrics
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 🛠️ FIX 2: Correct route suffix updated from '/dashboard' to '/profile' + include auth
            const response = await axios.get(`${apiBaseUrl}/profile`, {
                headers: getAuthHeaders()
            });
            const { data } = response.data;
            setProfile(data.profile);
            setStats(data.stats);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load dashboard metrics.");
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);

    // 2. Upload and Register a New Resume Slot
    const saveResumeSlot = async (resumeName, fileObject) => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('resumeName', resumeName.trim());
            // 🛠️ FIX 3: Field name key changed from 'resumeFile' to 'resume' to satisfy upload.single("resume")
            formData.append('resume', fileObject); 

            // 🛠️ FIX 4: Correct URL path mapped from '/resume/save' to exactly match backend path '/resume'
            const response = await axios.post(`${apiBaseUrl}/resume`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    ...getAuthHeaders() // Pass authentication context so req.user maps correctly
                }
            });
            
            if (response.data.status === 'success') {
                setProfile(prev => ({ ...prev, resumes: response.data.resumes, savedResumesCount: response.data.savedResumesCount }));
                return response.data;
            }
        } catch (err) {
            setError(err.response?.data?.message || "Could not complete text storage sequence.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // 3. Remove a Specific Resume Configuration
    const deleteResumeSlot = async (resumeId) => {
        setLoading(true);
        setError(null);
        try {
            // 🛠️ FIX 5: Dropped '/delete' segment to match backend: router.delete("/resume/:resumeId")
            const response = await axios.delete(`${apiBaseUrl}/resume/${resumeId}`, {
                headers: getAuthHeaders()
            });
            if (response.data.status === 'success') {
                setProfile(prev => ({
                    ...prev,
                    resumes: response.data.resumes,
                    savedResumesCount: response.data.resumes.length
                }));
                return response.data;
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to purge targeted resume slot.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // 4. Update the Nickname of a Saved Subdocument Slot
    const updateResumeNickname = async (resumeId, targetName) => {
        if (!targetName || !targetName.trim()) return;
        setLoading(true);
        setError(null);
        try {
            // 🛠️ FIX 6: Dropped '/update' structural segment to sync with router.patch("/resume/:resumeId")
            const response = await axios.patch(`${apiBaseUrl}/resume/${resumeId}`, {
                resumeName: targetName.trim()
            }, {
                headers: getAuthHeaders()
            });
            if (response.data.status === 'success') {
                setProfile(response.data.data.profile);
                return response.data;
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to modify structural resource label.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        profile,
        stats,
        loading,
        error,
        refreshDashboard: fetchDashboardData,
        saveResumeSlot,
        deleteResumeSlot,
        updateResumeNickname
    };
};