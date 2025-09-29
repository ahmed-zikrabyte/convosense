import { Router } from "express";
import {
  getAllAgents,
  getAgentById,
  getRetellAgentDetails,
  createAgent,
  deleteAgent,
  getAgentStats,
  updateLLMPrompt,
  getVoiceDetails
} from "../../controllers/admin/agent-management.controller";

const router: Router = Router();

router.get("/", getAllAgents);
router.get("/stats", getAgentStats);
router.get("/:agentId", getAgentById);
router.get("/retell/:agentId", getRetellAgentDetails);
router.get("/voice/:voiceId", getVoiceDetails);
router.post("/", createAgent);
router.patch("/llm/:llmId", updateLLMPrompt);
router.delete("/:agentId", deleteAgent);

export default router;