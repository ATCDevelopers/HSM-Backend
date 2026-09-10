import { db } from '../config/db.js';
import { testResults } from '../drizzle/schema.js'; // Adjust path to your schema
import { eq, and, SQL } from 'drizzle-orm';

export class TestResultRepository {
  /**
   * CREATE: Saves a patient's filled lab test results.
   */
  async create(data: Omit<typeof testResults.$inferInsert, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>, userId: string) {
    const [result] = await db
      .insert(testResults)
      .values({
        ...data,
        createdBy: userId,
        updatedBy: userId,
        isDeleted: false
      })
      .returning();
    return result;
  }

  /**
   * READ (Single): Fetches a specific result row combined with its form schema.
   */
  async findById(id: string) {
    return await db.query.testResults.findFirst({
      where: and(
        eq(testResults.id, id),
        eq(testResults.isDeleted, false)
      ),
      with: {
        template: true, // Automatically includes the master form layout structure
        technician: true // Includes technician profile data
      }
    });
  }

  /**
   * READ (List/Search): Fetches all active test results for a specific patient.
   */
  async findByPatient(patientId: string) {
    return await db.query.testResults.findMany({
      where: and(
        eq(testResults.patientId, patientId),
        eq(testResults.isDeleted, false)
      ),
      with: {
        template: true
      }
    });
  }

  /**
   * UPDATE: Modifies values or notes inside a submitted evaluation.
   */
  async update(id: string, updates: Partial<Omit<typeof testResults.$inferInsert, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'isDeleted'>>, userId: string) {
    const [result] = await db
      .update(testResults)
      .set({
        ...updates,
        updatedBy: userId
      })
      .where(and(eq(testResults.id, id), eq(testResults.isDeleted, false)))
      .returning();
    return result || null;
  }

  /**
   * COMPLIANCE SOFT DELETE: Flags the result record as archived.
   */
  async softDelete(id: string, userId: string) {
    const [result] = await db
      .update(testResults)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        updatedBy: userId
      })
      .where(and(eq(testResults.id, id), eq(testResults.isDeleted, false)))
      .returning();
    return result ? { success: true } : { success: false };
  }
}
