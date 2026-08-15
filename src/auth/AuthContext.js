import {createContext, useContext} from "react";

/**
 * AuthContext holds the authenticated user and the actions that mutate auth
 * state. It is created here (separate from the provider component) so the
 * provider file can export only components — keeping React Fast Refresh happy.
 */
export const AuthContext = createContext(null);

/**
 * useAuth — access the auth context.
 * Throws if used outside an <AuthProvider> so misuse fails loudly.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
