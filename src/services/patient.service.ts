import { PatientTable } from "../drizzle/schema.js";
import {
  createPatient,
  PatientRepositorySoftDelete,
  getPatientByNhifCard,
  getPatientByEmail,
} from "../repositories/patient.repository.js";
import { createAddress } from "../repositories/patient.repository.js";
import { Address} from "../drizzle/schema.js";
import { chargeRegistration } from "./billing.service.js";





type RegisterPatientData = {
  patient: {
    firstName: string;
    lastName: string;
    middleName?: string;
    gender: typeof PatientTable.$inferInsert.gender;
    /** Required unless the patient pays cash. */
    nhifCard?: string | null;
    paymentMode?: typeof PatientTable.$inferInsert.paymentMode;
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
  data: RegisterPatientData,
  userId?: string
) => {
  const paymentMode = data.patient.paymentMode ?? "NHIF";
  if (!["NHIF", "INSURANCE", "CASH"].includes(paymentMode)) {
    throw new Error("Payment mode must be NHIF, INSURANCE or CASH");
  }
  // Cash patients have no card; insured ones must give theirs.
  const nhifCard = paymentMode === "CASH" ? null : data.patient.nhifCard?.trim() || null;
  if (paymentMode !== "CASH" && !nhifCard) {
    throw new Error(`${paymentMode === "NHIF" ? "NHIF" : "Insurance"} card number is required`);
  }

  // Check NHIF
  if (nhifCard && (await getPatientByNhifCard(nhifCard))) {
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
    nhifCard,
    paymentMode,
    email: data.patient.email,
    dateOfBirth: new Date(data.patient.dateOfBirth),
    bloodGroup: data.patient.bloodGroup,
    phoneNumber: data.patient.phoneNumber,
    photoUrl: data.patient.photoUrl ?? null,
    nationalId: data.patient.nationalId ?? null,
    addressId: address.id,
  });

  // Cash patients are billed the account-opening fee; insured patients are not.
  await chargeRegistration(patient, userId);

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
  patientData: Record<string, any>,
  addressData: Record<string, any>
) => {
  if (!patientId) {
    throw new Error("ID is required for patient update");
  }

  const existingPatient = await patientRepository.getPatientWithAddressById(patientId);
  if (!existingPatient) {
    throw new Error(`Patient with ID ${patientId} has not been found.`);
  }

  // Sanitize patient fields to match PatientTable schema
  const sanitizedPatient: Record<string, any> = {};
  if (patientData.firstName !== undefined) sanitizedPatient.firstName = patientData.firstName;
  if (patientData.lastName !== undefined) sanitizedPatient.lastName = patientData.lastName;
  if (patientData.middleName !== undefined) sanitizedPatient.middleName = patientData.middleName;
  if (patientData.gender !== undefined) sanitizedPatient.gender = patientData.gender;
  if (patientData.nhifCard !== undefined || patientData.nhifNumber !== undefined) {
    // Empty means "no card" (cash patient); storing "" would collide with other cash patients on the unique column.
    sanitizedPatient.nhifCard = (patientData.nhifCard || patientData.nhifNumber || "").trim() || null;
  }
  if (patientData.paymentMode !== undefined && ["NHIF", "INSURANCE", "CASH"].includes(patientData.paymentMode)) {
    sanitizedPatient.paymentMode = patientData.paymentMode;
  }
  if (patientData.email !== undefined) sanitizedPatient.email = patientData.email;
  if (patientData.dateOfBirth !== undefined) {
    sanitizedPatient.dateOfBirth = typeof patientData.dateOfBirth === "string" ? new Date(patientData.dateOfBirth) : patientData.dateOfBirth;
  }
  if (patientData.bloodGroup !== undefined) sanitizedPatient.bloodGroup = patientData.bloodGroup;
  if (patientData.phoneNumber !== undefined || patientData.phone !== undefined) {
    sanitizedPatient.phoneNumber = patientData.phoneNumber || patientData.phone;
  }
  if (patientData.photoUrl !== undefined || patientData.photo !== undefined) {
    sanitizedPatient.photoUrl = patientData.photoUrl ?? patientData.photo;
  }
  if (patientData.nationalId !== undefined) sanitizedPatient.nationalId = patientData.nationalId;

  // Sanitize address fields to match Address schema
  const sanitizedAddress: Record<string, any> = {};
  if (addressData.region !== undefined) sanitizedAddress.region = addressData.region;
  if (addressData.district !== undefined) sanitizedAddress.district = addressData.district;
  if (addressData.city !== undefined) sanitizedAddress.city = addressData.city;
  if (addressData.state !== undefined) sanitizedAddress.state = addressData.state;
  if (addressData.postalCode !== undefined || addressData.PostalCode !== undefined) {
    sanitizedAddress.PostalCode = addressData.postalCode ?? addressData.PostalCode;
  }
  if (addressData.country !== undefined) sanitizedAddress.country = addressData.country;

  const addressId = existingPatient.address?.id;

  const updatedPatient = await patientRepository.updatePatientWithAddress(
    patientId,
    addressId || undefined,
    sanitizedPatient,
    sanitizedAddress
  );

  return updatedPatient;
};



//////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

import PDFDocument from "pdfkit";
import { PatientRepository, PatientWithAddress } from "../repositories/patient.repository.js";

export class PatientService {
  private readonly patientRepository = new PatientRepository();

  async generatePatientPdf(patientId: string): Promise<Buffer> {
    const patient =
      await this.patientRepository.getPatientForPdf(patientId);

    if (!patient) {
      throw new Error(`Patient record with ID ${patientId} not found`);
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const chunks: Buffer[] = [];

    return new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", reject);

      this.buildPatientPdf(doc, patient);

      doc.end();
    });
  }

  private buildPatientPdf(
    doc: PDFKit.PDFDocument,
    patient: PatientWithAddress
  ): void {
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#2c3e50")
      .text("PATIENT MEDICAL PROFILE REPORT", {
        align: "center",
      });

    doc
      .moveDown(0.5)
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#7f8c8d")
      .text(
        `Generated on: ${new Date().toLocaleDateString()}`,
        { align: "center" }
      );

    doc
      .moveDown()
      .strokeColor("#2c3e50")
      .lineWidth(1.5)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();

    doc.moveDown(2);

    // PERSONAL DETAILS
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#2c3e50")
      .text("Personal Details");

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text(
        `Full Name: ${patient.firstName} ${
          patient.middleName ?? ""
        } ${patient.lastName}`
      )
      .text(
        `Date of Birth: ${new Date(
          patient.dateOfBirth
        ).toLocaleDateString()}`
      )
      .text(`Gender: ${patient.gender}`)
      .text(`Blood Group: ${patient.bloodGroup}`);

    doc.moveDown();

    // CONTACT DETAILS
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#2c3e50")
      .text("Contact & ID Details");

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text(`Email: ${patient.email}`)
      .text(`Phone: ${patient.phoneNumber}`)
      .text(`NHIF Card: ${patient.nhifCard}`)
      .text(`National ID: ${patient.nationalId ?? "N/A"}`);

    doc.moveDown();

    // ADDRESS
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#2c3e50")
      .text("Residential Address Details");

    doc.moveDown(0.5);

    if (patient.address) {
      const address = patient.address;

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#333333")
        .text(`Country: ${address.country}`)
        .text(`State / Region: ${address.state} / ${address.region}`)
        .text(
          `City / District: ${address.city} / ${
            address.district ?? "N/A"
          }`
        )
        .text(`Postal Code: ${address.postalCode ?? "N/A"}`);
    } else {
      doc
        .fontSize(10)
        .font("Helvetica-Oblique")
        .fillColor("#c0392b")
        .text(
          "No primary residential address data found for this patient record."
        );
    }
  }
}
export const patientServiceInstance = new PatientService();












/////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////







import { DocumentRepository, CreateDocumentInput } from "../repositories/patient.repository.js";

export class DocumentService {
  private readonly documentRepository = new DocumentRepository();

  /**
   * Mantiki ya kuhifadhi mafile mapya ya wagonjwa (Scanned JPGs, PDFs n.k)
   */
  async uploadPatientDocument(data: CreateDocumentInput) {
    // Unaweza kuongeza masharti hapa (kama kuangalia ukubwa wa faili au aina)
    return await this.documentRepository.saveDocumentMetadata(data);
  }

  /**
   * Mantiki ya kusoma na kuorodhesha nyaraka zote za mgonjwa mmoja
   */
  async getPatientDocumentsList(patientId: string) {
    return await this.documentRepository.getDocumentsByPatientId(patientId);
  }

  async getPatientDocument(patientId: string, documentId: string) {
    return await this.documentRepository.getDocument(patientId, documentId);
  }

  async removePatientDocument(patientId: string, documentId: string, userId?: string) {
    return await this.documentRepository.softDeleteDocument(patientId, documentId, userId);
  }
}


export const documentServiceInstance = new DocumentService();









///////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////



// 1. Updated repository import matching your renamed repository class
import { PatientRepositoryDelete } from "../repositories/patient.repository.js";

export class PatientServiceDelete {
  // 2. Instantiate using your renamed repository instance
  private readonly patientRepository = new PatientRepositoryDelete();

  /**
   * Triggers the soft-delete sequence on a patient record
   */
  async deactivatePatient(patientId: string, currentUserId: string) {
    const patient = await this.patientRepository.softDeletePatient(patientId, currentUserId);
    
    if (!patient) {
      throw new Error("Patient not found or could not be deactivated");
    }
    
    return patient;
  }

  /**
   * Orchestrates the search query sequence across active and deactivated rows
   */
  async searchAllPatients(searchTerm: string) {
    return await this.patientRepository.searchPatients(searchTerm);
  }
}

// 3. Export the standard module wrapper instance for controller level integration
export const patientServiceInstance2 = new PatientServiceDelete();












/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// SOFT DELETE SERVICES 



//import {  } from "./patient.repository";

export const PatientServiceSoftDelete = {
  /**
   * Soft-deletes an active patient record
   * Checks if the patient is active before attempting to flag them as deleted
   */
  async deletePatientProfile(id: string): Promise<boolean> {
    // 1. Verify the patient exists and is currently active
    const activePatient = await PatientRepositorySoftDelete.findActiveById(id);
    if (!activePatient) {
      throw new Error("Patient not found, or profile has already been deleted.");
    }
    
    // 2. Perform the soft delete flags operation
    return await PatientRepositorySoftDelete.softDelete(id);
  },

  /**
   * Restores a soft-deleted patient back to clinical view
   */
  async restorePatientProfile(id: string): Promise<boolean> {
    // 1. Attempt recovery directly
    const isRestored = await PatientRepositorySoftDelete.recover(id);
    if (!isRestored) {
      throw new Error("Failed to restore patient. Check if the patient record exists.");
    }
    
    return isRestored;
  }
};
