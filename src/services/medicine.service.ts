import { medicineRepository } from "../repositories/medicine.repository.js";
import { MedicinesTable } from "../drizzle/schema.js";

export const medicineService = {
  /**
   * Registers a new medicine product after enforcing structural constraints.
   */
  async createMedicine(data: typeof MedicinesTable.$inferInsert) {
    // Rule 1: Ensure code (barcode/unique identifier) is not already taken
    const existingCode = await medicineRepository.findByCode(data.code);
    if (existingCode) {
      throw new Error(`A medicine with code '${data.code}' is already registered`);
    }

    // Rule 2: Guard against initial negative stock counts
    if (data.stock !== undefined && data.stock < 0) {
      throw new Error("Initial stock volume cannot be negative");
    }

    // Rule 3: Guard against negative values for pricing
    if (Number(data.price) < 0) {
      throw new Error("Medicine pricing cannot be a negative value");
    }

    return medicineRepository.create(data);
  },

  /**
   * Fetches a clean array of every registered medicine.
   */
  async getAllMedicines() {
    return medicineRepository.findAll();
  },

  /**
   * Retrieves a single medicine by its primary UUID or throws a structured exception.
   */
  async getMedicineById(id: string) {
    const medicine = await medicineRepository.findById(id);
    if (!medicine) {
      throw new Error(`Medicine item with ID '${id}' was not found`);
    }
    return medicine;
  },

  /**
   * Finds matching products across generic and brand names.
   */
  async searchMedicines(query: string) {
    if (!query || query.trim() === "") {
      return medicineRepository.findAll();
    }
    return medicineRepository.search(query.trim());
  },

  /**
   * Updates an existing inventory listing with safety constraint validations.
   */
  async updateMedicine(id: string, data: Partial<typeof MedicinesTable.$inferInsert>) {
    // Verify the resource exists before running validation mutations
    const existingItem = await this.getMedicineById(id);

    // Rule 4: Prevent code/barcode collisions if code is altering
    if (data.code && data.code !== existingItem.code) {
      const duplicateCode = await medicineRepository.findByCode(data.code);
      if (duplicateCode) {
        throw new Error(`Cannot update code; '${data.code}' is already in use by another item`);
      }
    }

    // Rule 5: Prevent stock volume from falling below empty line thresholds
    if (data.stock !== undefined && data.stock < 0) {
      throw new Error("Inventory target adjustments cannot result in negative stock");
    }

    // Rule 6: Validate updated pricing structures
    if (data.price !== undefined && Number(data.price) < 0) {
      throw new Error("Updated pricing structures cannot be a negative value");
    }

    const updated = await medicineRepository.update(id, data);
    if (!updated) {
      throw new Error("Failed to modify medicine inventory records");
    }
    return updated;
  },

  /**
   * Safely deletes a medicine item.
   */
  async deleteMedicine(id: string) {
    await this.getMedicineById(id);
    const deleted = await medicineRepository.delete(id);
    if (!deleted) {
      throw new Error("Failed to clear medicine record from the database");
    }
    return deleted;
  }
};
