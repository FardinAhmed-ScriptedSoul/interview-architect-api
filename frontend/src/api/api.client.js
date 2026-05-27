import axios from "axios";

// Fall back to environment variable or default port mapping cleanly
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// ── GLOBAL INTERCEPTOR CORE ──────────────────────────────────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const errorMessage = error.response?.data?.message || "An unexpected server network error occurred.";
        console.error("🌐 Core API Interceptor Catch:", errorMessage);
        
        // Handle global validation credential drops
        if (error.response?.status === 401) {
            console.warn("Session expired or token invalid. Redirecting to login context...");
            // Optional application redirection: 
            // window.location.href = "/login";
        }
        
        return Promise.reject(error);
    }
);

export default apiClient;