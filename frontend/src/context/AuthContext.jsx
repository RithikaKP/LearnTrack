import { createContext, useState } from "react";
import api from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("userInfo");
        if (!storedUser) return null;

        try {
            const userInfo = JSON.parse(storedUser);
            if (!userInfo?.token) {
                localStorage.removeItem("userInfo");
                return null;
            }

            const payload = JSON.parse(atob(userInfo.token.split('.')[1]));
            const isExpired = payload.exp * 1000 < Date.now();

            if (isExpired) {
                localStorage.removeItem("userInfo");
                return null;
            }

            return userInfo;
        } catch {
            localStorage.removeItem("userInfo");
            return null;
        }
    });
    const loading = false;
    const [error, setError] = useState(null);





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

    const logout = () => {
        localStorage.removeItem("userInfo");
        setUser(null);
    };

    const updatePreferences = async (newPreferences) => {
        try {
            const { data } = await api.put(
                "/auth/preferences",
                newPreferences
            );

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
