import { useState } from "react";
import instance from "../api/api";
import { useAuth } from "../context/AuthContext";

export const useLogin = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { login: setAuthContext } = useAuth();
    
    const login = async (email: string, password: string):Promise<boolean> => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await instance.post("/user/login", {
                req: { signature: "login_user" },
                payload: { email, password }
            });

            // The backend returns a data object containing the token and user
            const data = response.data?.data;
            if (data && data.token) {
                setAuthContext(data.token);
                // Store companyCode for use in project/fund API calls
                if (data.user?.companyCode) {
                    localStorage.setItem("companyCode", data.user.companyCode);
                } else {
                    // Owner at registration won't have a company yet; clear it
                    localStorage.removeItem("companyCode");
                }
                return true;
            } else {
                setError("No token received from server");
                return false;
            }
        }
        catch (err: any) {
             const errMsg = err.response?.data?.error || "Login failed due to network or server error";
             setError(errMsg);
             return false;
        }
        finally {
            setLoading(false);
        }
    }

    return { loading, error, login };
}
