import { db } from "../config/db.js"; // Adjust path to your Drizzle db instance
import { PrescriptionsTable, PatientTable, UserTable, StatusTable } from "../drizzle/schema.js"; // Adjust schema path
import { eq, desc, or, and, ilike } from "drizzle-orm";
export const prescriptionsRepository = {
    /**
     * Create a new prescription entry record row
     */
    async create(data) {
        const [inserted] = await db
            .insert(PrescriptionsTable)
            .values(data)
            .returning();
        return inserted;
    },
    /**
     * Find a specific prescription profile by its unique ID
     * Dynamically joins profiles from PatientTable, UserTable (Doctor), and StatusTable
     */
    async findById(id) {
        const [record] = await db
            .select({
            prescription: PrescriptionsTable,
            patient: {
                id: PatientTable.id,
                firstName: PatientTable.firstName,
                lastName: PatientTable.lastName,
            },
            doctor: {
                id: UserTable.id,
                firstName: UserTable.firstName,
                lastName: UserTable.lastName,
            },
            status: {
                id: StatusTable.id,
                name: StatusTable.name, // Adjust column name based on your StatusTable properties
            }
        })
            .from(PrescriptionsTable)
            .innerJoin(PatientTable, eq(PrescriptionsTable.patientId, PatientTable.id))
            .innerJoin(UserTable, eq(PrescriptionsTable.doctorId, UserTable.id))
            .innerJoin(StatusTable, eq(PrescriptionsTable.statusId, StatusTable.id))
            .where(eq(PrescriptionsTable.id, id))
            .limit(1);
        return record;
    },
    /**
     * Fetch all historical prescriptions written for a targeted patient UUID
     */
    async findByPatientId(patientId) {
        return db
            .select({
            prescription: PrescriptionsTable,
            doctor: {
                id: UserTable.id,
                firstName: UserTable.firstName,
                lastName: UserTable.lastName,
            },
            status: {
                id: StatusTable.id,
                name: StatusTable.name,
            }
        })
            .from(PrescriptionsTable)
            .innerJoin(UserTable, eq(PrescriptionsTable.doctorId, UserTable.id))
            .innerJoin(StatusTable, eq(PrescriptionsTable.statusId, StatusTable.id))
            .where(eq(PrescriptionsTable.patientId, patientId))
            .orderBy(desc(PrescriptionsTable.createdAt));
    },
    /**
     * Search active prescriptions by filtering against the linked patient's full name.
     * Splits multi-word phrases cleanly (e.g. "Jane Doe") across database text fields.
     */
    async findByPatientName(searchTerm) {
        const words = searchTerm.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0)
            return [];
        const matchConditions = words.map((word) => {
            const wildcardTerm = `%${word}%`;
            return or(ilike(PatientTable.firstName, wildcardTerm), ilike(PatientTable.middleName, wildcardTerm), ilike(PatientTable.lastName, wildcardTerm));
        });
        return db
            .select({
            prescription: PrescriptionsTable,
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
            },
            status: {
                id: StatusTable.id,
                name: StatusTable.name,
            }
        })
            .from(PrescriptionsTable)
            .innerJoin(PatientTable, eq(PrescriptionsTable.patientId, PatientTable.id))
            .innerJoin(UserTable, eq(PrescriptionsTable.doctorId, UserTable.id))
            .innerJoin(StatusTable, eq(PrescriptionsTable.statusId, StatusTable.id))
            .where(and(...matchConditions))
            .orderBy(desc(PrescriptionsTable.createdAt));
    },
    /**
     * Update an existing prescription (e.g. changing notes or altering status references)
     */
    async update(id, data) {
        const [updated] = await db
            .update(PrescriptionsTable)
            .set(data)
            .where(eq(PrescriptionsTable.id, id))
            .returning();
        return updated;
    },
    /**
     * Delete a prescription row from the engine
     */
    async delete(id) {
        const result = await db
            .delete(PrescriptionsTable)
            .where(eq(PrescriptionsTable.id, id))
            .returning({ deletedId: PrescriptionsTable.id });
        return result.length > 0;
    }
};
