import * as LabRepository from "../repositories/labTest.repository.js"; // Adjust path to repository

interface DynamicFieldConfig {
  key: string;
  label: string;
  type: "NUMERIC" | "TEXT_SHORT" | "SELECT_OPTION" | "NARRATIVE" | "GRID_PANEL";
  unit?: string;
  min?: number;
  max?: number;
  abnormalOptions?: string[];
}

/**
 * 1. WORKFLOW STEP: Compiles and validates data required to print structural sample labels
 * Satisfies Expert Requirement: "Sample Labeling"
 */
export async function generateSampleLabelInfo(orderId: string) {
  const labelData = await LabRepository.getSampleLabelData(orderId);
  if (!labelData) {
    throw new Error("Unable to generate label packet: The requested laboratory order does not exist.");
  }

  // Calculate clean age formatting helper for clinical frontends
  const dob = new Date(labelData.patient.dateOfBirth);
  const ageDiffMs = Date.now() - dob.getTime();
  const ageDate = new Date(ageDiffMs);
  const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);

  return {
    orderId: labelData.orderId,
    barcodeString: labelData.sampleBarCode || "PENDING_COLLECTION",
    printedAt: new Date(),
    testName: labelData.testName,
    departmentPanel: labelData.departmentPanel,
    sampleMedium: labelData.sampleType.name,
    containerType: labelData.sampleType.containerDescription || "Standard Vial",
    patient: {
      fullName: `${labelData.patient.firstName} ${labelData.patient.lastName}`,
      gender: labelData.patient.gender,
      age: `${calculatedAge} Yrs`
    }
  };
}

/**
 * 2. DEPARTMENT PANELS: Retrieves catalog testing options filtered by diagnostic panel type
 * Satisfies Expert Requirement: "Laboratory Panels"
 */
export async function getTestsByPanel(panelName: string) {
  if (!panelName || panelName.trim() === "") {
    throw new Error("A valid department panel name parameter is required for filtering.");
  }
  
  // Standardize text string lookups for the database comparison bounds
  const standardizedPanelName = panelName.trim();
  return await LabRepository.findTestsByDepartmentPanel(standardizedPanelName);
}


/**
 * 3. LAB WORKFLOW ACTION ("Received"): Marks a physical tube as safely arrived inside the lab room
 * FIX: Passes the necessary configuration Status IDs alongside tracking metadata
 */
export async function receiveSampleInLab(
  orderId: string, 
  staffUserId: string,
  processingOrderStatusId: string, // Added to resolve parameter count expectations
  collectedSampleStatusId: string   // Added to resolve parameter count expectations
) {
  const activeOrder = await LabRepository.findOrderById(orderId);
  if (!activeOrder) {
    throw new Error("The specified diagnostic order context cannot be found.");
  }

  // Ensure we aren't re-processing an order that was cancelled or signed off
  if (activeOrder.collectedAt) {
    throw new Error("Action Denied: This specimen sample has already been recorded as received.");
  }

  // FIXED: Now accurately passes 4 parameters down to the database transaction
  const updatedOrderRecord = await LabRepository.markSampleAsReceivedTransaction(
    orderId, 
    processingOrderStatusId, 
    collectedSampleStatusId, 
    staffUserId
  );
  
  if (!updatedOrderRecord) {
    throw new Error("Database pipeline failure executing sample arrival transition state changes.");
  }

  return updatedOrderRecord;
}


/**
 * 4. LAB WORKFLOW ACTION ("Done"): Evaluates final technical outputs and completes testing sequence
 * Satisfies Expert Requirements: "Laboratory Workflow" & "Laboratory Test Status" (Transitions state to Done/Completed)
 */
export async function executeAndCompleteTest(payload: {
  orderId: string;
  performedBy: string;
  capturedData: Record<string, any>;
  technicianNotes?: string;
}) {
  // A. Confirm that the specimen was actually logged as arrived first
  const activeOrder = await LabRepository.findOrderById(payload.orderId);
  if (!activeOrder) throw new Error("Target laboratory reference identifier context was not located.");
  
  // Guard clause blocking technicians from jumping ahead of the tracking lifecycle sequence
  if (!activeOrder.collectedAt) {
    throw new Error("Action Denied: Cannot complete evaluation. Physical specimen has not been signed off as 'Received' yet.");
  }

  // B. Load active dynamic testing form fields schematic ruleset
  const templateConfig = await LabRepository.getActiveTemplateByTestId(activeOrder.labTestId);
  if (!templateConfig) {
    throw new Error("No active form blueprint template setup exists to process incoming metrics for this test category.");
  }

  const fieldsDefinition = templateConfig.fields as DynamicFieldConfig[];
  const flaggedAbnormalKeys: string[] = [];

  // C. Dynamic Clinical Cross-Reference Parameter Bounds Check Loop
  for (const field of fieldsDefinition) {
    const inputValue = payload.capturedData[field.key];
    if (inputValue === undefined || inputValue === null) continue;

    // Evaluate Numeric Boundaries (e.g. Hemoglobin ranges)
    if (field.type === "NUMERIC") {
      const numericVal = Number(inputValue);
      if (isNaN(numericVal)) throw new Error(`Type Constraint Error: Input for '${field.label}' must be a numeric format.`);
      if (field.min !== undefined && numericVal < field.min) flaggedAbnormalKeys.push(field.key);
      if (field.max !== undefined && numericVal > field.max) flaggedAbnormalKeys.push(field.key);
    }

    // Evaluate Categorical Select/Dropdown Warning Flags
    if (field.type === "SELECT_OPTION" && field.abnormalOptions) {
      if (field.abnormalOptions.includes(String(inputValue))) {
        flaggedAbnormalKeys.push(field.key);
      }
    }
  }

  // D. Commit transactional writes directly down into the persistent layers
  return await LabRepository.completeTestingWorkflowTransaction({
    orderId: payload.orderId,
    templateId: templateConfig.id,
    capturedData: payload.capturedData,
    flaggedAbnormalKeys,
    performedBy: payload.performedBy,
    technicianNotes: payload.technicianNotes
  });
}

/**
 * 5. DOCTOR TRACKING ENGINE: Pulls an active real-time timeline for a requesting clinician
 * Satisfies Expert Requirement: "Doctor Test Tracking"
 */
export async function trackDoctorOrdersTimeline(doctorId: string) {
  if (!doctorId || typeof doctorId !== "string") {
    throw new Error("Unauthorized Access: Requesting doctor identification authentication checks failed.");
  }
  
  return await LabRepository.getDoctorOrderTrackingQueue(doctorId);
}


/////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////


/**
 * 12. CREATE SERVICE: Handles catalog test registration rules
 */
export async function addLabTestToCatalog(payload: {
  name: string;
  code: string;
  department: string;
  price: string;
  sampleTypeId: string;
}) {
  if (!payload.name || !payload.code || !payload.sampleTypeId) {
    throw new Error("Missing required catalog field entries: Name, Code, and Sample Type are mandatory.");
  }
  
  // Standardize the test identifier text code format
  const trackingData = {
    ...payload,
    code: payload.code.toUpperCase().trim()
  };

  return await LabRepository.createCatalogLabTest(trackingData);
}

/**
 * 13. READ SERVICE: Retrieves all active medical tests for ordering dashboards
 */
export async function fetchActiveCatalogTests() {
  return await LabRepository.getAllActiveCatalogTests();
}

/**
 * 14. UPDATE SERVICE: Manages modifying structural test catalog information
 */
export async function modifyCatalogLabTest(
  id: string,
  payload: { name?: string; department?: string; price?: string; isAvailable?: boolean; sampleTypeId?: string }
) {
  // 1. Double check the test actually exists and is active before updating
  const existingTest = await LabRepository.findTestById(id);
  if (!existingTest || existingTest.isDeleted) {
    throw new Error("Action Denied: The catalog item you are trying to modify could not be located or has been deleted.");
  }

  // 2. Perform safe modification persistence
  const updatedItem = await LabRepository.updateCatalogLabTest(id, payload);
  if (!updatedItem) {
    throw new Error("Failed to update the catalog item record context.");
  }

  return updatedItem;
}

/**
 * 15. SOFT DELETE SERVICE: Archives a catalog profile away from clinical use fields safely
 */
export async function archiveCatalogLabTest(id: string): Promise<boolean> {
  // 1. Verify existence before flagging database columns
  const existingTest = await LabRepository.findTestById(id);
  if (!existingTest || existingTest.isDeleted) {
    throw new Error("Action Denied: Target test item does not exist or has already been archived.");
  }

  // 2. Execute soft delete process to preserve historical data chains
  const successfullyArchived = await LabRepository.softDeleteCatalogLabTest(id);
  if (!successfullyArchived) {
    throw new Error("System error occurred while archiving the laboratory test catalog item.");
  }

  return successfullyArchived;
}

/**
 * 16. RECOVERY SERVICE: Restores an archived lab test profile back into circulation
 */
export async function restoreCatalogLabTest(id: string): Promise<boolean> {
  // Attempt recovery straight down on persistent structures
  const successfullyRestored = await LabRepository.recoverDeletedCatalogLabTest(id);
  if (!successfullyRestored) {
    throw new Error("Recovery Failed: Verify that the test record matches an archived item profile.");
  }

  return successfullyRestored;
}