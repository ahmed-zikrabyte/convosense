import express, {Router} from "express";
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  toggleClientStatus,
  addCreditsToClient,
  bulkOperation,
  getClientStats,
  deleteClient,
} from "../../controllers/admin/client-management.controller";

const router: Router = express.Router();

// Client statistics
router.get("/stats", getClientStats);

// Client CRUD operations
router.get("/", getAllClients);
router.post("/", createClient);
router.get("/:clientId", getClientById);
router.patch("/:clientId", updateClient);
router.delete("/:clientId", deleteClient);

// Client status management
router.patch("/:clientId/status", toggleClientStatus);

// Credit management
router.patch("/:clientId/credits", addCreditsToClient);

// Bulk operations
router.post("/bulk", bulkOperation);

export default router;
