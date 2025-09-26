import express, { Router } from "express";
import {
  getAllPhoneNumbers,
  getPhoneNumberById,
  createPhoneNumber,
  updatePhoneNumber,
  assignPhoneNumber,
  unassignPhoneNumber,
  bulkOperation,
  getAvailablePhoneNumbers,
  getClientPhoneNumbers,
  getPhoneNumberStats,
  deletePhoneNumber,
  purchasePhoneNumber
} from "../../controllers/admin/phone-number-management.controller";

const router: Router = express.Router();

// Phone number statistics
router.get("/stats", getPhoneNumberStats);

// Available phone numbers
router.get("/available", getAvailablePhoneNumbers);

// Client's phone numbers
router.get("/client/:clientId", getClientPhoneNumbers);

// Phone number CRUD operations
router.get("/", getAllPhoneNumbers);
router.post("/", createPhoneNumber);
router.get("/:phoneNumberId", getPhoneNumberById);
router.patch("/:phoneNumberId", updatePhoneNumber);
router.delete("/:phoneNumberId", deletePhoneNumber);

// Assignment operations
router.post("/:phoneNumberId/assign", assignPhoneNumber);
router.post("/:phoneNumberId/unassign", unassignPhoneNumber);

// Purchase workflow
router.post("/purchase", purchasePhoneNumber);

// Bulk operations
router.post("/bulk", bulkOperation);

export default router;