import apiClient from "../../../api/api.client";

/**
 * Global API error processing handler.
 * Strips away boilerplate nesting so your context providers or custom hooks 
 * always catch the precise, descriptive backend payload error messages.
 */
const handleApiError = (error, contextualMessage) => {
    const message = error.response?.data?.message || error.message || "Network execution breakdown.";
    console.error(`API Error Encountered [${contextualMessage}]:`, message);
    // Explicitly throw a clean Error wrapper upwards to the context hook consumer layer
    throw new Error(message);
};

export async function register({ username, email, password }) {
    try {
        const response = await apiClient.post('/api/auth/register', { username, email, password });
        return response.data;
    } catch (err) {
        handleApiError(err, "Registration Sequence");
    }
}

export async function login({ email, password }) {
    try {
        const response = await apiClient.post("/api/auth/login", { email, password });
        return response.data;
    } catch (err) {
        handleApiError(err, "Login Sequence");
    }
}

export async function logout() {
    try {
        const response = await apiClient.get("/api/auth/logout");
        return response.data;
    } catch (err) {
        handleApiError(err, "Session Termination");
    }
}

export async function getMe() {
    try {
        const response = await apiClient.get("/api/auth/get-me");
        return response.data;
    } catch (err) {
        handleApiError(err, "User Context Retrieval");
    }
}

export async function logoutAll() {
    try {
        const response = await apiClient.post("/api/auth/logout-all");
        return response.data;
    } catch (err) {
        handleApiError(err, "Global Device Logout Execution");
    }
}

export async function forgotPassword({ email }) {
    try {
        const response = await apiClient.post("/api/auth/forgot-password", { email });
        return response.data;
    } catch (err) {
        handleApiError(err, "Forgot Password Token Requests");
    }
}

export async function resetPassword({ token, password }) {
    try {
        const response = await apiClient.post(`/api/auth/reset-password/${token}`, { password });
        return response.data;
    } catch (err) {
        handleApiError(err, "Password Override Phase Execution");
    }
}