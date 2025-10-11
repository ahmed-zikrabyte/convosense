import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import clientAgentService from "../../services/client/agent.service";
import { AuthenticatedRequest } from "../../../../middleware/auth.middleware";

export const getAssignedAgents = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;

  const agents = await clientAgentService.getAssignedAgents(clientId);

  res.status(200).json({
    status: "success",
    data: {
      agents,
    },
  });
});

export const getAgentWithLLM = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { agentId } = req.params;

  if (!agentId) {
    return res.status(400).json({
      status: "error",
      message: "Agent ID is required"
    });
  }

  const agentData = await clientAgentService.getAgentWithLLM(clientId, agentId);

  res.status(200).json({
    status: "success",
    data: agentData,
  });
});