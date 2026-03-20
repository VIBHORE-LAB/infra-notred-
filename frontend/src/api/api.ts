import axios from 'axios';
import env from '../environment';

export const TOKEN_KEY = 'token';
export const COMPANY_CODE_KEY = 'companyCode';
export const PUBLIC_USER_ID_KEY = 'publicUserId';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getCompanyCode = () => localStorage.getItem(COMPANY_CODE_KEY) ?? '';

export const getPrivateHeaders = () => ({
  Authorization: `Bearer ${getToken() ?? ''}`,
  'x-company-code': getCompanyCode(),
});

export const getPublicUserId = () => {
  let userId = localStorage.getItem(PUBLIC_USER_ID_KEY);
  if (!userId) {
    userId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `public-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(PUBLIC_USER_ID_KEY, userId);
  }
  return userId;
};

export const getPublicHeaders = () => ({
  'x-public-user-id': getPublicUserId(),
});

export const getApiErrorMessage = (error: any, fallback: string) => {
  if (error?.response?.data?.error) return error.response.data.error as string;
  if (error?.response?.data?.message) return error.response.data.message as string;
  if (error?.response?.status) return `${fallback} (HTTP ${error.response.status})`;
  if (error?.message) return `${fallback}: ${error.message}`;
  return fallback;
};

const instance = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
});

export const publicInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
});

instance.interceptors.request.use(
  (config) => {
    const token = getToken();
    const companyCode = getCompanyCode();

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (companyCode && !config.headers['x-company-code']) {
      config.headers['x-company-code'] = companyCode;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
