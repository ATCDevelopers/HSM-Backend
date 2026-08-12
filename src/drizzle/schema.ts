import { pgTable, pgEnum, uuid, text, timestamp, boolean, integer, primaryKey , doublePrecision} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';


// 1. ENUMS DEFINITIONS

export const statusEnum = pgEnum("status", ["deleted", "busy", "available"]);
export const genderEnum = pgEnum("gender", ["Male", "Female", "Other"]);
export const bloodGroupEnum = pgEnum("blood_group", ["O+", "A+", "AB+", "B+", "O-", "A-", "AB-", "B-"]);


// 2. Address table



export const Address = pgTable("address", {
  id: uuid("id").primaryKey().defaultRandom(), // .defaultRandom() is standard for uuid in pg-core
  region: text("region").notNull(),
  district: text("district"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull(),
});


// 3. CORE TABLES (User & Patient)

export const UserTable = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), 
  firstName: text("first_name").notNull(), 
  lastName: text("last_name").notNull(), 
  email: text("email").unique().notNull(),
  phoneNumber: text("phone_number").notNull(), 
  password: text("password").notNull(),
  departmentId: uuid("department_id").references(() => Department.id), 
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by"), 
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  updatedBy: integer("updated_by"), 
  deletedAt: timestamp("deleted_at"),
  deletedBy: integer("deleted_by"), 
  imagePath: text("image_path"),
  status: statusEnum("status").default("available"), 
});

export const PatientTable = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
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
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by"), 
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()), // fixed syntax
  updatedBy: integer("updated_by"), 
  deletedAt: timestamp("deleted_at"),
  deletedBy: integer("deleted_by"), 
});


// 4. THE PIVOT TABLE (Many-to-Many Junction)

export const userPatient = pgTable('user_patient', {
  userId: uuid('user_id').notNull().references(() => UserTable.id, { onDelete: 'cascade' }),
  patientsId: uuid('patients_id').notNull().references(() => PatientTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.patientsId] }) // Prevents duplicate linkages
]);


// 5. DRIZZLE RELATIONS (For relational query API)

export const userTableRelations = relations(UserTable, ({ many }) => ({
  userPatients: many(userPatient),
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



// 5. Appointment Table 



// Enums for strict status control
export const appointmentStatusEnum = pgEnum("appointment_status", ["scheduled", "completed", "cancelled", "no_show"]);
export const priorityEnum = pgEnum("appointment_priority", ["low", "medium", "high", "emergency"]);

export const AppointmentTable = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => PatientTable.id, { onDelete: 'cascade' }),
  
  // core appointment fields:
  appointmentType: text("appointment_type").notNull(), // e.g., "Checkup", "Follow-up", "Surgery"
  priority: priorityEnum("priority").default("medium").notNull(),
  status: appointmentStatusEnum("status").default("scheduled").notNull(),
  reason: text("reason").notNull(),
  
  // Timing fields
  appointmentDate: timestamp("appointment_date").notNull(), // Date part
  appointmentTime: text("appointment_time").notNull(), // time string
  
  // Audit Logs (Who created/modified this specific appointment)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: uuid("created_by"), // References a user ID
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  updatedBy: uuid("updated_by"),
});




// 9. DEPARTMENT TABLE
export const Department = pgTable("department", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code"),             // Nullable field 
  location: text("location"),     // (No .notNull())
});




 // 6.user_appointment
export const userAppointment = pgTable('user_appointment', {
  userId: uuid('user_id')
    .notNull()
    .references(() => UserTable.id, { onDelete: 'cascade' }),
  appointmentId: uuid('appointment_id')
    .notNull()
    .references(() => AppointmentTable.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (t) => [
  // Creates a composite primary key to avoid duplicate assignments
  primaryKey({ columns: [t.userId, t.appointmentId] })
]);





//  relationships of the two tables 
export const useTableRelations = relations(UserTable, ({ many }) => ({
  userPatients: many(userPatient),
  userAppointments: many(userAppointment), // Added link
}));

// AppointmentTable relations to include users
export const appointmentTableRelations = relations(AppointmentTable, ({ one, many }) => ({
  patient: one(PatientTable, {
    fields: [AppointmentTable.patientId],
    references: [PatientTable.id],
  }),
  userAppointments: many(userAppointment), // Added link
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

export const departmentAppointment = pgTable('department_appointment', {
  departmentId: uuid('department_id')
    .notNull()
    .references(() => Department.id, { onDelete: 'cascade' }),
  appointmentId: uuid('appointment_id')
    .notNull()
    .references(() => AppointmentTable.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
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
  
  // 3. Metadata & Audit Logs
  recordedBy: uuid("recorded_by")
    .notNull()
    .references(() => UserTable.id), 
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});





// 10 . THE DIAGNOSIS TABLE

export const DiagnosisTable = pgTable("diagnosis", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // 1. Patient ID Reference
  patientId: uuid("patient_id")
    .notNull()
    .references(() => PatientTable.id, { onDelete: 'cascade' }),
    
  // 2. User ID Reference (The doctor/practitioner logging the diagnosis)
  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id),
    
  // 3. Consultation ID Reference
  consultationId: uuid("consultation_id")
    .notNull()
    .references(() => ConsultationTable.id, { onDelete: 'cascade' }),
    
  // Medical core properties
  diagnosisCode: text("diagnosis_code").notNull(), // e.g., "ICD-10: J06.9"
  description: text("description").notNull(),    // e.g., "Acute upper respiratory infection"
  notes: text("notes"),                          // Additional practitioner comments
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

