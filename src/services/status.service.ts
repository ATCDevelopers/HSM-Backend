import { statusRepository } from "../repositories/status.repository.js";

/**
 * Lookup values the medicine, prescription and invoice modules need before any record can be created
 * (their status_id columns are NOT NULL). The name column is unique across all groups.
 */
export const DEFAULT_STATUSES: { name: string; groupType: string }[] = [
  { name: "in_stock", groupType: "medicine" },
  { name: "low_stock", groupType: "medicine" },
  { name: "out_of_stock", groupType: "medicine" },
  { name: "discontinued", groupType: "medicine" },

  { name: "pending", groupType: "prescription" },
  { name: "dispensed", groupType: "prescription" },
  { name: "cancelled", groupType: "prescription" },

  { name: "unpaid", groupType: "invoice" },
  { name: "partially_paid", groupType: "invoice" },
  { name: "paid", groupType: "invoice" },
  { name: "void", groupType: "invoice" },
];

export const statusService = {
  async getStatuses(groupType?: string) {
    return statusRepository.findAll(groupType?.trim() || undefined);
  },

  async seedDefaultStatuses() {
    return statusRepository.ensure(DEFAULT_STATUSES);
  }
};
