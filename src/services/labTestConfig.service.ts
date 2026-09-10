import { LabTestRepository } from "../repositories/labTestConfig.repository.js"; // Adjust the path as per your directory structure
import { labTests } from "../drizzle/schema.js"; // Adjust the path as per your directory structure

const repo = new LabTestRepository();

/**
 * Service function to build and create a new custom lab test configuration.
 */
async function createTemplate(
  userId: string, 
  payload: Omit<typeof labTests.$inferInsert, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'createdBy' | 'updatedBy' | 'deletedAt' | 'deletedBy'>
) {
  return await repo.create(payload, userId);
}

/**
 * Service function to retrieve a single active lab test configuration template.
 */
async function getTemplateById(id: string) {
  const test = await repo.findById(id);
  if (!test) {
    throw new Error('Requested laboratory template not found or has been soft-deleted');
  }
  return test;
}

/**
 * Service function to list and query test layouts using optional search strings and categories.
 */
async function queryTemplates(searchTerms?: string, category?: string) {
  return await repo.searchTests(searchTerms, category);
}

/**
 * Service function to modify structural parameters within an active test blueprint template.
 */
async function modifyTemplate(
  id: string, 
  userId: string, 
  updates: Partial<Omit<typeof labTests.$inferInsert, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'isDeleted'>>
) {
  const result = await repo.update(id, updates, userId);
  if (!result) {
    throw new Error('Failed to update template. Template could be inactive or missing');
  }
  return result;
}

/**
 * Service function to securely execute a compliance soft-delete on a targeted layout template.
 */
async function archiveTemplate(id: string, userId: string) {
  const outcome = await repo.softDelete(id, userId);
  if (!outcome.success) {
    throw new Error('Unable to archive template. The record may already be soft-deleted');
  }
  return outcome;
}

// Unified functional service export matching your structural pattern
export const labTestService = {
  createTemplate,
  getTemplateById,
  queryTemplates,
  modifyTemplate,
  archiveTemplate,
};
