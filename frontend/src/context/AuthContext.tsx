import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import instance, { COMPANY_CODE_KEY, TOKEN_KEY, getApiErrorMessage } from '../api/api';

const AUTH_USER_CACHE_KEY = 'authUserCache';

type DecodedToken = {
  id?: string;
  user_id?: string;
  role?: string;
  email?: string;
  companyCode?: string | null;
};

export interface AuthUser {
  id: string;
  role: string;
  email?: string;
  companyCode?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  loadingUser: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readCachedUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Partial<AuthUser>) : null;
  } catch {
    return null;
  }
};

const persistCachedUser = (user: Partial<AuthUser> | null) => {
  try {
    if (!user) {
      localStorage.removeItem(AUTH_USER_CACHE_KEY);
      return;
    }
    localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage failures
  }
};

const decodeTokenUser = (token: string): AuthUser => {
  const decoded = jwtDecode<DecodedToken>(token);
  const id = decoded.user_id ?? decoded.id ?? '';
  return {
    id,
    role: decoded.role ?? 'user',
    email: decoded.email,
    companyCode: decoded.companyCode ?? null,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((current) => {
      if (!current) return current;
      const nextUser = { ...current, ...updates };
      persistCachedUser(nextUser);
      if (nextUser.companyCode) {
        localStorage.setItem(COMPANY_CODE_KEY, nextUser.companyCode);
      }
      return nextUser;
    });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(COMPANY_CODE_KEY);
    persistCachedUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = token ?? localStorage.getItem(TOKEN_KEY);
    if (!activeToken) return null;

    try {
      const decodedUser = decodeTokenUser(activeToken);
      if (!decodedUser.id) return null;

      setLoadingUser(true);
      const response = await instance.get(`/user/${decodedUser.id}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const apiUser = response.data?.data?.user ?? {};
      const cached = readCachedUser();
      const mergedUser: AuthUser = {
        ...decodedUser,
        ...cached,
        ...apiUser,
        id: apiUser.id ?? decodedUser.id,
        role: apiUser.role ?? decodedUser.role,
        email: apiUser.email ?? decodedUser.email,
        companyCode: apiUser.companyCode ?? cached?.companyCode ?? decodedUser.companyCode ?? null,
      };
      setUser(mergedUser);
      persistCachedUser(mergedUser);
      if (mergedUser.companyCode) {
        localStorage.setItem(COMPANY_CODE_KEY, mergedUser.companyCode);
      }
      return mergedUser;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to refresh the user session');
      console.error(message);
      return null;
    } finally {
      setLoadingUser(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const decodedUser = decodeTokenUser(token);
      if (!decodedUser.id) {
        throw new Error('Token missing user identifier');
      }

      const cached = readCachedUser();
      const mergedUser = { ...decodedUser, ...cached, id: decodedUser.id };
      setUser(mergedUser);
      localStorage.setItem(TOKEN_KEY, token);

      if (decodedUser.companyCode) {
        localStorage.setItem(COMPANY_CODE_KEY, decodedUser.companyCode);
      } else {
        localStorage.removeItem(COMPANY_CODE_KEY);
      }

      persistCachedUser(mergedUser);
      void refreshUser();
    } catch (error) {
      console.error('Invalid token:', error);
      logout();
    }
  }, [logout, refreshUser, token]);

  const login = useCallback((newToken: string) => {
    setToken(newToken);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      user,
      loadingUser,
      login,
      logout,
      refreshUser,
      updateUser,
    }),
    [loadingUser, login, logout, refreshUser, token, updateUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
