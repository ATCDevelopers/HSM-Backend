/**
 * @file consultation.repository.ts
 * @description Repository layer handling database operations for the Consultation table.
 * @author [Your Name Here]
 */

import { db } from "../config/db.js"; 
import { ConsultationTable, PatientTable, UserTable } from "../drizzle/schema.js"; 
import { eq, desc, and,ilike,or ,gte ,lt} from "drizzle-orm";

export type NewConsultation = typeof ConsultationTable.$inferInsert;
export type Consultation = typeof ConsultationTable.$inferSelect;

export const consultationRepository = {
  /**
   * Create a new consultation record
   */
  async create(data: NewConsultation): Promise<Consultation> {
    const [inserted] = await db
      .insert(ConsultationTable)
      .values(data)
      .returning();
    return inserted;
  },

  /**
   * Find a specific consultation record by ID, joining Doctor and Patient details
   */
  async findById(id: string) {
    const [record] = await db
      .select({
        consultation: ConsultationTable,
        patient: {
          id: PatientTable.id,
          firstName: PatientTable.firstName,
          lastName: PatientTable.lastName,
        },
        doctor: {
          id: UserTable.id,
          firstName: UserTable.firstName,
          lastName: UserTable.lastName,
        }
      })
      .from(ConsultationTable)
      .innerJoin(PatientTable, eq(ConsultationTable.patientId, PatientTable.id))
      .innerJoin(UserTable, eq(ConsultationTable.doctorId, UserTable.id))
      .where(eq(ConsultationTable.id, id))
      .limit(1);
    return record;
  },


  

/**
   * Fetch historical notes linked directly to a patient UUID with chronological filter ranges
   * Links Doctor and Patient data via SQL Inner Joins
   */
  async findByPatientIdWithTimeframe(patientId: string, startDate?: Date, endDate?: Date) {
    // 1. Establish core baseline foreign key linking condition
    const conditions = [eq(ConsultationTable.patientId, patientId)];

    // 2. Dynamically stack timestamp boundaries based on the doctor's request
    if (startDate) {
      conditions.push(gte(ConsultationTable.createdAt, startDate)); // Looks forward from start timestamp
    }
    if (endDate) {
      conditions.push(lt(ConsultationTable.createdAt, endDate)); // Stops exactly before closing timestamp
    }

    return db
      .select({
        consultation: ConsultationTable,
        patient: {
          id: PatientTable.id,
          firstName: PatientTable.firstName,
          lastName: PatientTable.lastName,
        },
        doctor: {
          id: UserTable.id,
          firstName: UserTable.firstName,
          lastName: UserTable.lastName,
        }
      })
      .from(ConsultationTable)
      .innerJoin(PatientTable, eq(ConsultationTable.patientId, PatientTable.id))
      .innerJoin(UserTable, eq(ConsultationTable.doctorId, UserTable.id))
      .where(and(...conditions))
      .orderBy(desc(ConsultationTable.createdAt)); // Sorts the newest medical logs straight to the top
  },













   async findByPatientName(searchTerm: string) {
    // Split the query string by spaces into an array of individual words
    const words = searchTerm.trim().split(/\s+/).filter(Boolean);

    // Guard against an empty query string
    if (words.length === 0) return [];

    // Map each word to an intersection condition across name columns
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
        consultation: ConsultationTable,
        patient: {
          id: PatientTable.id,
          firstName: PatientTable.firstName,
          middleName: PatientTable.middleName,
          lastName: PatientTable.lastName,
        },
        doctor: {
          id: UserTable.id,
          firstName: UserTable.firstName,
          lastName: UserTable.lastName,
        }
      })
      .from(ConsultationTable)
      .innerJoin(PatientTable, eq(ConsultationTable.patientId, PatientTable.id))
      .innerJoin(UserTable, eq(ConsultationTable.doctorId, UserTable.id))
      .where(and(...matchConditions))
      .orderBy(desc(ConsultationTable.createdAt));
  },

  /**
   * Fetch all consultations for a specific patient, newest first
   */
  async findByPatientId(patientId: string) {
    return db
      .select()
      .from(ConsultationTable)
      .where(eq(ConsultationTable.patientId, patientId))
      .orderBy(desc(ConsultationTable.createdAt));
  },

  /**
   * Update an existing consultation record
   */
  async update(id: string, data: Partial<NewConsultation>): Promise<Consultation | undefined> {
    const [updated] = await db
      .update(ConsultationTable)
      .set(data)
      .where(eq(ConsultationTable.id, id))
      .returning();
    return updated;
  },

  /**
   * Delete a consultation record
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(ConsultationTable)
      .where(eq(ConsultationTable.id, id))
      .returning({ deletedId: ConsultationTable.id });
    return result.length > 0;
  }
};


///////////////////////////////////////////////
///////////////////////////////////////////////
////////////////////////////////////////////////