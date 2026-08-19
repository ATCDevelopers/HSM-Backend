import api from "./api";

export const patientAPI = {
    /**
     * Get all patients
     */
    getAll: () => api.get("/patients/listpatients"),
    
    /**
     * Get single patient by ID
     */
    getById: (id: string) => api.get(`/patients/patient/${id}`),
    
    /**
     * Create new patient
     */
    create: (data: any) => api.post("/patients/registerpatient", data),
    
    /**
     * Update existing patient
     */
    update: (id: string, data: any) => api.put(`/patients/updatepatient/${id}`, data),
    
    /**
     * Delete patient
     */
    delete: (id: string) => api.delete(`/patients/patient/${id}`),
};

export default patientAPI;
