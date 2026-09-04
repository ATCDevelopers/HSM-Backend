import { Router } from "express";
import {
  getSampleLabel,
  getTestsByPanelCategory,
  markSampleAsReceived,
  submitCompletedTestResults,
  getDoctorTrackingTimeline,
   createLabTestCatalogItem,
  getActiveLabTestsCatalog,
  updateLabTestCatalogItem,
  softDeleteLabTestCatalogItem,
  recoverLabTestCatalogItem
} from "../controllers/labTest.controller.js"; // Adjust the import path to your controller file

const router = Router();

/**
 * @route   GET /api/lab-orders/:id/label
 * @desc    Compiles identification information needed to print physical specimen labels (Patient, age, sample type)
 * @access  Private / Lab Staff / Phlebotomist
 */
router.get("/lab-orders/:id/label", getSampleLabel);

/**
 * @route   GET /api/lab-panels/:panelName
 * @desc    Retrieves all available tests grouped into a specific medical department category/panel (e.g., Microbiology)
 * @access  Private / Clinical Staff / Doctors
 */
router.get("/lab-panels/:panelName", getTestsByPanelCategory);

/**
 * @route   POST /api/lab-orders/:id/receive
 * @desc    Marks a physical specimen sample tube as safely arrived inside the lab room ("Received")
 * @access  Private / Authorized Lab Staff
 */
router.post("/lab-orders/:id/receive", markSampleAsReceived);

/**
 * @route   POST /api/lab-orders/:id/complete
 * @desc    Submits dynamic laboratory findings, auto-checks reference bounds, and closes the lifecycle ("Done")
 * @access  Private / Authorized Lab Staff
 */
router.post("/lab-orders/:id/complete", submitCompletedTestResults);

/**
 * @route   GET /api/doctor/orders-timeline
 * @desc    Provides a live timeline tracking screen for a specific physician to view active test progressions
 * @access  Private / Requesting Doctor Only
 */
router.get("/doctor/orders-timeline", getDoctorTrackingTimeline);



/**
 * @route   POST /api/admin/lab-tests
 * @desc    Registers a brand new lab test option into the active hospital catalog
 * @access  Private / Admin / Lab Manager
 */
router.post("/admin/lab-tests", createLabTestCatalogItem);

/**
 * @route   GET /api/lab-tests/catalog
 * @desc    Fetches all active catalog tests that are not soft-deleted
 * @access  Public / Clinical Staff / Doctors
 */
router.get("/lab-tests/catalog", getActiveLabTestsCatalog);

/**
 * @route   PUT /api/admin/lab-tests/:id
 * @desc    Modifies details of an existing active catalog item (price, availability, name)
 * @access  Private / Admin / Lab Manager
 */
router.put("/admin/admin/lab-tests/:id", updateLabTestCatalogItem);

/**
 * @route   DELETE /api/admin/lab-tests/:id
 * @desc    Flags a test catalog item as soft-deleted (archives it from clinical view)
 * @access  Private / Admin / Lab Manager
 */
router.delete("/admin/lab-tests/:id", softDeleteLabTestCatalogItem);

/**
 * @route   POST /api/admin/lab-tests/:id/recover
 * @desc    Restores a soft-deleted catalog item back to the active medical pool
 * @access  Private / Admin / Lab Manager
 */
router.post("/admin/lab-tests/:id/recover", recoverLabTestCatalogItem);












export default router;
