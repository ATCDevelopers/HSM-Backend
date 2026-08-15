import {createContext, useContext, useEffect, useState} from "react";
import api from "../services/api";
import {useAuth} from "../auth/AuthContext";

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
 * reference data, you can remove it from App.jsx.
 */
const CACHE_KEY = "reference_data_cache";
const ReferenceDataContext = createContext({});

const readCache = () => {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
    } catch {
        return {};
    }
};

export const ReferenceDataProvider = ({children}) => {
    const {isAuthenticated} = useAuth();
    const [data, setData] = useState(readCache);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        let active = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await api.get("reference-data");
                if (!active) return;
                const payload = res.data || {};
                setData(payload);
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
                } catch {
                    /* ignore storage quota errors */
                }
            } catch (err) {
                if (active) setError(err.message);
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
    );

    return (
        <ReferenceDataContext.Provider value={{...lookups, loading, error}}>
            {children}
        </ReferenceDataContext.Provider>
    );
}

function useReferenceData() {
    return useContext(ReferenceDataContext);
}

export {useReferenceData};
