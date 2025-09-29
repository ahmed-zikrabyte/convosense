import { Router } from "express";
import {
  getAllAgents,
  getAgentById,
  getRetellAgentDetails,
  createAgent,
  deleteAgent,
  getAgentStats,
  updateLLMPrompt,
  getVoiceDetails,
  publishAgent,
  assignAgent,
  unassignAgent,
  getAvailableAgents,
  getClientAgents
} from "../../controllers/admin/agent-management.controller";

const router: Router = Router();

router.get("/", getAllAgents);
router.get("/stats", getAgentStats);
router.get("/available", getAvailableAgents);
router.get("/client/:clientId", getClientAgents);
router.get("/:agentId", getAgentById);
router.get("/retell/:agentId", getRetellAgentDetails);
router.get("/voice/:voiceId", getVoiceDetails);
router.post("/", createAgent);
router.post("/:agentId/publish", publishAgent);
router.post("/:agentId/assign", assignAgent);
router.post("/:agentId/unassign", unassignAgent);
router.patch("/llm/:llmId", updateLLMPrompt);
router.delete("/:agentId", deleteAgent);

export default router;