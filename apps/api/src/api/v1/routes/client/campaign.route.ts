import { Router } from "express";
import { protect } from "../../../../middleware/auth.middleware";
import {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  duplicateCampaign,
  updateKnowledgeBase,
  getCampaignStats,
} from "../../controllers/client/campaign.controller";

const router: Router = Router();

router.use(protect("client"));

// Campaign CRUD operations
router.post("/", createCampaign);
router.get("/", getCampaigns);
router.get("/stats", getCampaignStats);
router.get("/:campaignId", getCampaign);
router.patch("/:campaignId", updateCampaign);
router.delete("/:campaignId", deleteCampaign);

// Campaign specific operations
router.post("/:campaignId/duplicate", duplicateCampaign);
router.patch("/:campaignId/knowledge-base", updateKnowledgeBase);

export default router;