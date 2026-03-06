import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // Need to install jwt-decode

interface UserPayload {
    user_id: string;
    role: string;
    companyCode?: string;
}

interface AuthContextType {
    token: string | null;
    user: UserPayload | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [user, setUser] = useState<UserPayload | null>(null);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode<UserPayload>(token);
                setUser(decoded);
                localStorage.setItem("token", token);

                if (decoded.companyCode) {
                    localStorage.setItem("companyCode", decoded.companyCode);
                }
            } catch (err) {
                console.error("Invalid token:", err);
                logout();
            }
        } else {
            setUser(null);
            localStorage.removeItem("token");
        }
    }, [token]);

    const login = (newToken: string) => {
        setToken(newToken);
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
