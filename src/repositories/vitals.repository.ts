/**
 * @file vitals.repository.ts
 * @description Repository layer handling all database operations for patient vitals.
 * @author [D.T.Tillya]
 */

import { db } from "../config/db.js";
import { VitalsTable, PatientTable } from "../drizzle/schema.js"   
import { eq, desc, or, ilike, sql ,and,gte,lt} from "drizzle-orm";

// TypeScript types derived directly from your Drizzle schema
export type NewVitals = typeof VitalsTable.$inferInsert;
export type Vitals = typeof VitalsTable.$inferSelect;

export const vitalsRepository = {
  /**
   * Create a new vitals record
   */
  async create(data: NewVitals): Promise<Vitals> {
    const [inserted] = await db
      .insert(VitalsTable)
      .values(data)
      .returning();
    return inserted;
  },

  /**
   * Find a specific vitals record by its UUID
   */
  async findById(id: string): Promise<Vitals | undefined> {
    const [vitals] = await db
      .select()
      .from(VitalsTable)
      .where(eq(VitalsTable.id, id))
      .limit(1);
    return vitals;
  },

  /**
   * Fetch all vitals records linked to a specific patient ID, newest first
   */
  async findByPatientId(patientId: string): Promise<Vitals[]> {
    return db
      .select()
      .from(VitalsTable)
      .where(eq(VitalsTable.patientId, patientId))
      .orderBy(desc(VitalsTable.createdAt)); // Assumes createdAt is in your ...auditLogs
  },



  /**
   * Find vitals by searching across patient names.
   * Handles full names (e.g., "John Doe") by splitting into search terms.
   */
  async findByPatientName(searchTerm: string) {
    // 1. Clean up spaces and split the string into words (e.g., ["John", "Doe"])
    const words = searchTerm.trim().split(/\s+/).filter(Boolean);

    // If empty string passed, return empty array immediately
    if (words.length === 0) return [];

    // 2. Build an array of conditions: EACH word must match at least one name field
    const matchConditions = words.map((word) => {
      const wildcardWord = `%${word}%`;
      return or(
        ilike(PatientTable.firstName, wildcardWord),
        ilike(PatientTable.middleName, wildcardWord),
        ilike(PatientTable.lastName, wildcardWord)
      );
    });

    return db
      .select({
        vitals: VitalsTable,
        patient: {
          id: PatientTable.id,
          firstName: PatientTable.firstName,
          middleName: PatientTable.middleName,
          lastName: PatientTable.lastName,
        }
      })
      .from(VitalsTable)
      .innerJoin(PatientTable, eq(VitalsTable.patientId, PatientTable.id))
      // 3. Use standard and() configuration so all words are accounted for
      .where(and(...matchConditions))
      .orderBy(desc(VitalsTable.createdAt));
  },


/**
   * ADVANCED: Fetch vitals records for a patient scoped dynamically by explicit date boundaries.
   * Handles chronological data auditing (Today, Yesterday, Last Week, Last Month, History).
   */
  async findByPatientIdWithTimeframe(patientId: string, startDate?: Date, endDate?: Date): Promise<Vitals[]> {
    const conditions = [eq(VitalsTable.patientId, patientId)];

    // If an explicit start window timestamp is calculated, slice forward
    if (startDate) {
      conditions.push(gte(VitalsTable.createdAt, startDate));
    }

    // If an explicit closing window boundary is defined, look up to that point
    if (endDate) {
      conditions.push(lt(VitalsTable.createdAt, endDate));
    }

    return db
      .select()
      .from(VitalsTable)
      .where(and(...conditions))
      .orderBy(desc(VitalsTable.createdAt));
  },


  
  
/**
   * COMPLIANCE FIXED: Soft Delete Method
   * Sets flags to hide the data from clinical view without physically wiping it.
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await db
      .update(VitalsTable)
      .set({ 
        isDeleted: true,
        deletedAt: new Date() // Audit timestamp marker
      })
      .where(eq(VitalsTable.id, id))
      .returning({ deletedId: VitalsTable.id });
      
    return result.length > 0;
  },

  /**
   * DATA RECOVERY: Restores a soft-deleted vitals profile entry back to the active pool
   */
  async recoverDeletedVitals(id: string): Promise<boolean> {
    const result = await db
      .update(VitalsTable)
      .set({ 
        isDeleted: false,
        deletedAt: null 
      })
      .where(eq(VitalsTable.id, id))
      .returning({ recoveredId: VitalsTable.id });
      
    return result.length > 0;
  },














  /**
   * Update an existing vitals record
   */
  async update(id: string, data: Partial<NewVitals>): Promise<Vitals | undefined> {
    const [updated] = await db
      .update(VitalsTable)
      .set(data)
      .where(eq(VitalsTable.id, id))
      .returning();
    return updated;
  },

  /**
   * Delete a vitals record
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(VitalsTable)
      .where(eq(VitalsTable.id, id))
      .returning({ deletedId: VitalsTable.id });
    return result.length > 0;
  }
};


