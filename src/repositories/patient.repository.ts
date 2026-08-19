import { eq } from "drizzle-orm";
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












