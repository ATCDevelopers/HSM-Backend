import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import {toast} from "./toast";
import config from "../config/projectConfig";

/** HTTP methods that represent a state change worth confirming with a toast. */
const MUTATION_METHODS = ["post", "put", "patch", "delete"];

/**
 * Recursively converts object keys between cases.
 *
 * The Laravel API speaks snake_case; the frontend speaks camelCase. These
 * interceptors translate at the boundary so components only ever see camelCase.
 * Only plain objects/arrays are touched — FormData, Blobs, Dates, etc. pass through.
 */
const toCamel = (s: string): string => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const toSnake = (s: string): string => s.replace(/([A-Z])/g, "_$1").toLowerCase();

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    v !== null && typeof v === "object" && (v.constructor === Object || v.constructor === undefined);

const convertKeys = <T>(input: unknown, fn: (s: string) => string): T => {
    if (Array.isArray(input)) return input.map((item) => convertKeys(item, fn)) as T;
    if (isPlainObject(input)) {
        return Object.fromEntries(
            Object.entries(input).map(([key, value]) => [fn(key), convertKeys(value, fn)]),
        ) as T;
    }
    return input as T;
};

/**
 * Axios instance configured for API requests
 */
const api: AxiosInstance = axios.create({
    /**
     * Base URL for all API requests
     * @type {string}
     */
    baseURL: config.api.baseURL,

    /**
     * Default headers sent with every request
     */
    headers: {
        "Content-Type": "application/json",
    },
});

/** localStorage key under which the bearer token is persisted. */
export const TOKEN_KEY = config.api.tokenKey;

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

// Outgoing: attach the bearer token (if any) and convert camelCase -> snake_case.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (isPlainObject(config.data) || Array.isArray(config.data)) {
        config.data = convertKeys(config.data, toSnake);
    }
    return config;
});

// Incoming: snake_case response -> camelCase for the frontend.
// On 401 the token is stale/invalid, so drop it; the AuthProvider will
// observe the missing token and route the user back to login.
api.interceptors.response.use(
    (response: AxiosResponse) => {
        if (isPlainObject(response.data) || Array.isArray(response.data)) {
            response.data = convertKeys(response.data, toCamel);
        }
        // Auto-confirm successful mutations (create/update/delete/restore) with a
        // success toast, using the message the API returns. Read-only GETs and
        // responses without a message are ignored.
        const method = response.config?.method?.toLowerCase();
        if (method && MUTATION_METHODS.includes(method) && isPlainObject(response.data) && response.data.message) {
            toast.success(response.data.message as string);
        }
        return response;
    },
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            clearToken();
        }
        if (isPlainObject(error.response?.data) || Array.isArray(error.response?.data)) {
            error.response.data = convertKeys(error.response.data, toCamel);
        }
        return Promise.reject(error);
    },
);

export default api;
