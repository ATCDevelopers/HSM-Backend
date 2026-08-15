import {createContext, useContext} from "react";

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phoneNumber?: string;
    roles?: string[];
    permissions?: string[];
}

export interface AuthContextValue {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (credentials: { email: string; password: string }) => Promise<User>;
    register: (data: {
        firstName: string;
        lastName: string;
        username: string;
        email: string;
        phoneNumber?: string;
        password: string;
        passwordConfirmation: string;
    }) => Promise<User>;
    logout: () => void;
    can: (permission: string) => boolean;
}

/**
 * AuthContext holds the authenticated user and the actions that mutate auth
 * state. It is created here (separate from the provider component) so the
 * provider file can export only components — keeping React Fast Refresh happy.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * useAuth — access the auth context.
 * Throws if used outside an <AuthProvider> so misuse fails loudly.
 */
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
