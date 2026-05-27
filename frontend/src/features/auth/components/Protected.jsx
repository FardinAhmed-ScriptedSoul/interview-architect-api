import { useAuth } from "../hooks/useAuth.js";
import { Navigate } from "react-router";
import React from 'react';

const Protected = ({ children }) => {
    const { loading, user } = useAuth();

    // The root App.jsx container handles the primary loading view shell,
    // so this nested gate can safely stay completely silent.
    if (loading) {
        return null;
    }

   
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

export default Protected;