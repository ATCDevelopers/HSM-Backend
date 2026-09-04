import { Request, Response } from "express";
import * as LabService from "../services/labTest.service.js"; // Adjust path to your service file

/**
 * 1. HTTP GET: Compiles data to generate and print a physical sample barcode label
 * URL: GET /api/lab-orders/:id/label
 * Access: Lab Staff / Phlebotomist / Nurse
 */
export async function getSampleLabel(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ success: false, error: "A valid Order ID route string is required." });
    }

    const labelPacket = await LabService.generateSampleLabelInfo(id);
    
    return res.status(200).json({
      success: true,
      message: "Sample label packet compiled successfully.",
      data: labelPacket
    });
  } catch (error: any) {
    return res.status(404).json({ success: false, error: error.message });
  }
}

/**
 * 2. HTTP GET: Fetches available tests grouped under a specific medical panel category
 * URL: GET /api/lab-panels/:panelName
 * Access: Doctors / Clinical Staff
 */
export async function getTestsByPanelCategory(req: Request, res: Response): Promise<Response> {
  try {
    const { panelName } = req.params;

    if (!panelName || typeof panelName !== "string") {
      return res.status(400).json({ success: false, error: "A valid Panel Category name parameter is required." });
    }

    const testsList = await LabService.getTestsByPanel(panelName);
    
    return res.status(200).json({
      success: true,
      message: `Tests under panel '${panelName}' retrieved successfully.`,
      data: testsList
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 3. HTTP POST: Marks a physical specimen sample as arrived in the lab ("Received")
 * URL: POST /api/lab-orders/:id/receive
 * Access: Authorized Laboratory Staff Only
 */
export async function markSampleAsReceived(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const { processingOrderStatusId, collectedSampleStatusId } = req.body;
    
    // Simulating user ID injected by authentication middleware (e.g., req.user.id)
    const staffUserId = req.headers["x-staff-user-id"]; 

    if (!id || typeof id !== "string") {
      return res.status(400).json({ success: false, error: "A valid Order ID string route parameter is required." });
    }

    if (!staffUserId || typeof staffUserId !== "string") {
      return res.status(401).json({ success: false, error: "Laboratory staff identification credentials are required." });
    }

    if (!processingOrderStatusId || !collectedSampleStatusId) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required workflow validation mapping parameters: processingOrderStatusId and collectedSampleStatusId are mandatory." 
      });
    }

    const updatedRecord = await LabService.receiveSampleInLab(
      id, 
      staffUserId, 
      processingOrderStatusId, 
      collectedSampleStatusId
    );

    return res.status(200).json({
      success: true,
      message: "Physical sample marked as 'Received'. Workflow tracking state updated to 'Processing'.",
      data: updatedRecord
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

/**
 * 4. HTTP POST: Submits runtime diagnostic metrics and flags clinical exceptions ("Done")
 * URL: POST /api/lab-orders/:id/complete
 * Access: Authorized Laboratory Staff Only
 */
export async function submitCompletedTestResults(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const { capturedData, technicianNotes } = req.body;
    const performedBy = req.headers["x-staff-user-id"]; // Lab tech ID from auth session headers

    if (!id || typeof id !== "string") {
      return res.status(400).json({ success: false, error: "A valid Order ID string route parameter is required." });
    }

    if (!performedBy || typeof performedBy !== "string") {
      return res.status(401).json({ success: false, error: "Laboratory staff authentication validation checks failed." });
    }

    if (!capturedData || typeof capturedData !== "object") {
      return res.status(400).json({ success: false, error: "Captured dynamic data results dictionary object is missing or invalid." });
    }

    const testingWorkflowResult = await LabService.executeAndCompleteTest({
      orderId: id,
      performedBy,
      capturedData,
      technicianNotes
    });

    return res.status(200).json({
      success: true,
      message: "Diagnostic results processed successfully. Order workflow cycle marked as 'Done/Completed'.",
      data: testingWorkflowResult
    });
  } catch (error: any) {
    return res.status(422).json({ success: false, error: error.message }); // 422 for clinical metric data validation failures
  }
}

/**
 * 5. HTTP GET: Returns real-time execution tracking timelines to the prescribing clinician
 * URL: GET /api/doctor/orders-timeline
 * Access: Requesting Doctor Only
 */
export async function getDoctorTrackingTimeline(req: Request, res: Response): Promise<Response> {
  try {
    // Retreiving doctor ID from encrypted session headers or route query configs
    const doctorId = req.headers["x-doctor-id"]; 

    if (!doctorId || typeof doctorId !== "string") {
      return res.status(401).json({ success: false, error: "Doctor authentication access context was not located." });
    }

    const doctorTimelineQueue = await LabService.trackDoctorOrdersTimeline(doctorId);

    return res.status(200).json({
      success: true,
      message: "Clinician live diagnostics tracking queue fetched successfully.",
      data: doctorTimelineQueue
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}



////////////////////////////////////////////////////////////////////////////
//////////////////////
//////////////////////////////////////////////////////////////////////////




/**
 * 12. HTTP POST: Registers a brand new lab test option into the active hospital catalog
 * URL: POST /api/admin/lab-tests
 * Access: Admin / Laboratory Manager
 */
export async function createLabTestCatalogItem(req: Request, res: Response): Promise<Response> {
  try {
    const { name, code, department, price, sampleTypeId } = req.body;

    if (!name || !code || !department || !price || !sampleTypeId) {
      return res.status(400).json({ 
        success: false, 
        error: "All catalog fields (name, code, department, price, sampleTypeId) are mandatory." 
      });
    }

    const newCatalogItem = await LabService.addLabTestToCatalog({
      name,
      code,
      department,
      price: String(price),
      sampleTypeId
    });

    return res.status(201).json({
      success: true,
      message: "Laboratory test catalog item registered successfully.",
      data: newCatalogItem
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

/**
 * 13. HTTP GET: Fetches all active catalog tests that are not soft-deleted
 * URL: GET /api/lab-tests/catalog
 * Access: Public / Clinical Staff / Doctors
 */
export async function getActiveLabTestsCatalog(req: Request, res: Response): Promise<Response> {
  try {
    const activeTests = await LabService.fetchActiveCatalogTests();
    
    return res.status(200).json({
      success: true,
      message: "Active laboratory test catalog retrieved successfully.",
      data: activeTests
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 14. HTTP PUT: Modifies details of an existing active catalog item
 * URL: PUT /api/admin/lab-tests/:id
 * Access: Admin / Laboratory Manager
 */
export async function updateLabTestCatalogItem(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const { name, department, price, isAvailable, sampleTypeId } = req.body;

    // TypeScript compilation type narrowing check
    if (!id || typeof id !== "string") {
      return res.status(400).json({ success: false, error: "A valid Catalog Test ID string parameter is required." });
    }

    const modifiedItem = await LabService.modifyCatalogLabTest(id, {
      name,
      department,
      price: price ? String(price) : undefined,
      isAvailable,
      sampleTypeId
    });

    return res.status(200).json({
      success: true,
      message: "Catalog item updated successfully.",
      data: modifiedItem
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
}

/**
 * 15. HTTP DELETE: Flags a test catalog item as soft-deleted
 * URL: DELETE /api/admin/lab-tests/:id
 * Access: Admin / Laboratory Manager
 */
export async function softDeleteLabTestCatalogItem(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;

    // TypeScript compilation type narrowing check
    if (!id || typeof id !== "string") {
      return res.status(400).json({ success: false, error: "A valid Catalog Test ID string parameter is required." });
    }

    const isDeleted = await LabService.archiveCatalogLabTest(id);

    return res.status(200).json({
      success: true,
      message: "Laboratory test catalog item archived (soft-deleted) successfully.",
      data: { id }
    });
  } catch (error: any) {
    return res.status(404).json({ success: false, error: error.message });
  }
}

/**
 * 16. HTTP POST: Restores a soft-deleted catalog item back to life
 * URL: POST /api/admin/lab-tests/:id/recover
 * Access: Admin / Laboratory Manager
 */
export async function recoverLabTestCatalogItem(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;

    // TypeScript compilation type narrowing check
    if (!id || typeof id !== "string") {
      return res.status(400).json({ success: false, error: "A valid Catalog Test ID string parameter is required." });
    }

    const isRestored = await LabService.restoreCatalogLabTest(id);

    return res.status(200).json({
      success: true,
      message: "Laboratory test catalog item recovered and restored to active pool successfully.",
      data: { id }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
}
