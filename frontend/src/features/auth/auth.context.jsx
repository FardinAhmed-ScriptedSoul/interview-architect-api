import React, { createContext, useState, useEffect } from 'react';
import { getMe } from "./services/auth.api"; 

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUserSession = async () => {
            try {
                const response = await getMe();
                if (response?.data?.user) {
                    setUser(response.data.user);
                }
            } catch (error) {
                console.warn("No active session verified on initialization.");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        verifyUserSession();
    }, []);

    // ✅ Make sure user, setUser, loading, and setLoading are ALL here!
    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    );
};