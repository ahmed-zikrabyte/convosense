import { Router } from "express";
import { protect } from "../../../../middleware/auth.middleware";
import {
  getAssignedAgents,
  getAgentWithLLM,
} from "../../controllers/client/agent.controller";

const router: Router = Router();

router.use(protect("client"));

// Agent operations for clients
router.get("/", getAssignedAgents);
router.get("/:agentId", getAgentWithLLM);

export default router;