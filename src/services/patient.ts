import { PatientTable } from "../drizzle/schema.js";
import {
  createPatient,
  getPatientByNhifCard,
  getPatientByEmail,
} from "../repositories/patient.repository.js";
import { createAddress } from "../repositories/patient.repository.js";
import { Address} from "../drizzle/schema.js";





type RegisterPatientData = {
  patient: {
    firstName: string;
    lastName: string;
    middleName?: string;
    gender: typeof PatientTable.$inferInsert.gender;
    nhifCard: string;
    email: string;
    dateOfBirth: string;
    bloodGroup: typeof PatientTable.$inferInsert.bloodGroup;
    phoneNumber: string;
    photoUrl?: string;
    nationalId?: string;
  };

  address: {
    region: string;
    district?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
};

export const registerPatient = async (
  data: RegisterPatientData
) => {
  // Check NHIF
  const existingPatientByNhif =
    await getPatientByNhifCard(data.patient.nhifCard);

  if (existingPatientByNhif) {
    throw new Error("NHIF card already registered");
  }

  // Check email
  const existingPatientByEmail =
    await getPatientByEmail(data.patient.email);

  if (existingPatientByEmail) {
    throw new Error("Email already registered");
  }

  // Create address
  const address = await createAddress({
    region: data.address.region,
    district: data.address.district ?? null,
    city: data.address.city,
    state: data.address.state,
    PostalCode: data.address.postalCode ?? null,
    country: data.address.country,
  });

  // Create patient using generated address ID
  const patient = await createPatient({
    firstName: data.patient.firstName,
    lastName: data.patient.lastName,
    middleName: data.patient.middleName ?? null,
    gender: data.patient.gender,
    nhifCard: data.patient.nhifCard,
    email: data.patient.email,
    dateOfBirth: new Date(data.patient.dateOfBirth),
    bloodGroup: data.patient.bloodGroup,
    phoneNumber: data.patient.phoneNumber,
    photoUrl: data.patient.photoUrl ?? null,
    nationalId: data.patient.nationalId ?? null,
    addressId: address.id,
  });

  return {
    patient,
    address,
  };
};


///////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

import * as patientRepository from "../repositories/patient.repository.js";

// 1. Service to retrieve all patients with addresses
export const getAllPatientsWithAddress = async () => {
  const patients = await patientRepository.getPatientsWithAddress();
  
  // You can add business logic here (e.g., filtering, logging, or auditing)
  return patients;
};

// 2. Service to retrieve a single patient by ID with address
export const getPatientWithAddressById = async (patientId: string) => {
  if (!patientId) {
    throw new Error("Patient ID is required");
  }

  const patient = await patientRepository.getPatientWithAddressById(patientId);

  // Business logic: Throw a specific error if patient does not exist
  if (!patient) {
    throw new Error(`Patient with ID ${patientId} not found`);
  }

  return patient;
};



////////////////////////////////////////////////////
///////////////////
////////////////////////////////////////////////////









type AddressUpdate = Partial<typeof Address.$inferInsert>;
type PatientUpdate = Partial<Omit<typeof PatientTable.$inferInsert, "addressId">>;

// 4. Service ya kusasisha taarifa za Mgonjwa na Anwani yake
export const updatePatientAndAddress = async (
  patientId: string,
  patientData: PatientUpdate,
  addressData: AddressUpdate
) => {
  if (!patientId) {
    throw new Error("ID is required for patient update");
  }

  
  const existingPatient = await patientRepository.getPatientWithAddressById(patientId);
  if (!existingPatient) {
    throw new Error(`Patient with ID ${patientId} has not been found .`);
  }

  
  const addressId = existingPatient.address?.id;
  if (!addressId && Object.keys(addressData).length > 0) {
    throw new Error("This patient doe not have Address issued");
  }

  
  const updatedPatient = await patientRepository.updatePatientWithAddress(
    patientId,
    addressId!, // Tunapitisha ID ya anwani iliyopatikana kwenye database
    patientData,
    addressData
  );

  return updatedPatient;
};

