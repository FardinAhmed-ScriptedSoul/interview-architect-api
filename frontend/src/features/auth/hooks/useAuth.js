import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context.jsx";
import { login, register, logout, getMe, logoutAll } from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext);
    
    if (!context) {
        throw new Error("useAuth must be consumed cleanly inside an authorized <AuthProvider> component layout container wrapper.");
    }

    const { user, setUser, loading, setLoading } = context;

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const response = await login({ email, password });
            const userData = response?.user || response?.data?.user || response;
            if (userData) {
                setUser(userData);
                return userData;
            }
        } catch (err) {
            console.error("Login verification failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const response = await register({ username, email, password });
            const userData = response?.user || response?.data?.user || response;
            if (userData) {
                setUser(userData);
            }
            return response;
        } catch (err) {
            console.error("Registration failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
        } catch (err) {
            console.error("Local session cleanup encountered a minor fault:", err);
        } finally {
            setUser(null);
            setLoading(false);
        }
    };

    const handleLogoutAll = async () => {
        setLoading(true);
        try {
            await logoutAll();
        } catch (err) {
            console.error("Global session termination encountered a minor fault:", err);
        } finally {
            setUser(null);
            setLoading(false);
        }
    };

    // FIXED: Empty dependency array ensures this runs only ONCE on mount.
    // React guarantees setUser and setLoading references are stable, 
    // so we don't need them in the dependency array.
    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const response = await getMe();
                const userData = response?.user || response?.data || response;
                if (userData) {
                    setUser(userData);
                }
            } catch (err) { 
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        
        getAndSetUser();
    }, []); 

    return { 
        user, 
        loading, 
        handleRegister, 
        handleLogin, 
        handleLogout, 
        handleLogoutAll 
    };
};