import {useEffect, useState} from "react";
import authAPI from "../services/authAPI";
import {setToken, clearToken, getToken} from "../services/api";
import {extractRecord} from "../services/apiResponse";
import {AuthContext} from "./AuthContext";

/**
 * AuthProvider — single source of truth for authentication.
 *
 * Responsibilities:
 * - On first load, if a token is already in localStorage, hydrate the current
 *   user from `GET /me` (handles page refreshes / returning visitors).
 * - Expose `login`, `register`, and `logout` actions that keep the token and
 *   the in-memory `user` in sync.
 * - Expose `loading` so the router can avoid flashing the login page before we
 *   know whether the existing token is still valid.
 */
export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Rehydrate the session on mount when a token is present.
    useEffect(() => {
        const token = getToken();
        if (!token) {
            setLoading(false);
            return;
        }

        let active = true;
        const fetchUser = async () => {
            try {
                const res = await authAPI.me();
                if (active) setUser(extractRecord(res));
            } catch {
                // Token is invalid/expired — the api interceptor already cleared it.
                if (active) {
                    clearToken();
                    setUser(null);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchUser();

        return () => {
            active = false;
        };
    }, []);

    const login = async (credentials) => {
        const res = await authAPI.login(credentials);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
    };

    const register = async (payload) => {
        const res = await authAPI.register(payload);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data.user;
    };

    const logout = () => {
        clearToken();
        setUser(null);
        try {
            localStorage.removeItem("reference_data_cache");
        } catch { /* ignore */
        }
        // Fire-and-forget: revoke the server token in the background.
        // The local session is already cleared so the UI responds instantly.
        authAPI.logout().catch(() => {
        });
    };

    /**
     * Permission check mirroring the backend: superadmin passes everything,
     * otherwise the named "{resource}.{action}" permission must be present.
     * The backend remains the real enforcement; this only drives the UI.
     */
    const can = (permission) => {
        if (!user) return false;
        if (user.roles?.includes("superadmin")) return true;
        return user.permissions?.includes(permission) ?? false;
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        can,
    };

    return <AuthContext.Provider
        value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
