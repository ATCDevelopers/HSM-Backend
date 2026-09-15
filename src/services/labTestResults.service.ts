import { TestResultRepository } from "../repositories/LabTestResults.repository.js"; // Adjust path to repository
import { testResults } from "../drizzle/schema.js"; // Adjust path to schema

const repo = new TestResultRepository();

/**
 * Service function to submit a patient's filled lab test result metrics.
 */
async function createResult(
  userId: string,
  payload: Omit<typeof testResults.$inferInsert, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'createdBy' | 'updatedBy' | 'deletedAt' | 'deletedBy'>
) {
  return await repo.create(payload, userId);
}

/**
 * Service function to fetch a single test result record loaded with its master form layout structure.
 */
async function getResultById(id: string) {
  const result = await repo.findById(id);
  if (!result) {
    throw new Error('Requested laboratory evaluation report not found or has been archived');
  }
  return result;
}

/**
 * Service function to retrieve every active laboratory evaluation chart matching a patient's primary UUID.
 */
async function queryResultsByPatient(patientId: string) {
  return await repo.findByPatient(patientId);
}

/**
 * Service function to modify recorded evaluation metrics or add clinical notes within a report.
 */
async function modifyResult(
  id: string,
  userId: string,
  updates: Partial<Omit<typeof testResults.$inferInsert, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'isDeleted'>>
) {
  const result = await repo.update(id, updates, userId);
  if (!result) {
    throw new Error('Failed to update report. Record might be missing or already soft-deleted');
  }
  return result;
}

/**
 * Service function to securely execute a compliance soft-delete tracking the archiving user ID.
 */
async function archiveResult(id: string, userId: string) {
  const outcome = await repo.softDelete(id, userId);
  if (!outcome.success) {
    throw new Error('Unable to archive laboratory record. It may already be removed');
  }
  return outcome;
}

// Unified functional service export matching your structural pattern
export const testResultService = {
  createResult,
  getResultById,
  queryResultsByPatient,
  modifyResult,
  archiveResult
};
