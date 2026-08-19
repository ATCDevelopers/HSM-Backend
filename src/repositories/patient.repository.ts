import { eq ,desc} from "drizzle-orm";
import { db } from "../config/db.js";
import { PatientTable } from "../drizzle/schema.js";
import { Address} from "../drizzle/schema.js";



export const createPatient = async (
  patientData: typeof PatientTable.$inferInsert
) => {
  const result = await db
    .insert(PatientTable)
    .values(patientData)
    .returning();

  return result[0];
};

export const getPatientByNhifCard = async (nhifCard: string) => {
  const result = await db
    .select()
    .from(PatientTable)
    .where(eq(PatientTable.nhifCard, nhifCard))
    .limit(1);

  return result[0] ?? null;
};

export const getPatientByEmail = async (email: string) => {
  const result = await db
    .select()
    .from(PatientTable)
    .where(eq(PatientTable.email, email))
    .limit(1);

  return result[0] ?? null;
};


export const createAddress = async (
  addressData: typeof Address.$inferInsert
) => {
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
export const getPatientWithAddressById = async (patientId: string) => {
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








/////////////////////////////////////////////////////////////
/////////////////////
////////////////////////////////////////////////////////////






// Aina za data (Types) kutoka kwenye Schema zako kwa ajili ya kuingiza data
type NewAddress = typeof Address.$inferInsert;
type NewPatient = Omit<typeof PatientTable.$inferInsert, "addressId">;

// ... (Nambari zako za nyuma za getPatientsWithAddress na getPatientWithAddressById ziwepo hapa)

// 3. Repository ya kusajili Mgonjwa mpya pamoja na Anwani yake kwa pamoja
export const createPatientWithAddress = async (patientData: NewPatient, addressData: NewAddress) => {
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







////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////




// 1. Kutengeneza Aina za Data (Types) kwa ajili ya Kusasisha (Updates)
type AddressUpdate = Partial<typeof Address.$inferInsert>;
type PatientUpdate = Partial<Omit<typeof PatientTable.$inferInsert, "addressId">>;

// ... (Njia zako za nyuma za get na create ziendelee kubaki hapa)

// 2. Repository ya kusasisha Mgonjwa na Anwani yake kwa usalama
export const updatePatientWithAddress = async (
  patientId: string,
  addressId: string,
  patientData: PatientUpdate,
  addressData: AddressUpdate
) => {
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


//////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
//pdf convertion



//import { eq } from "drizzle-orm";
//import { db } from "../db"; // Path to your Drizzle db instance
//import { Patient, Address } from "../db/schema"; // Using your exact schema exports

export interface PatientWithAddress {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: any; // Fallback to avoid enum string mismatch
  nhifCard: string;
  email: string;
  dateOfBirth: Date;
  bloodGroup: any; // Fallback to avoid enum string mismatch
  phoneNumber: string;
  photoUrl: string | null;
  nationalId: string | null;
  address: {
    id: string;
    region: string;
    district: string | null;
    city: string;
    state: string;
    postalCode: string | null;
    country: string;
  } | null;
}

export class PatientRepository {
  /**
   * Fetches a single patient by ID and joins their address data 
   * to provide a complete dataset for the PDF generation engine.
   */
  async getPatientForPdf(patientId: string): Promise<PatientWithAddress | null> {
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






export interface CreateDocumentInput {
  patientId: string;
  documentName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: string;
}

export class DocumentRepository {
  /**
   * Inahifadhi metadata ya hati/picha iliyopakiwa kwenye database
   */
  async saveDocumentMetadata(data: CreateDocumentInput) {
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
  async getDocumentsByPatientId(patientId: string) {
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








import {  isNull, ilike, or } from "drizzle-orm";

export class PatientRepositoryDelete {
  /**
   * Soft deletes a patient by setting the deletedAt timestamp.
   */
  async softDeletePatient(patientId: string, deletedByUserId: string) {
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
  async searchPatients(searchTerm: string) {
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
      .where(
        or(
          ilike(PatientTable.firstName, queryPattern),
          ilike(PatientTable.lastName, queryPattern),
          ilike(PatientTable.email, queryPattern)
        )
      );

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
