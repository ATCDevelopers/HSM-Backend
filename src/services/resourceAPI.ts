import api from "./api";
import type { AxiosResponse } from "axios";

interface ResourceAPI<T = unknown> {
    getAll: (params?: Record<string, unknown>) => Promise<AxiosResponse<T[]>>;
    getById: (id: string | number) => Promise<AxiosResponse<T>>;
    create: (data: Partial<T>) => Promise<AxiosResponse<T>>;
    update: (id: string | number, data: Partial<T>) => Promise<AxiosResponse<T>>;
    delete: (id: string | number) => Promise<AxiosResponse<void>>;
    restore: (id: string | number) => Promise<AxiosResponse<T>>;
    forceDelete: (id: string | number) => Promise<AxiosResponse<void>>;
}

/**
 * Factory function to create a resource API object with standard CRUD operations
 *
 * This factory creates an API object for a given resource name with standard
 * CRUD operations that follow RESTful conventions. All responses are automatically
 * converted from snake_case to camelCase by the api interceptor.
 *
 * @param {string} resourceName - The base endpoint name (e.g., "users", "posts")
 * @returns {ResourceAPI<T>} API object with CRUD methods
 *
 * @example
 * // Create a user API
 * const userAPI = createResourceAPI<User>("users");
 *
 * // Use it in your components
 * const users = await userAPI.getAll({ page: 1, per_page: 10 });
 * const user = await userAPI.getById(1);
 * const newUser = await userAPI.create({ name: "John", email: "john@example.com" });
 * const updatedUser = await userAPI.update(1, { name: "John Doe" });
 * await userAPI.delete(1);
 * await userAPI.restore(1); // if soft deletes are enabled
 * await userAPI.forceDelete(1); // permanent delete
 */
const createResourceAPI = <T = unknown>(resourceName: string): ResourceAPI<T> => ({
    getAll: (params: Record<string, unknown> = {}) => api.get(`${resourceName}`, {params}),
    getById: (id: string | number) => api.get(`${resourceName}/${id}`),
    create: (data: Partial<T>) => api.post(`${resourceName}`, data),
    update: (id: string | number, data: Partial<T>) => api.patch(`${resourceName}/${id}`, data),
    delete: (id: string | number) => api.delete(`${resourceName}/${id}`),
    restore: (id: string | number) => api.patch(`${resourceName}/${id}/restore`),
    forceDelete: (id: string | number) => api.delete(`${resourceName}/${id}/force`),
});

export default createResourceAPI;
