import { useState } from "react";
import instance from "../axios/axios";
import type { RegisterFormData, RegisterResponse } from "../types/auth";

export const useRegister = () =>{
    const [loading,setLoading] = useState<boolean>(false);
    const [error,setError]  = useState<string | null>(null);
    
    const register = async (data: RegisterFormData) : Promise<RegisterResponse | null> =>{
        setLoading(true);
        setError(null);
        
        try {
            const response = await instance.post("/user/register/owner", {
                req: {signature:"register_owner"},
                payload:data
            });
            return response.data?.data as RegisterResponse;
        }
        catch (error: unknown) {
            if (error && typeof error === "object" && "response" in error && error.response && typeof error.response === "object" && "data" in error.response && error.response.data && typeof error.response.data === "object" && "error" in error.response.data) {
                setError((error as { response: { data: { error: string } } }).response.data.error);
            } else {
                setError("Registration failed");
            }
            return null;
        }
        finally {
            setLoading(false);
        }
    }

    return { loading, error, register };
}