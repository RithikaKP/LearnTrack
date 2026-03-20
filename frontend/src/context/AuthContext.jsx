import { createContext, useState, useEffect } from "react";
import api from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on mount
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (userInfo && userInfo.token) {
            try {
                // Simple JWT decode to check expiration
                const payload = JSON.parse(atob(userInfo.token.split('.')[1]));
                const isExpired = payload.exp * 1000 < Date.now();

                if (isExpired) {
                    localStorage.removeItem("userInfo");
                    setUser(null);
                } else {
                    setUser(userInfo);
                }
            } catch (e) {
                localStorage.removeItem("userInfo");
                setUser(null);
            }
        }
        setLoading(false);
    }, []);





    // Register user
    const register = async (name, email, password) => {
        try {
            setError(null);
            const { data } = await api.post(
                "/auth/register",
                { name, email, password }
            );

            localStorage.setItem("userInfo", JSON.stringify(data));
            setUser(data);
            return data;
        } catch (err) {
            setError(
                err.response && err.response.data.message
                    ? err.response.data.message
                    : err.message
            );
            throw err;
        }
    };

    // Login user
    const login = async (email, password) => {
        try {
            setError(null);
            const { data } = await api.post(
                "/auth/login",
                { email, password }
            );

            localStorage.setItem("userInfo", JSON.stringify(data));
            setUser(data);
            return data;
        } catch (err) {
            setError(
                err.response && err.response.data.message
                    ? err.response.data.message
                    : err.message
            );
            throw err;
        }
    };

    // Logout user
    const logout = () => {
        localStorage.removeItem("userInfo");
        setUser(null);
    };

    // Update preferences
    const updatePreferences = async (newPreferences) => {
        try {
            const { data } = await api.put(
                "/auth/preferences",
                newPreferences
            );

            // Update local state and storage
            const updatedUser = { ...user, preferences: data };
            setUser(updatedUser);
            localStorage.setItem("userInfo", JSON.stringify(updatedUser));
            return data;

        } catch (err) {
            console.error("Error updating preferences:", err);
            throw err;
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                register,
                login,
                logout,
                updatePreferences,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
