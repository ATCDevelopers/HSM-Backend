import { db } from "../config/db.js"; // Adjust import to your drizzle db instance
import { labTests, labTestTemplates, labOrders, labTestResults, labSampleTypes, StatusTable } from "../drizzle/schema.js";
import { PatientTable } from "../drizzle/schema.js";
import { UserTable } from "../drizzle/schema.js";
import { eq, and, desc } from "drizzle-orm";

/**
 * 1. Inserts a new base test item into the database catalog (Updated with sampleTypeId)
 */
export async function insertLabTest(data: {
  name: string;
  code: string;
  department: string;
  price: string;
  sampleTypeId: string;
}) {
  const [newTest] = await db
    .insert(labTests)
    .values({
      name: data.name,
      code: data.code,
      department: data.department,
      price: data.price,
      sampleTypeId: data.sampleTypeId,
    })
    .returning();
  return newTest || null;
}

/**
 * 2. Finds a single lab test profile by its primary key
 */
export async function findTestById(labTestId: string) {
  const [test] = await db
    .select()
    .from(labTests)
    .where(eq(labTests.id, labTestId));
  return test || null;
}

/**
 * 3. Registers or pushes a new dynamic configuration template form
 */
export async function insertOrUpdateTemplate(data: {
  labTestId: string;
  fields: any;
  version: string;
}) {
  const [newTemplate] = await db
    .insert(labTestTemplates)
    .values({
      labTestId: data.labTestId,
      fields: data.fields,
      version: data.version,
    })
    .returning();
  return newTemplate || null;
}

/**
 * 4. Places a fresh clinical lab diagnostic tracking order row (Updated to expect Status Table IDs)
 */
export async function insertOrder(data: {
  patientId: string;
  labTestId: string;
  orderedBy: string;
  orderStatusId: string;
  sampleStatusId: string;
  clinicalNotes?: string;
}) {
  const [newOrder] = await db
    .insert(labOrders)
    .values({
      patientId: data.patientId,
      labTestId: data.labTestId,
      orderedBy: data.orderedBy,
      orderStatusId: data.orderStatusId,
      sampleStatusId: data.sampleStatusId,
      clinicalNotes: data.clinicalNotes,
    })
    .returning();
  return newOrder || null;
}

/**
 * 5. Locates an existing order structure context by its unique identifier
 */
export async function findOrderById(orderId: string) {
  const [order] = await db
    .select()
    .from(labOrders)
    .where(eq(labOrders.id, orderId));
  return order || null;
}

/**
 * 6. Fetches the active dynamic field configuration blueprint template map
 */
export async function getActiveTemplateByTestId(labTestId: string) {
  const [latestTemplate] = await db
    .select()
    .from(labTestTemplates)
    .where(eq(labTestTemplates.labTestId, labTestId))
    .orderBy(desc(labTestTemplates.version))
    .limit(1); 
    
  return latestTemplate || null;
}

/**
 * 7. EXPERT WORKFLOW: Marks a sample as "Received" inside the laboratory
 */
export async function markSampleAsReceivedTransaction(orderId: string, receivedOrderStatusId: string, collectedSampleStatusId: string, loggedInUserId: string) {
  return await db.transaction(async (tx) => {
    const [updatedOrder] = await tx
      .update(labOrders)
      .set({
        orderStatusId: receivedOrderStatusId,   // Points to "processing" in StatusTable
        sampleStatusId: collectedSampleStatusId, // Points to "collected" or "received" in StatusTable
        collectedBy: loggedInUserId,
        collectedAt: new Date(),
        sampleBarCode: `BAR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, // Generate sample identifier label
        updatedAt: new Date()
      })
      .where(eq(labOrders.id, orderId))
      .returning();

    return updatedOrder || null;
  });
}

/**
 * 8. CORE TRANSACTION: Saves dynamic results and advances order status to checking stages
 */
export async function saveDynamicResultsTransaction(data: {
  orderId: string;
  templateId: string;
  capturedData: Record<string, any>;
  flaggedAbnormalKeys: string[];
  processingStatusId: string; // The StatusTable ID representing workflow in progress
  technicianNotes?: string;
  performedBy: string;
}) {
  return await db.transaction(async (tx) => {
    const [savedResults] = await tx
      .insert(labTestResults)
      .values({
        orderId: data.orderId,
        templateId: data.templateId,
        capturedData: data.capturedData,
        flaggedAbnormalKeys: data.flaggedAbnormalKeys,
        technicianNotes: data.technicianNotes,
        performedBy: data.performedBy,
      })
      .returning();

    await tx
      .update(labOrders)
      .set({ orderStatusId: data.processingStatusId })
      .where(eq(labOrders.id, data.orderId));

    return savedResults;
  });
}

/**
 * 9. Appends clinical authentication sign-off parameters and updates order lifecycle to 'completed'
 */
export async function updateVerificationStatus(data: {
  orderId: string;
  verifiedBy: string;
  completedStatusId: string; // The StatusTable ID representing 'completed'
  completedAt: Date;
}): Promise<boolean> {
  return await db.transaction(async (tx) => {
    const resultUpdate = await tx
      .update(labTestResults)
      .set({
        verifiedBy: data.verifiedBy,
        completedAt: data.completedAt,
      })
      .where(eq(labTestResults.orderId, data.orderId))
      .returning({ id: labTestResults.id });

    if (resultUpdate.length === 0) return false;

    await tx
      .update(labOrders)
      .set({ orderStatusId: data.completedStatusId })
      .where(eq(labOrders.id, data.orderId));

    return true;
  });
}

/**
 * 10. DEEP DATA JOIN: Securely compiles an unmixed lab report with sample and status names (Doctor Tracking Engine)
 */
export async function getDoctorPatientReport(safeOrderId: string, safeDoctorId: string) {
  // Alias StatusTable instances if needed, or join simply to fetch names dynamically
  const [report] = await db
    .select({
      orderId: labOrders.id,
      orderStatusName: StatusTable.name, // Pull dynamic human-readable status text string
      clinicalNotes: labOrders.clinicalNotes,
      orderedAt: labOrders.orderedAt,
      sampleBarCode: labOrders.sampleBarCode,
      collectedAt: labOrders.collectedAt,
      
      patient: {
        id: PatientTable.id,
        firstName: PatientTable.firstName,
        lastName: PatientTable.lastName,
        phoneNumber: PatientTable.phoneNumber,
        nhifCard: PatientTable.nhifCard,
        dateOfBirth: PatientTable.dateOfBirth // Needed for the sample labels criteria
      },
      
      doctor: {
        id: UserTable.id,
        firstName: UserTable.firstName,
        lastName: UserTable.lastName,
      },
      
      test: {
        name: labTests.name,
        code: labTests.code,
        price: labTests.price,
        panelCategory: labTests.department
      },
      
      sampleType: {
        name: labSampleTypes.name,
        code: labSampleTypes.code
      },
      
      results: labTestResults.capturedData,
      flaggedAlerts: labTestResults.flaggedAbnormalKeys,
      completedAt: labTestResults.completedAt
    })
    .from(labOrders)
    .innerJoin(PatientTable, eq(labOrders.patientId, PatientTable.id))
    .innerJoin(labTests, eq(labOrders.labTestId, labTests.id))
    .innerJoin(labSampleTypes, eq(labTests.sampleTypeId, labSampleTypes.id)) // Added sample type lookup integration
    .innerJoin(UserTable, eq(labOrders.orderedBy, UserTable.id))
    .innerJoin(StatusTable, eq(labOrders.orderStatusId, StatusTable.id)) // Linked directly to lookups configuration
    .leftJoin(labTestResults, eq(labTestResults.orderId, labOrders.id))
    .where(
      and(
        eq(labOrders.id, safeOrderId),
        eq(labOrders.orderedBy, safeDoctorId) 
      )
    );

  return report || null;
}



 //  PART 2: ADVANCED MEDICAL PANEL & SPECIMEN WORKFLOWS
 

/**
 * 7. WORKFLOW STEP: Fetches data needed to print physical barcode labels for a sample
 * Combines patient name, age (DOB), and the precise dynamic sample medium required.
 */
export async function getSampleLabelData(orderId: string) {
  const [labelInfo] = await db
    .select({
      orderId: labOrders.id,
      sampleBarCode: labOrders.sampleBarCode,
      orderedAt: labOrders.orderedAt,
      patient: {
        firstName: PatientTable.firstName,
        lastName: PatientTable.lastName,
        dateOfBirth: PatientTable.dateOfBirth,
        gender: PatientTable.gender
      },
      sampleType: {
        name: labSampleTypes.name,
        code: labSampleTypes.code,
        containerDescription: labSampleTypes.description
      },
      testName: labTests.name,
      departmentPanel: labTests.department
    })
    .from(labOrders)
    .innerJoin(PatientTable, eq(labOrders.patientId, PatientTable.id))
    .innerJoin(labTests, eq(labOrders.labTestId, labTests.id))
    .innerJoin(labSampleTypes, eq(labTests.sampleTypeId, labSampleTypes.id))
    .where(eq(labOrders.id, orderId));

  return labelInfo || null;
}

/**
 * 8. DEPARTMENT PANELS: Fetches all available tests grouped into a medical panel 
 * Example: Pulling all tests belonging to "Microbiology"
 */
export async function findTestsByDepartmentPanel(departmentName: string) {
  return await db
    .select({
      testId: labTests.id,
      testName: labTests.name,
      code: labTests.code,
      price: labTests.price,
      isAvailable: labTests.isAvailable,
      sampleRequired: labSampleTypes.name
    })
    .from(labTests)
    .innerJoin(labSampleTypes, eq(labTests.sampleTypeId, labSampleTypes.id))
    .where(eq(labTests.department, departmentName));
}

/**
 * 9. LAB WORKFLOW ACTION ("Received"): Staff marks sample as arrived in lab
 * Simultaneously updates both Order Tracking and Sample Tracking lifecycles.
 */
export async function markSampleAsReceivedTransactionStatus(orderId: string, loggedInUserId: string) {
  return await db.transaction(async (tx) => {
    // A. Grab the ID for "processing" status in lab_test group
    const [orderStatus] = await tx
      .select({ id: StatusTable.id })
      .from(StatusTable)
      .where(and(eq(StatusTable.name, "processing"), eq(StatusTable.groupType, "lab_test")));

    // B. Grab the ID for "collected" or "received" status in lab_sample group
    const [sampleStatus] = await tx
      .select({ id: StatusTable.id })
      .from(StatusTable)
      .where(and(eq(StatusTable.name, "collected"), eq(StatusTable.groupType, "lab_sample")));

    if (!orderStatus || !sampleStatus) {
      throw new Error("Required system configuration status mappings are missing inside StatusTable.");
    }

    // C. Commit the timestamp validation flags directly to the active order
    const [updatedOrder] = await tx
      .update(labOrders)
      .set({
        orderStatusId: orderStatus.id,
        sampleStatusId: sampleStatus.id,
        collectedBy: loggedInUserId,
        collectedAt: new Date(),
        sampleBarCode: `BAR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, // Auto generate a secure tracking label text
        updatedAt: new Date()
      })
      .where(eq(labOrders.id, orderId))
      .returning();

    return updatedOrder || null;
  });
}

/**
 * 10. LAB WORKFLOW ACTION ("Done"): Staff saves results and completes lifecycle
 * Stores the dynamic parameters and updates parent statuses into final signed states.
 */
export async function completeTestingWorkflowTransaction(data: {
  orderId: string;
  templateId: string;
  capturedData: Record<string, any>;
  flaggedAbnormalKeys: string[];
  performedBy: string;
  technicianNotes?: string;
}) {
  return await db.transaction(async (tx) => {
    // A. Query the final "completed" global row index from StatusTable
    const [finalStatus] = await tx
      .select({ id: StatusTable.id })
      .from(StatusTable)
      .where(and(eq(StatusTable.name, "completed"), eq(StatusTable.groupType, "lab_test")));

    if (!finalStatus) throw new Error("System configuration status mapping for 'completed' is missing.");

    // B. Persist the runtime medical result matrix
    const [savedResults] = await tx
      .insert(labTestResults)
      .values({
        orderId: data.orderId,
        templateId: data.templateId,
        capturedData: data.capturedData,
        flaggedAbnormalKeys: data.flaggedAbnormalKeys,
        technicianNotes: data.technicianNotes,
        performedBy: data.performedBy,
        completedAt: new Date()
      })
      .returning();

    // C. Close out the order entity tracking state completely
    await tx
      .update(labOrders)
      .set({
        orderStatusId: finalStatus.id,
        updatedAt: new Date()
      })
      .where(eq(labOrders.id, data.orderId));

    return savedResults;
  });
}

/**
 * 11. DOCTOR TRACKING ENGINE: Allows doctors to track status updates for all their ordered tests
 * Explicitly pulls human-readable status text names directly from StatusTable.
 */
export async function getDoctorOrderTrackingQueue(doctorId: string) {
  return await db
    .select({
      orderId: labOrders.id,
      patientName: {
        firstName: PatientTable.firstName,
        lastName: PatientTable.lastName
      },
      testName: labTests.name,
      departmentPanel: labTests.department,
      sampleName: labSampleTypes.name,
      sampleBarCode: labOrders.sampleBarCode,
      orderedAt: labOrders.orderedAt,
      orderTrackingStatus: StatusTable.name 
    })
    .from(labOrders)
    .innerJoin(PatientTable, eq(labOrders.patientId, PatientTable.id))
    .innerJoin(labTests, eq(labOrders.labTestId, labTests.id))
    .innerJoin(labSampleTypes, eq(labTests.sampleTypeId, labSampleTypes.id))
    .innerJoin(StatusTable, eq(labOrders.orderStatusId, StatusTable.id))
    .where(eq(labOrders.orderedBy, doctorId))
    .orderBy(desc(labOrders.orderedAt));





}


/* ==========================================================================
   PART 3: STANDARD CATALOG CRUD (CREATE, READ, UPDATE, SOFT DELETE)
   ========================================================================== */

/**
 * 12. CREATE: Registers a brand new lab test option into the active hospital catalog
 */
export async function createCatalogLabTest(data: {
  name: string;
  code: string;
  department: string;
  price: string;
  sampleTypeId: string;
}) {
  const [newTest] = await db
    .insert(labTests)
    .values({
      name: data.name,
      code: data.code.toUpperCase().trim(),
      department: data.department,
      price: data.price,
      sampleTypeId: data.sampleTypeId,
    })
    .returning();
  return newTest || null;
}

/**
 * 13. READ ACTIVE: Fetches all available tests that are NOT soft-deleted
 */
export async function getAllActiveCatalogTests() {
  return await db
    .select({
      id: labTests.id,
      name: labTests.name,
      code: labTests.code,
      department: labTests.department,
      price: labTests.price,
      isAvailable: labTests.isAvailable,
      sampleType: labSampleTypes.name
    })
    .from(labTests)
    .innerJoin(labSampleTypes, eq(labTests.sampleTypeId, labSampleTypes.id))
    .where(eq(labTests.isDeleted, false)); // Automatically filters out soft-deleted catalog items
}

/**
 * 14. UPDATE: Modifies details of an existing catalog item (e.g., price updates or description shifts)
 */
export async function updateCatalogLabTest(
  id: string, 
  data: { name?: string; department?: string; price?: string; isAvailable?: boolean; sampleTypeId?: string }
) {
  const [updatedTest] = await db
    .update(labTests)
    .set({
      ...data,
      updatedAt: new Date() // Explicit audit timestamp marker
    })
    .where(and(eq(labTests.id, id), eq(labTests.isDeleted, false)))
    .returning();
    
  return updatedTest || null;
}

/**
 * 15. SOFT DELETE: Safely flags a catalog item as hidden from active medical view without losing historic clinical records
 */
export async function softDeleteCatalogLabTest(id: string): Promise<boolean> {
  const result = await db
    .update(labTests)
    .set({ 
      isDeleted: true,
      deletedAt: new Date() // Compliance tracking timestamp
    })
    .where(eq(labTests.id, id))
    .returning({ deletedId: labTests.id });
    
  return result.length > 0;
}

/**
 * 16. DATA RECOVERY: Restores a soft-deleted lab test profile back into the active clinical pool
 */
export async function recoverDeletedCatalogLabTest(id: string): Promise<boolean> {
  const result = await db
    .update(labTests)
    .set({ 
      isDeleted: false,
      deletedAt: null 
    })
    .where(eq(labTests.id, id))
    .returning({ recoveredId: labTests.id });
    
  return result.length > 0;
}




















// import { db } from "../config/db.js"; // Direct global database import
// import { eq } from "drizzle-orm";
// import { labTests } from "../drizzle/schema.js";

// export const labTestRepository = {
//   /**
//    * Inserts a new laboratory test record into the database.
//    * Leverages Drizzle's strict type safety for insert payloads.
//    */
//   async create(data: typeof labTests.$inferInsert) {
//     const [result] = await db
//       .insert(labTests)
//       .values(data)
//       .returning();
//     return result;
//   },

//   /**
//    * Finds a single lab test by its unique UUID primary key.
//    */
//   async findById(id: string) {
//     const [result] = await db
//       .select()
//       .from(labTests)
//       .where(eq(labTests.id, id));
//     return result || null;
//   },

//   /**
//    * Finds a lab test by its unique institutional code string.
//    */
//   async findByCode(code: string) {
//     const [result] = await db
//       .select()
//       .from(labTests)
//       .where(eq(labTests.code, code));
//     return result || null;
//   },

//   /**
//    * Retrieves all laboratory tests from the database.
//    */
//   async findAll() {
//     return await db
//       .select()
//       .from(labTests);
//   },

//   /**
//    * Updates an existing lab test record matching the specific ID.
//    */
//   async update(id: string, data: Partial<typeof labTests.$inferInsert>) {
//     const [result] = await db
//       .update(labTests)
//       .set(data)
//       .where(eq(labTests.id, id))
//       .returning();
//     return result || null;
//   },

//   /**
//    * Hard deletes a lab test record from the table matching the target ID.
//    */
//   async delete(id: string) {
//     const [result] = await db
//       .delete(labTests)
//       .where(eq(labTests.id, id))
//       .returning();
//     return result || null;
//   }
// };

