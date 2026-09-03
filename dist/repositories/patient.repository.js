import { eq, desc } from "drizzle-orm";
import { db } from "../config/db.js";
import { PatientTable } from "../drizzle/schema.js";
import { Address } from "../drizzle/schema.js";
export const createPatient = async (patientData) => {
    const result = await db
        .insert(PatientTable)
        .values(patientData)
        .returning();
    return result[0];
};
export const getPatientByNhifCard = async (nhifCard) => {
    const result = await db
        .select()
        .from(PatientTable)
        .where(eq(PatientTable.nhifCard, nhifCard))
        .limit(1);
    return result[0] ?? null;
};
export const getPatientByEmail = async (email) => {
    const result = await db
        .select()
        .from(PatientTable)
        .where(eq(PatientTable.email, email))
        .limit(1);
    return result[0] ?? null;
};
export const createAddress = async (addressData) => {
    const result = await db
        .insert(Address)
        .values(addressData)
        .returning();
    return result[0];
};
////////////////////////////////////////////////////////////////////
///////////////
/////////////////////////////////////////////////////////////////
// 1. Fetch all patients with their address details
export const getPatientsWithAddress = async () => {
    const result = await db
        .select({
        id: PatientTable.id,
        firstName: PatientTable.firstName,
        lastName: PatientTable.lastName,
        middleName: PatientTable.middleName,
        gender: PatientTable.gender,
        nhifCard: PatientTable.nhifCard,
        email: PatientTable.email,
        dateOfBirth: PatientTable.dateOfBirth,
        bloodGroup: PatientTable.bloodGroup,
        phoneNumber: PatientTable.phoneNumber,
        photoUrl: PatientTable.photoUrl,
        nationalId: PatientTable.nationalId,
        address: {
            id: Address.id,
            region: Address.region,
            district: Address.district,
            city: Address.city,
            state: Address.state,
            postalCode: Address.PostalCode,
            country: Address.country,
        },
    })
        .from(PatientTable)
        .leftJoin(Address, eq(PatientTable.addressId, Address.id));
    return result;
};
// 2. Fetch a single patient by ID with their address details
export const getPatientWithAddressById = async (patientId) => {
    const result = await db
        .select({
        id: PatientTable.id,
        firstName: PatientTable.firstName,
        lastName: PatientTable.lastName,
        middleName: PatientTable.middleName,
        gender: PatientTable.gender,
        nhifCard: PatientTable.nhifCard,
        email: PatientTable.email,
        dateOfBirth: PatientTable.dateOfBirth,
        bloodGroup: PatientTable.bloodGroup,
        phoneNumber: PatientTable.phoneNumber,
        photoUrl: PatientTable.photoUrl,
        nationalId: PatientTable.nationalId,
        address: {
            id: Address.id,
            region: Address.region,
            district: Address.district,
            city: Address.city,
            state: Address.state,
            postalCode: Address.PostalCode,
            country: Address.country,
        },
    })
        .from(PatientTable)
        .leftJoin(Address, eq(PatientTable.addressId, Address.id))
        .where(eq(PatientTable.id, patientId))
        .limit(1);
    return result[0] ?? null;
};
// ... (Nambari zako za nyuma za getPatientsWithAddress na getPatientWithAddressById ziwepo hapa)
// 3. Repository ya kusajili Mgonjwa mpya pamoja na Anwani yake kwa pamoja
export const createPatientWithAddress = async (patientData, addressData) => {
    // Tunatumia db.transaction ili kuhakikisha operesheni zote mbili zinafanikiwa au zote zinafeli kwa pamoja
    return await db.transaction(async (tx) => {
        // Hatua ya 1: Ingiza taarifa za anwani kwanza ili tupate address_id
        const [insertedAddress] = await tx
            .insert(Address)
            .values(addressData)
            .returning({ id: Address.id });
        // Hatua ya 2: Ingiza taarifa za mgonjwa ukiunganisha na address_id tuliyoipata juu
        const [insertedPatient] = await tx
            .insert(PatientTable)
            .values({
            ...patientData,
            addressId: insertedAddress.id, // Hapa tunaunganisha mgonjwa na anwani yake
        })
            .returning();
        // Hatua ya 3: Rudisha data ya mgonjwa aliyetengenezwa
        return insertedPatient;
    });
};
// ... (Njia zako za nyuma za get na create ziendelee kubaki hapa)
// 2. Repository ya kusasisha Mgonjwa na Anwani yake kwa usalama
export const updatePatientWithAddress = async (patientId, addressId, patientData, addressData) => {
    return await db.transaction(async (tx) => {
        // Hatua ya 1: Sasisha jedwali la Anwani ikiwa kuna data iliyotumwa
        if (Object.keys(addressData).length > 0) {
            await tx
                .update(Address)
                .set(addressData)
                .where(eq(Address.id, addressId));
        }
        // Hatua ya 2: Sasisha jedwali la Mgonjwa ikiwa kuna data iliyotumwa
        if (Object.keys(patientData).length > 0) {
            await tx
                .update(PatientTable)
                .set(patientData)
                .where(eq(PatientTable.id, patientId));
        }
        // Hatua ya 3: Rejesha data kamili ya Mgonjwa baada ya mabadiliko
        const [updatedPatient] = await tx
            .select()
            .from(PatientTable)
            .where(eq(PatientTable.id, patientId))
            .limit(1);
        return updatedPatient || null;
    });
};
export class PatientRepository {
    /**
     * Fetches a single patient by ID and joins their address data
     * to provide a complete dataset for the PDF generation engine.
     */
    async getPatientForPdf(patientId) {
        const result = await db
            .select({
            id: PatientTable.id,
            firstName: PatientTable.firstName,
            lastName: PatientTable.lastName,
            middleName: PatientTable.middleName,
            gender: PatientTable.gender,
            nhifCard: PatientTable.nhifCard,
            email: PatientTable.email,
            dateOfBirth: PatientTable.dateOfBirth,
            bloodGroup: PatientTable.bloodGroup,
            phoneNumber: PatientTable.phoneNumber,
            photoUrl: PatientTable.photoUrl,
            nationalId: PatientTable.nationalId,
            address: {
                id: Address.id,
                region: Address.region,
                district: Address.district,
                city: Address.city,
                state: Address.state,
                postalCode: Address.PostalCode, // Case matching your schema layout
                country: Address.country,
            },
        })
            .from(PatientTable)
            .leftJoin(Address, eq(PatientTable.addressId, Address.id))
            .where(eq(PatientTable.id, patientId))
            .limit(1);
        return result.length > 0 ? result[0] : null;
    }
}
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
//////////////////////////////////////////////////////
import { PatientDocuments } from "../drizzle/schema.js";
export class DocumentRepository {
    /**
     * Inahifadhi metadata ya hati/picha iliyopakiwa kwenye database
     */
    async saveDocumentMetadata(data) {
        const [insertedDoc] = await db
            .insert(PatientDocuments)
            .values({
            patientId: data.patientId,
            documentName: data.documentName,
            fileUrl: data.fileUrl,
            mimeType: data.mimeType,
            fileSize: data.fileSize,
        })
            .returning();
        return insertedDoc;
    }
    /**
     * Inatafuta na kurudisha mafile yote yaliyowahi kupakiwa kwa ajili ya mgonjwa mmoja (by Patient ID)
     * Inapanga mafile kuanzia yaliyowekwa sasa hivi kurudi nyuma (Latest First)
     */
    async getDocumentsByPatientId(patientId) {
        return await db
            .select()
            .from(PatientDocuments)
            .where(eq(PatientDocuments.patientId, patientId))
            .orderBy(desc(PatientDocuments.createdAt));
    }
}
////////////////////////////////////////////////
////////////////////////////////////////////
//////////////////////////////////////////////
import { ilike, or } from "drizzle-orm";
export class PatientRepositoryDelete {
    /**
     * Soft deletes a patient by setting the deletedAt timestamp.
     */
    async softDeletePatient(patientId, deletedByUserId) {
        const [updatedPatient] = await db
            .update(PatientTable)
            .set({
            deletedAt: new Date(),
            deletedBy: deletedByUserId, // Tracks who performed the deactivation
        })
            .where(eq(PatientTable.id, patientId))
            .returning({ id: PatientTable.id });
        return updatedPatient;
    }
    /**
     * Searches all patients.
     * If a patient is active, it returns all details.
     * If a patient is soft-deleted, it hides everything except the ID and an explicit deactivated flag.
     */
    async searchPatients(searchTerm) {
        const queryPattern = `%${searchTerm}%`;
        const results = await db
            .select({
            id: PatientTable.id,
            firstName: PatientTable.firstName,
            lastName: PatientTable.lastName,
            email: PatientTable.email,
            phoneNumber: PatientTable.phoneNumber,
            deletedAt: PatientTable.deletedAt,
            address: {
                city: Address.city,
                country: Address.country,
            },
        })
            .from(PatientTable)
            .leftJoin(Address, eq(PatientTable.addressId, Address.id))
            .where(or(ilike(PatientTable.firstName, queryPattern), ilike(PatientTable.lastName, queryPattern), ilike(PatientTable.email, queryPattern)));
        // Apply conditional masking inside the repository runtime transformation mapping layer
        return results.map((patient) => {
            if (patient.deletedAt !== null) {
                return {
                    id: patient.id,
                    status: "deactivated",
                    firstName: null,
                    lastName: null,
                    email: null,
                    phoneNumber: null,
                    address: null,
                };
            }
            return {
                id: patient.id,
                status: "active",
                firstName: patient.firstName,
                lastName: patient.lastName,
                email: patient.email,
                phoneNumber: patient.phoneNumber,
                address: patient.address,
            };
        });
    }
}
