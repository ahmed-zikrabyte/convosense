import {Router} from "express";
import {
  getCallReports,
  getCallReportById,
  getCallReportsByCampaign,
  getCallTranscript,
  getCallRecording,
} from "../../controllers/client/call-reports.controller";
import { protect } from "../../../../middleware/auth.middleware";

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(protect("client"));

// Get all call reports for the authenticated client
router.get("/", getCallReports);

// Get call reports for a specific campaign
router.get(
  "/campaign/:campaignId",
  getCallReportsByCampaign
);

// Get a specific call report by ID
router.get("/:callId", getCallReportById);

// Get call transcript
router.get("/:callId/transcript", getCallTranscript);

// Get call recording URLs
router.get("/:callId/recording", getCallRecording);

export default router;
