import api from "./api";
import type { AxiosResponse } from "axios";

interface RegisterData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phoneNumber?: string;
    password: string;
    passwordConfirmation: string;
}

interface LoginCredentials {
    email: string;
    password: string;
}

interface AuthResponse {
    token: string;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        username: string;
        email: string;
        phoneNumber?: string;
        roles?: string[];
        permissions?: string[];
    };
}

interface UserResponse {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phoneNumber?: string;
    roles?: string[];
    permissions?: string[];
}

/**
 * Authentication endpoints (Laravel Sanctum, bearer-token flow).
 *
 * Request payloads are camelCase; the api interceptor converts them to
 * snake_case for Laravel (e.g. firstName -> first_name, passwordConfirmation
 * -> password_confirmation) and converts responses back to camelCase.
 */
const authAPI = {
    register: (data: RegisterData): Promise<AxiosResponse<AuthResponse>> => api.post("register", data),
    login: (credentials: LoginCredentials): Promise<AxiosResponse<AuthResponse>> => api.post("login", credentials),
    logout: (): Promise<AxiosResponse<void>> => api.post("logout"),
    me: (): Promise<AxiosResponse<UserResponse>> => api.get("me"),
};

export default authAPI;
