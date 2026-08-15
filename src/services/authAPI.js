import api from "./api";

/**
 * Authentication endpoints (Laravel Sanctum, bearer-token flow).
 *
 * Request payloads are camelCase; the api interceptor converts them to
 * snake_case for Laravel (e.g. firstName -> first_name, passwordConfirmation
 * -> password_confirmation) and converts responses back to camelCase.
 */
const authAPI = {
    register: (data) => api.post("register", data),
    login: (credentials) => api.post("login", credentials),
    logout: () => api.post("logout"),
    me: () => api.get("me"),
};

export default authAPI;
