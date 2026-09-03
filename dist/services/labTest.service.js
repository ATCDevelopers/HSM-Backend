import { labTestRepository } from "../repositories/labTest.repository.js";
export const labTestService = {
    /**
     * Registers a new lab test item after validating code integrity and financial constraints.
     */
    async createLabTest(data) {
        // Rule 1: Guard against code duplicates if a specific code tracking reference is provided
        if (data.code) {
            const existingCode = await labTestRepository.findByCode(data.code);
            if (existingCode) {
                throw new Error(`A laboratory test with code '${data.code}' is already registered`);
            }
        }
        // Rule 2: Guard against negative values for billing prices
        if (Number(data.price) < 0) {
            throw new Error("Laboratory test pricing values cannot be configured below zero");
        }
        return labTestRepository.create(data);
    },
    /**
     * Fetches an un-filtered flat array containing every registered lab test.
     */
    async getAllLabTests() {
        return labTestRepository.findAll();
    },
    /**
     * Retrieves a single lab test row by its unique UUID or throws a contextual 404 message.
     */
    async getLabTestById(id) {
        const test = await labTestRepository.findById(id);
        if (!test) {
            throw new Error(`Laboratory test listing with ID '${id}' was not found`);
        }
        return test;
    },
    /**
     * Modifies an existing lab test configuration with validation safety blocks.
     */
    async updateLabTest(id, data) {
        // Confirm the resource exists before running mutation pipeline logic
        const existingTest = await this.getLabTestById(id);
        // Rule 3: Prevent duplicate code overrides across separate listings
        if (data.code && data.code !== existingTest.code) {
            const duplicateCode = await labTestRepository.findByCode(data.code);
            if (duplicateCode) {
                throw new Error(`Cannot update code; '${data.code}' is already assigned to another test`);
            }
        }
        // Rule 4: Validate updated pricing targets
        if (data.price !== undefined && Number(data.price) < 0) {
            throw new Error("Updated laboratory test pricing parameters cannot be a negative value");
        }
        const updated = await labTestRepository.update(id, data);
        if (!updated) {
            throw new Error("Failed to modify target laboratory test record configuration parameters");
        }
        return updated;
    },
    /**
     * Safely removes a laboratory test item mapping definition record.
     */
    async deleteLabTest(id) {
        await this.getLabTestById(id);
        const deleted = await labTestRepository.delete(id);
        if (!deleted) {
            throw new Error("Failed to clear target laboratory test listing from the system database");
        }
        return deleted;
    }
};
