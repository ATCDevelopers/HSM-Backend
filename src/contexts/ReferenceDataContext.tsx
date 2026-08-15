import {createContext, useContext, useEffect, useState} from "react";
import api from "../services/api";
import {useAuth} from "../auth/AuthContext";

interface ReferenceData {
    [key: string]: unknown[];
}

interface ReferenceDataContextValue {
    [key: string]: unknown[];
    loading: boolean;
    error: string | null;
}

/**
 * ReferenceDataProvider — loads lookup tables (statuses, types, periods,
 * methods, etc.) in a single `/reference-data` request, once, after the user is
 * authenticated. This is useful for applications that have many reference/lookup
 * tables that need to be loaded globally.
 *
 * Features:
 * - Single API call loads all lookup data
 * - Data is cached in localStorage for instant reloads
 * - Per-lookup hooks can read their slice from this context
 * - Automatically refreshes when user authenticates
 *
 * Note: This provider is optional. If your application doesn't need global
 * reference data, you can remove it from App.tsx.
 */
const CACHE_KEY = "reference_data_cache";
const ReferenceDataContext = createContext<ReferenceDataContextValue | null>(null);

const readCache = (): ReferenceData => {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    } catch {
        return {};
    }
};

interface ReferenceDataProviderProps {
    children: React.ReactNode;
}

export const ReferenceDataProvider = ({children}: ReferenceDataProviderProps) => {
    const {isAuthenticated} = useAuth();
    const [data, setData] = useState<ReferenceData>(readCache);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        let active = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await api.get("reference-data");
                if (!active) return;
                const payload = res.data || {};
                setData(payload as ReferenceData);
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
                } catch {
                    /* ignore storage quota errors */
                }
            } catch (err) {
                if (active) setError(err instanceof Error ? err.message : "Failed to load reference data");
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchData();

        return () => {
            active = false;
        };
    }, [isAuthenticated]);

    // Every reference-data slice is a lookup array. Coerce defensively so a stale
    // or malformed cache entry (e.g. an object left by an older payload shape)
    // can't crash consumers that call `.find()` on the slice — a plain `= []`
    // destructuring default only guards `undefined`, not a non-array value.
    const lookups = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value : []]),
    ) as ReferenceData;

    const contextValue: ReferenceDataContextValue = {
        ...lookups,
        loading,
        error,
    };

    return (
        <ReferenceDataContext.Provider value={contextValue}>
            {children}
        </ReferenceDataContext.Provider>
    );
}

function useReferenceData(): ReferenceDataContextValue {
    const context = useContext(ReferenceDataContext);
    if (!context) {
        throw new Error("useReferenceData must be used within a ReferenceDataProvider");
    }
    return context;
}

export {useReferenceData};
