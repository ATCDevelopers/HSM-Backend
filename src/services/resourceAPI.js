import api from "./api";

/**
 * Factory function to create a resource API object with standard CRUD operations
 *
 * This factory creates an API object for a given resource name with standard
 * CRUD operations that follow RESTful conventions. All responses are automatically
 * converted from snake_case to camelCase by the api interceptor.
 *
 * @param {string} resourceName - The base endpoint name (e.g., "users", "posts")
 * @returns {Object} API object with CRUD methods
 *
 * @example
 * // Create a user API
 * const userAPI = createResourceAPI("users");
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
const createResourceAPI = (resourceName) => ({
    getAll: (params = {}) => api.get(`${resourceName}`, {params}),
    getById: (id) => api.get(`${resourceName}/${id}`),
    create: (data) => api.post(`${resourceName}`, data),
    update: (id, data) => api.patch(`${resourceName}/${id}`, data),
    delete: (id) => api.delete(`${resourceName}/${id}`),
    restore: (id) => api.patch(`${resourceName}/${id}/restore`),
    forceDelete: (id) => api.delete(`${resourceName}/${id}/force`),
});

export default createResourceAPI;
