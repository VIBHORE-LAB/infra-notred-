import axios from "axios";
import env from "../environment";

const instance = axios.create({
    baseURL: env.apiUrl,
    timeout: 5000,
});

// Interceptor to attach token
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default instance;
