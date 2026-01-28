import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on mount
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (userInfo) {
            setUser(userInfo);
        }
        setLoading(false);
    }, []);





    // Register user
    const register = async (name, email, password) => {
        try {
            setError(null);
            const config = {
                headers: {
                    "Content-Type": "application/json",
                },
            };

            const { data } = await axios.post(
                "http://localhost:5000/api/auth/register",
                { name, email, password },
                config
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
            const config = {
                headers: {
                    "Content-Type": "application/json",
                },
            };

            const { data } = await axios.post(
                "http://localhost:5000/api/auth/login",
                { email, password },
                config
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
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.put(
                "http://localhost:5000/api/auth/preferences",
                newPreferences,
                config
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
