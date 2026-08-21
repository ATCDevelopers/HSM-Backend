import { pgTable, pgEnum, uuid, text, timestamp, boolean, integer, primaryKey, doublePrecision, numeric, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';


// 1. ENUMS DEFINITIONS

export const roleEnum = pgEnum("role", ["Admin",
                                       "Doctor", "Nurse", "Receptionist",
                                       "Pharmacist", "LabTechnician", "Cashier",
                                       "ClinicManager", "Accountant", "Patient"]);

                                       
export const statusEnum = pgEnum("status", ["deleted", "busy", "available"]);
export const genderEnum = pgEnum("gender", ["Male", "Female", "Other"]);
export const bloodGroupEnum = pgEnum("blood_group", ["O+", "A+", "AB+", "B+", "O-", "A-", "AB-", "B-"]);




// audit-log Table 

export const auditLogs = {
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at").defaultNow(),

   // COMPLIANCE SOFT DELETE FLAG : under testing   Tillya
  isDeleted: boolean("is_deleted").default(false).notNull(),

  // Adding ": any" to the arrow functions breaks the type inference loop
  createdBy: uuid("created_by").references((): any => UserTable.id),
  updatedBy: uuid("updated_by").references((): any => UserTable.id),
 deletedBy: uuid("deleted_by").references((): any => UserTable.id),
};





// 2. Address table

export const Address = pgTable("address", {
  id: uuid("id").primaryKey().defaultRandom(), // .defaultRandom() is standard for uuid in pg-core
  region: text("region").notNull(),
  district: text("district"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  PostalCode: text("Postal_code"),
  country: text("country").notNull(),
  ...auditLogs
});


//  CORE TABLES (User & Patient)

// 1. System Users Table like doctors, nurse
export const UserTable = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  secondName: text("second_name"),
  lastName: text("last_name").notNull(),
  email: text("email").unique().notNull(),
  phoneNumber: text("phone_number").notNull(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("Patient"),
  departmentId: uuid("department_id").references(() => Department.id),

  imagePath: text("image_path"),
  ...auditLogs,
});

// 2 . Patient TAbles

export const PatientTable = pgTable("patients", {
  id: uuid("patient_id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  gender: genderEnum("gender").notNull(),
  nhifCard: text("nhif_card").unique().notNull(),
  email: text("email").unique().notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  bloodGroup: bloodGroupEnum("blood_group").notNull(),
  phoneNumber: text("phone_number").notNull(),
  photoUrl: text("photo_url"),
  nationalId: text("national_id"),
  addressId: uuid("address_id").references(() => Address.id),
  ...auditLogs
});


// 4. THE PIVOT TABLE (Many-to-Many Junction)
///////////////////////////////////
/////////
/////////
///////////////////////////////////

export const userPatient = pgTable('user_patient', {
  userId: uuid('user_id').notNull().references(() => UserTable.id, { onDelete: 'cascade' }),
  patientsId: uuid('patients_id').notNull().references(() => PatientTable.id, { onDelete: 'cascade' }),

}, (t) => [
  primaryKey({ columns: [t.userId, t.patientsId] }) // Prevents duplicate linkages
]);


// 5. TOKEN TABLE (Refresh Tokens)
export const TokenTable = pgTable("tokens", {
  userId: uuid("user_id").notNull().references(() => UserTable.id, { onDelete: 'cascade' }),
  token: text("token").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
});


// 6. DRIZZLE RELATIONS (For relational query API)

export const userTableRelations = relations(UserTable, ({ many }) => ({
  userPatients: many(userPatient),
  tokens: many(TokenTable),
}));

export const patientTableRelations = relations(PatientTable, ({ many }) => ({
  userPatients: many(userPatient),
}));

export const userPatientRelations = relations(userPatient, ({ one }) => ({
  user: one(UserTable, {
    fields: [userPatient.userId],
    references: [UserTable.id],
  }),
  patient: one(PatientTable, {
    fields: [userPatient.patientsId],
    references: [PatientTable.id],
  }),
}));

export const tokenTableRelations = relations(TokenTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [TokenTable.userId],
    references: [UserTable.id],
  }),
}));



// 5. Appointment Table 



// Enums for strict status control
export const appointmentStatusEnum = pgEnum("appointment_status", ["scheduled", "confirmed", "checked_in", "completed", "cancelled", "no_show"]);
export const priorityEnum = pgEnum("appointment_priority", ["low", "medium", "high", "emergency"]);

export const AppointmentTable = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => PatientTable.id, { onDelete: 'cascade' }),
  doctorId: uuid("doctor_id").references(() => UserTable.id, { onDelete: 'set null' }),

  // core appointment fields:
  appointmentType: text("appointment_type").notNull(), // e.g., "Checkup", "Follow-up", "Surgery"
  priority: priorityEnum("priority").default("medium").notNull(),
  status: appointmentStatusEnum("status").default("scheduled").notNull(),
  reason: text("reason").notNull(),

  // Timing fields
  appointmentDate: timestamp("appointment_date").notNull(), // Date part
  appointmentTime: text("appointment_time").notNull(), // time string (e.g. "09:00")

  // Audit Logs (Who created/modified this specific appointment)
  ...auditLogs
});

// Doctor Schedules Table
export const DoctorScheduleTable = pgTable("doctor_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  doctorId: uuid("doctor_id").notNull().references(() => UserTable.id, { onDelete: 'cascade' }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: text("start_time").notNull(), // e.g., "08:00"
  endTime: text("end_time").notNull(), // e.g., "17:00"
  slotDurationMinutes: integer("slot_duration_minutes").default(30).notNull(),
  isWorkingDay: boolean("is_working_day").default(true).notNull(),
  ...auditLogs,
});

// Doctor Leaves Table
export const DoctorLeaveTable = pgTable("doctor_leaves", {
  id: uuid("id").primaryKey().defaultRandom(),
  doctorId: uuid("doctor_id").notNull().references(() => UserTable.id, { onDelete: 'cascade' }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  ...auditLogs,
});

// Appointment Audit Log Table
export const AppointmentAuditLogTable = pgTable("appointment_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id").notNull().references(() => AppointmentTable.id, { onDelete: 'cascade' }),
  action: text("action").notNull(), // e.g. "BOOKED", "RESCHEDULED", "CANCELLED", "STATUS_UPDATED"
  previousState: text("previous_state"),
  newState: text("new_state"),
  reason: text("reason"),
  performedBy: uuid("performed_by").references(() => UserTable.id),
  createdAt: timestamp("created_at").defaultNow(),
});





// 9. DEPARTMENT TABLE

// new table with self referencing and parent nullable by Tillya & Mtakati


export const Department = pgTable("department", {
  id: uuid("department_id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code"),
  location: text("location"),

  // Links to the patient (made nullable since a department exists independently of a single patient)
  patientId: uuid("patient_id")
    .references((): any => UserTable.id, { onDelete: "restrict" }),

  // Self-referencing foreign key for parent/sub-departments
  parentDepartmentId: uuid("parent_department_id")
    .references((): any => Department.id, { onDelete: "set null" }),

  ...auditLogs
});



// 6.user_appointment

////////////////////////////////////////////// :use of composite key 


export const userAppointment = pgTable('user_appointment', {
  userId: uuid('user_id')
    .notNull()
    .references(() => UserTable.id, { onDelete: 'cascade' }),
  appointmentId: uuid('appointment_id')
    .notNull()
    .references(() => AppointmentTable.id, { onDelete: 'cascade' }),

}, (t) => [
  // Creates a composite primary key to avoid duplicate assignments
  primaryKey({ columns: [t.userId, t.appointmentId] })
]);





//  relationships of the two tables 
export const useTableRelations = relations(UserTable, ({ many }) => ({
  userPatients: many(userPatient),
  userAppointments: many(userAppointment),
  schedules: many(DoctorScheduleTable),
  leaves: many(DoctorLeaveTable),
}));

// AppointmentTable relations to include users
export const appointmentTableRelations = relations(AppointmentTable, ({ one, many }) => ({
  patient: one(PatientTable, {
    fields: [AppointmentTable.patientId],
    references: [PatientTable.id],
  }),
  doctor: one(UserTable, {
    fields: [AppointmentTable.doctorId],
    references: [UserTable.id],
  }),
  userAppointments: many(userAppointment),
  auditLogs: many(AppointmentAuditLogTable),
}));

export const doctorScheduleRelations = relations(DoctorScheduleTable, ({ one }) => ({
  doctor: one(UserTable, {
    fields: [DoctorScheduleTable.doctorId],
    references: [UserTable.id],
  }),
}));

export const doctorLeaveRelations = relations(DoctorLeaveTable, ({ one }) => ({
  doctor: one(UserTable, {
    fields: [DoctorLeaveTable.doctorId],
    references: [UserTable.id],
  }),
}));

export const appointmentAuditLogRelations = relations(AppointmentAuditLogTable, ({ one }) => ({
  appointment: one(AppointmentTable, {
    fields: [AppointmentAuditLogTable.appointmentId],
    references: [AppointmentTable.id],
  }),
  performedByUser: one(UserTable, {
    fields: [AppointmentAuditLogTable.performedBy],
    references: [UserTable.id],
  }),
}));

//  the relations for the new Pivot Table
export const userAppointmentRelations = relations(userAppointment, ({ one }) => ({
  user: one(UserTable, {
    fields: [userAppointment.userId],
    references: [UserTable.id],
  }),
  appointment: one(AppointmentTable, {
    fields: [userAppointment.appointmentId],
    references: [AppointmentTable.id],
  }),
}));



// 7.Appointment-Department table

///////////use of composite key

export const departmentAppointment = pgTable('department_appointment', {
  departmentId: uuid('department_id')
    .notNull()
    .references(() => Department.id, { onDelete: 'cascade' }),
  appointmentId: uuid('appointment_id')
    .notNull()
    .references(() => AppointmentTable.id, { onDelete: 'cascade' }),


}, (t) => [
  // Composite primary key ensures a department can't be linked to the same appointment twice
  primaryKey({ columns: [t.departmentId, t.appointmentId] })
]);




// DRIZZLE RELATIONS DEFINITIONS

export const departmentRelations = relations(Department, ({ many }) => ({
  departmentAppointments: many(departmentAppointment),
}));
//redeclaration of appointment and departmnet -==================================== cause and error in line 173 
export const appointmentdeptTableRelations = relations(AppointmentTable, ({ many }) => ({
  departmentAppointments: many(departmentAppointment),
}));

export const departmentAppointmentRelations = relations(departmentAppointment, ({ one }) => ({
  department: one(Department, {
    fields: [departmentAppointment.departmentId],
    references: [Department.id],
  }),
  appointment: one(AppointmentTable, {
    fields: [departmentAppointment.appointmentId],
    references: [AppointmentTable.id],
  }),
}));




///////////////////////////////////////////////////////////////////////////////////////











// 9. Table Vitals 


export const VitalsTable = pgTable("vitals", {
  id: uuid("id").primaryKey().defaultRandom(),

  // 1. Patient Reference (Foreign Key)
  patientId: uuid("patient_id")
    .notNull()
    .references(() => PatientTable.id, { onDelete: 'cascade' }),

  //=============================================================  real instead of doublePrecision

  // 2. Clinical Metrics (Using doublePrecision for floats and integer for whole numbers)
  temperature: doublePrecision("temperature"),              // e.g., 36.6 °C
  bloodPressureSystolic: integer("blood_pressure_systolic"),  // e.g., 120 mmHg
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),// e.g., 80 mmHg
  heartRate: integer("heart_rate"),                          // e.g., 72 bpm
  respiratoryRate: integer("respiratory_rate"),              // e.g., 16 rpm
  oxygenSaturation: doublePrecision("oxygen_saturation"),    // e.g., 98.5 %
  weight: doublePrecision("weight"),                         // e.g., 70.5 kg
  height: doublePrecision("height"),                         // e.g., 175.2 cm

  ...auditLogs,
});





// 11.Consultation table


export const ConsultationTable = pgTable("consultation", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Structural Foreign Key References
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => UserTable.id), // Tracks the attending doctor
  patientId: uuid("patient_id")
    .notNull()
    .references(() => PatientTable.id, { onDelete: 'cascade' }),

  //  Clinical History & Subjective Data
  chiefComplaint: text("chief_complaint").notNull(),
  historyOfPresentIllness: text("history_of_present_illness").notNull(),
  medicalHistory: text("medical_history"),

  // 3. Objective & Assessment Data
  physicalExamination: text("physical_examination"), // Doctor's observational notes/findings
  preliminaryDiagnosis: text("preliminary_diagnosis"), // Initial working medical impression

  // Plan Data
  investigationRequirements: text("investigation_requirements"), // Ordered labs, X-rays, scans, etc.

  // System Tracking
  ...auditLogs
});





// 10 . THE DIAGNOSIS TABLE

export const DiagnosisTable = pgTable("diagnosis", {
  id: uuid("id").primaryKey().defaultRandom(),

  // 1. Patient ID Reference
  patientId: uuid("patient_id")
    .notNull()
    .references(() => PatientTable.id, { onDelete: 'cascade' }),

  // 2. User ID Reference (The doctor/practitioner logging the diagnosis)
  //   userId: uuid("user_id")
  //     .notNull()
  //     .references(() => UserTable.id),


  // 3. Consultation ID Reference
  consultationId: uuid("consultation_id")
    .notNull()
    .references(() => ConsultationTable.id, { onDelete: 'cascade' }),

  // Medical core properties
  //   diagnosisCode: text("diagnosis_code").notNull(), // e.g., "ICD-10: J06.9"
  //   description: text("description").notNull(),    // e.g., "Acute upper respiratory infection"
  //   notes: text("notes"),                          // Additional practitioner comments
  //   ...auditLogs
});



// 12.lab_test
//=========================Type is not linked to Status Free makes universal type-id per test 

export const labTests = pgTable("lab_tests", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Connects to your central lookup table to manage specific test types dynamically
  typeId: text("type").notNull(),

  code: text("code"),

  // Stored as numeric for exact decimal precision (e.g., 99.99)
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),

  ...auditLogs, // Injects your 6 audit tracking fields automatically
});

// 13.diagnosis_labtest

//==========================================    Composite keys

export const DiagnosisLabTestsTable = pgTable("diagnosis_lab_tests", {
  // Foreign Keys
  labTestId: uuid("lab_test_id")
    .references((): any => labTests.id, { onDelete: "cascade" })
    .notNull(),

  diagnosisId: uuid("diagnosis_id")
    .references((): any => DiagnosisTable.id, { onDelete: "cascade" })
    .notNull(),

  patientId: uuid("patient_id")
    .references((): any => PatientTable.id, { onDelete: "cascade" })
    .notNull(),

  // Data field for text results
  results: text("results"),

  // ...auditLogs, // Spreads your 6 audit fields automatically
}, (table) => {
  return {
    // Creates a composite primary key using all three IDs to ensure unique entries
    pk: primaryKey({ columns: [table.labTestId, table.diagnosisId, table.patientId] }),
  };
});


// 14.percscriptions

export const PrescriptionsTable = pgTable("prescriptions", {
  id: uuid("perscription_id").primaryKey().defaultRandom(),

  // Both point to UserTable.id, using ": any" to prevent TypeScript circular type errors
  patientId: uuid("patient_id")
    .references((): any => PatientTable.id, { onDelete: "restrict" })
    .notNull(),

  doctorId: uuid("doctor_id")
    .references((): any => UserTable.id, { onDelete: "restrict" })
    .notNull(),

  notes: text("notes"),

  // References your central lookup status system
  statusId: uuid("status_id")
    .references((): any => StatusTable.id)
    .notNull(),

  ...auditLogs, // Automatically injects your 6 core audit columns
});


// 15 . Diagnosis_user 

//=====================================   Beware composite keys  by Tillya

export const DiagnosisUserTable = pgTable("diagnosis_user", {
  userId: uuid("user_id")
    .references((): any => UserTable.id, { onDelete: "cascade" })
    .notNull(),

  diagnosisId: uuid("diagnosis_id")
    .references((): any => DiagnosisTable.id, { onDelete: "cascade" })
    .notNull(),

  ...auditLogs, // Instantly injects your 6 audit tracking columns
}, (table) => {
  return {
    // Composite primary key to prevent duplicate user-to-diagnosis connections
    pk: primaryKey({ columns: [table.userId, table.diagnosisId] }),
  };
});


// 16. perscription_items

export const PrescriptionItemsTable = pgTable("prescription_items", {
  id: uuid("prescription_items_id").primaryKey().defaultRandom(),

  // Connects to the parent prescription; deletes items if prescription is deleted
  prescriptionId: uuid("prescription_id")
    .references((): any => PrescriptionsTable.id, { onDelete: "cascade" })
    .notNull(),

  // Connects to your medicines lookup table
  medicineId: uuid("medicine_id")
    .references((): any => MedicinesTable.id, { onDelete: "restrict" })
    .notNull(),

  dosage: varchar("dosage", { length: 255 }).notNull(), // e.g., "500mg" or "2 tablets"

  frequency: numeric("frequency", { precision: 5, scale: 2 }).notNull(), // e.g., 3 (times a day) or 0.5 (every other day)

  durationOfTime: text("duration_of_time").notNull(), // e.g., "7 days", "2 weeks"

  quantity: integer("quantity").notNull(), // Total number of pills/bottles to dispense

  instruction: text("instruction"), // e.g., "Take after meals"

  ...auditLogs, // Automatically injects your 6 core audit columns
});


// 17. medicine Table 

//=========================================================Stock must be identified 

export const MedicinesTable = pgTable("medicines", {
  id: uuid("medicine_id").primaryKey().defaultRandom(),

  // Dynamic status reference (e.g., 'in_stock', 'discontinued', 'reorder')
  statusId: uuid("status_id")
    .references((): any => StatusTable.id)
    .notNull(),

  code: text("code").notNull().unique(), // Unique identifier or barcode scan data

  genericName: text("generic_name").notNull(), // e.g., "Paracetamol"

  drugName: text("drug_name").notNull(), // Brand name, e.g., "Panadol"

  dosageForm: text("dosage_form").notNull(), // e.g., "Tablet", "Capsule", "Syrup"

  strength: text("strength").notNull(), // e.g., "500mg", "10mg/ml"

  // Stored as numeric for exact decimal precision to avoid floating-point math bugs
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),

  // Whole number for stock counts
  stock: integer("stock").default(0).notNull(),

  ...auditLogs, // Automatically injects your 6 core audit columns
});


// 18. Invoice tables.

export const InvoiceTable = pgTable("invoice", {
  id: uuid("invoice_id").primaryKey().defaultRandom(),

  // Unique human-readable invoice reference identifier (e.g., "INV-2026-0001")
  invoiceNumber: text("invoice_number").notNull().unique(),

  // Connects the invoice to the patient; prevents profile deletion if invoices exist
  patientId: uuid("patient_id")
    .references((): any => UserTable.id, { onDelete: "restrict" })
    .notNull(),

  // Dynamic status reference (e.g., "Draft", "Sent", "Paid", "Partially Paid", "Voided")
  statusId: uuid("status_id")
    .references((): any => StatusTable.id)
    .notNull(),

  ...auditLogs, // Automatically injects your 6 core audit columns
});



// 19 .Invoice_Items 
//type column : is flexible not linked to statusTable


export const InvoiceItemsTable = pgTable("invoice_items", {
  id: uuid("invoice_item_id").primaryKey().defaultRandom(),

  // Links items to the parent invoice. If invoice is deleted, its items are deleted automatically.
  invoiceId: uuid("invoice_id")
    .references((): any => InvoiceTable.id, { onDelete: "cascade" })
    .notNull(),

  serviceName: text("service_name").notNull(), // e.g., "Blood Panel Test", "Consultation Fee"

  // Categorizes the item type dynamically via your central lookup table
  type: text("description"),

  description: text("description"), // Optional notes about the specific charge

  // Stored as numeric for precise financial math to prevent rounding errors
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),

  ...auditLogs, // Automatically injects your 6 core audit columns
});


// 20. invoice-ivoice-items

//USED COMPOSITE KEYS by Tillya

export const InvoiceInvoiceItemsTable = pgTable("invoice_invoice_items", {
  invoiceId: uuid("invoice_id")
    .references((): any => InvoiceTable.id, { onDelete: "cascade" })
    .notNull(),

  invoiceItemId: uuid("invoice_item_id")
    .references((): any => InvoiceItemsTable.id, { onDelete: "cascade" })
    .notNull(),

  ...auditLogs, // Automatically tracks who linked these items and when
}, (table) => {
  return {
    // Composite key ensures you can't link the same item to the same invoice twice
    pk: primaryKey({ columns: [table.invoiceId, table.invoiceItemId] }),
  };
});


// 21.payments table

export const PaymentsTable = pgTable("payments", {
  id: uuid("payment_id").primaryKey().defaultRandom(),

  // Unique payment reference code (e.g., Transaction ID from Stripe/M-Pesa/Bank)
  referenceNumber: text("reference_number").notNull().unique(),

  // Dynamic status reference (e.g., "Success", "Failed", "Refunded")
  statusId: uuid("status_id")
    .references((): any => StatusTable.id)
    .notNull(),

  // Dynamic payment type reference (e.g., "Invoice Settlement", "Advance Deposit")
  typeId: uuid("type_id")
    .references((): any => StatusTable.id)
    .notNull(),

  // Dynamic method reference (e.g., "Cash", "Credit Card", "Mobile Money", "Insurance")
  methodId: uuid("method_id")
    .references((): any => StatusTable.id)
    .notNull(),

  // Explicitly nullable for over-the-counter or guest transactions
  patientId: uuid("patient_id")
    .references((): any => UserTable.id, { onDelete: "restrict" }),

  // Stored as numeric to safeguard currency calculations against precision drift
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),

  // Name of the person making the payment (useful if an insurance or relative pays)
  payee: text("payee").notNull(),

  ...auditLogs, // Automatically injects your 6 core audit columns
});


// 22.statuses

///////////////////////////////////////Tillya how should This be managed 

//=============================================Heavy documentation affects many tables 

export const StatusTable = pgTable("statuses", {
  id: uuid("status_id").primaryKey().defaultRandom(),

  name: text("name").notNull().unique(), // e.g., "completed", "failed", "scheduled"

  // Categorizes the status so you can filter it by table type in your frontend APIs
  groupType: text("group_type").notNull(), // e.g., "payment", "appointment", "lab_test"

  ...auditLogs,
});


// 23 .payments_types
export const PaymentTypesTable = pgTable("payment_types", {
  id: uuid("payment_types_id").primaryKey().defaultRandom(),

  // The name of the payment type (e.g., "Partial Payment", "Full Settlement", "Refund")
  name: text("name").notNull().unique(),

  ...auditLogs, // Automatically injects your 6 core audit columns
});


// 24.payment_method

export const PaymentMethodTable = pgTable("payment_method", {
  id: uuid("payment_method_id").primaryKey().defaultRandom(),

  // The name of the payment method (e.g., "Cash", "M-Pesa", "Stripe", "Visa")
  name: text("name").notNull().unique(),

  ...auditLogs, // Automatically injects your 6 core audit columns
});


// 25. insurance_companies 

//=============================================================We will need more improvements

export const InsuranceCompaniesTable = pgTable("insurance_companies", {
  id: uuid("insurance_companies_id").primaryKey().defaultRandom(),

  // The name of the company (e.g., "Aetna", "Blue Cross", "NHIF")
  name: text("name").notNull().unique(),

  // Official corporate registration or license number
  regNumber: text("reg_number").notNull().unique(),

  // Dynamic insurance category via lookup table (e.g., "Private", "Government State", "Corporate Package")
  typeId: uuid("type_id")
    .references((): any => StatusTable.id)
    .notNull(),

  // Dynamic status reference via lookup table (e.g., "Active", "Suspended", "Under Review")
  statusId: uuid("status_id")
    .references((): any => StatusTable.id)
    .notNull(),

  ...auditLogs, // Automatically injects your 6 core audit columns
});


// 26. patients-insurances

export const PatientInsurancesTable = pgTable("patient_insurances", {
  id: uuid("patient_insurance_id").primaryKey().defaultRandom(),

  // Connects the insurance plan to the patient
  patientId: uuid("patient_id")
    .references((): any => UserTable.id, { onDelete: "cascade" })
    .notNull(),

  // Connects to the insurance provider company
  insuranceCompanyId: uuid("insurance_company_id")
    .references((): any => InsuranceCompaniesTable.id, { onDelete: "restrict" })
    .notNull(),

  // Dynamic status reference (e.g., "Active", "Expired", "Suspended", "Terminated")
  statusId: uuid("status_id")
    .references((): any => StatusTable.id)
    .notNull(),

  ...auditLogs, // Automatically injects your 6 core audit columns
});

// 27. wards

export const WardsTable = pgTable("wards", {
  id: uuid("ward_id").primaryKey().defaultRandom(),

  name: text("name").notNull(), // e.g., "Maternity Ward", "Intensive Care Unit"

  wardNumber: text("ward_number").notNull().unique(), // e.g., "WARD-3A", "ICU-02"

  location: text("location").notNull(), // e.g., "Wing B, 3rd Floor"

  // Dynamic ward type category via your lookup system (e.g., "General", "ICU", "Pediatric", "Isolation")
  typeId: text("Ward_type"),

  capacity: integer("capacity").notNull(), // Maximum number of beds available in this ward

  description: text("description"), // Optional notes about special equipment or specialties

  ...auditLogs, // Automatically injects your 6 core audit columns
});

// 28. Beds

export const BedsTable = pgTable("beds", {
  id: uuid("bed_id").primaryKey().defaultRandom(),

  // Unique identification code for the bed (e.g., "BED-101-A")
  bedNumber: text("bed_number").notNull().unique(),

  // Dynamic status reference (e.g., "Available", "Occupied", "Cleaning", "Maintenance")
  statusId: uuid("status_id")
    .references((): any => StatusTable.id)
    .notNull(),

  // Connects the bed to its parent ward. Deleting a ward clears out its beds.
  wardId: uuid("ward_id")
    .references((): any => WardsTable.id, { onDelete: "cascade" })
    .notNull(),

  // Dynamic type reference (e.g., "Standard Manual", "Electric ICU", "Pediatric Crib")
  typeId: text("Bed_type"),

  // Connects the bed to a specific room layout (optional/nullable if beds map directly to the ward)
  roomId: uuid("room_id")
    .references((): any => RoomsTable.id, { onDelete: "set null" }),

  ...auditLogs, // Automatically injects your 6 core audit columns
});


// 29 . Rooms
export const RoomsTable = pgTable("rooms", {
  id: uuid("room_id").primaryKey().defaultRandom(),

  // Unique identification code for the room (e.g., "ROOM-302", "ICU-RM-1")
  roomNumber: text("room_number").notNull().unique(),

  description: text("description"), // Optional notes (e.g., "Equipped with oxygen wall ports")

  // Connects the room to its parent ward. Deleting a ward clears out its rooms.
  wardId: uuid("ward_id")
    .references((): any => WardsTable.id, { onDelete: "cascade" })
    .notNull(),

  // Dynamic type reference via lookup system (e.g., "Private Single", "Semi-Private Double", "Isolation")
  typeId: text("Room_type"),

  // Dynamic status reference via lookup system (e.g., "Operational", "Undergoing Cleaning", "Locked")
  statusId: uuid("status_id")
    .references((): any => StatusTable.id)
    .notNull(),

  ...auditLogs, // Automatically injects your 6 core audit columns
});


//31 . DOCUMENT UPLOAD 


export const PatientDocuments = pgTable("patient_documents", {
  
  id: uuid("id").primaryKey().defaultRandom(),

  patientId: uuid("patient_id")
    .notNull()
    .references(() => PatientTable.id, { onDelete: "cascade" }),

  // (Mfano: "bima_card.jpg" au "vipimo.pdf")
  documentName: text("document_name").notNull(),

  // (Mfano: "uploads/documents/17188293.jpg")
  fileUrl: text("file_url").notNull(),

  // (Mfano: "image/jpeg", "image/png", "application/pdf")
  mimeType: text("mime_type").notNull(),

  // (Mfano: "450.5 KB" au "2.1 MB")
  fileSize: text("file_size").notNull(),

  ...auditLogs
});


