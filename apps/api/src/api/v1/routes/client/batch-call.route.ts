import { Router } from "express";
import { protect } from "../../../../middleware/auth.middleware";
import {
  startBatchCall,
  getBatchCallStatus,
  stopBatchCall,
} from "../../controllers/client/batch-call.controller";

const router: Router = Router();

router.use(protect("client"));

// Batch call operations
router.post("/:campaignId/start", startBatchCall);
router.get("/:campaignId/status/:batchCallId", getBatchCallStatus);
router.post("/:campaignId/stop/:batchCallId", stopBatchCall);

export default router;