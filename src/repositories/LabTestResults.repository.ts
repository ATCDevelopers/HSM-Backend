import { db } from '../config/db.js';
import { testResults, labTests, PatientTable, UserTable } from '../drizzle/schema.js'; // Adjust path to your schema
import { eq, and, desc, SQL } from 'drizzle-orm';

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
        template: true,
        // Names only: who performed the test and who it was sent to, for the lab history and printed report
        technician: { columns: { firstName: true, lastName: true, role: true } },
        doctor: { columns: { firstName: true, lastName: true } }
      },
      orderBy: [desc(testResults.createdAt)]
    });
  }

  /**
   * READ (Inbox): Every active result with test, patient and doctor names, newest first.
   * Pass doctorId to get only the results sent to that doctor.
   */
  async findAll(filters: { doctorId?: string } = {}) {
    const conditions: SQL[] = [eq(testResults.isDeleted, false)];
    if (filters.doctorId) {
      conditions.push(eq(testResults.doctorId, filters.doctorId));
    }

    return await db
      .select({
        id: testResults.id,
        labTestTemplateId: testResults.labTestTemplateId,
        testName: labTests.name,
        testCategory: labTests.category,
        formSchema: labTests.formSchema,
        patientId: testResults.patientId,
        patientFirstName: PatientTable.firstName,
        patientLastName: PatientTable.lastName,
        doctorId: testResults.doctorId,
        doctorFirstName: UserTable.firstName,
        doctorLastName: UserTable.lastName,
        values: testResults.values,
        notes: testResults.notes,
        createdAt: testResults.createdAt,
      })
      .from(testResults)
      .leftJoin(labTests, eq(testResults.labTestTemplateId, labTests.id))
      .leftJoin(PatientTable, eq(testResults.patientId, PatientTable.id))
      .leftJoin(UserTable, eq(testResults.doctorId, UserTable.id))
      .where(and(...conditions))
      .orderBy(desc(testResults.createdAt));
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
