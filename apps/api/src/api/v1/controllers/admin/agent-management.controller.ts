import { Request, Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import agentManagementService from "../../services/admin/agent-management.service";
import AppError from "../../../../utils/AppError";

export const getAllAgents = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    assigned,
    assignedClientId,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = req.query;

  const filters = {
    search: search as string,
    assigned: assigned !== undefined ? assigned === "true" : undefined,
    assignedClientId: assignedClientId as string
  };

  const pagination = {
    page: Number(page),
    limit: Number(limit),
    sortBy: sortBy as string,
    sortOrder: sortOrder as "asc" | "desc"
  };

  const result = await agentManagementService.getAllAgents(filters, pagination);

  res.status(200).json({
    status: "success",
    data: result
  });
});

export const getAgentById = catchAsync(async (req: Request, res: Response) => {
  const { agentId } = req.params;

  if (!agentId) {
    throw new AppError("Agent ID is required", 400);
  }

  const agent = await agentManagementService.getAgentById(agentId);

  res.status(200).json({
    status: "success",
    data: { agent }
  });
});

export const getRetellAgentDetails = catchAsync(async (req: Request, res: Response) => {
  const { agentId } = req.params;

  if (!agentId) {
    throw new AppError("Agent ID is required", 400);
  }

  const details = await agentManagementService.getRetellAgentDetails(agentId);

  res.status(200).json({
    status: "success",
    data: details
  });
});

export const createAgent = catchAsync(async (req: Request, res: Response) => {
  const { agentId, agentName, assignedClientId } = req.body;

  if (!agentId || !agentName) {
    throw new AppError("Agent ID and agent name are required", 400);
  }

  const agentData = {
    agentId,
    agentName,
    assignedClientId
  };

  const agent = await agentManagementService.createAgent(agentData);

  res.status(201).json({
    status: "success",
    message: "Agent created successfully",
    data: { agent }
  });
});

export const deleteAgent = catchAsync(async (req: Request, res: Response) => {
  const { agentId } = req.params;

  if (!agentId) {
    throw new AppError("Agent ID is required", 400);
  }

  await agentManagementService.deleteAgent(agentId);

  res.status(200).json({
    status: "success",
    message: "Agent deleted successfully"
  });
});

export const updateLLMPrompt = catchAsync(async (req: Request, res: Response) => {
  const { llmId } = req.params;
  const { general_prompt } = req.body;

  if (!llmId) {
    throw new AppError("LLM ID is required", 400);
  }

  if (!general_prompt) {
    throw new AppError("General prompt is required", 400);
  }

  const updatedLLM = await agentManagementService.updateLLMPrompt(llmId, general_prompt);

  res.status(200).json({
    status: "success",
    message: "LLM prompt updated successfully",
    data: { llm: updatedLLM }
  });
});

export const getVoiceDetails = catchAsync(async (req: Request, res: Response) => {
  const { voiceId } = req.params;

  if (!voiceId) {
    throw new AppError("Voice ID is required", 400);
  }

  const voiceDetails = await agentManagementService.getVoiceDetails(voiceId);

  res.status(200).json({
    status: "success",
    data: { voice: voiceDetails }
  });
});

export const publishAgent = catchAsync(async (req: Request, res: Response) => {
  const { agentId } = req.params;

  if (!agentId) {
    throw new AppError("Agent ID is required", 400);
  }

  const result = await agentManagementService.publishAgent(agentId);

  res.status(200).json({
    status: "success",
    message: "Agent published successfully",
    data: { agent: result }
  });
});

export const assignAgent = catchAsync(async (req: Request, res: Response) => {
  const { agentId } = req.params;
  const { clientId } = req.body;

  if (!agentId) {
    throw new AppError("Agent ID is required", 400);
  }

  if (!clientId) {
    throw new AppError("Client ID is required", 400);
  }

  const result = await agentManagementService.assignAgentToClient(agentId, clientId);

  res.status(200).json({
    status: "success",
    message: "Agent assigned successfully",
    data: { agent: result }
  });
});

export const unassignAgent = catchAsync(async (req: Request, res: Response) => {
  const { agentId } = req.params;

  if (!agentId) {
    throw new AppError("Agent ID is required", 400);
  }

  const agent = await agentManagementService.unassignAgent(agentId);

  res.status(200).json({
    status: "success",
    message: "Agent unassigned successfully",
    data: { agent }
  });
});

export const getAvailableAgents = catchAsync(async (req: Request, res: Response) => {
  const agents = await agentManagementService.getAvailableAgents();

  res.status(200).json({
    status: "success",
    data: { agents }
  });
});

export const getClientAgents = catchAsync(async (req: Request, res: Response) => {
  const { clientId } = req.params;

  if (!clientId) {
    throw new AppError("Client ID is required", 400);
  }

  const agents = await agentManagementService.getClientAgents(clientId);

  res.status(200).json({
    status: "success",
    data: { agents }
  });
});

export const getAgentStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await agentManagementService.getAgentStats();

  res.status(200).json({
    status: "success",
    data: { stats }
  });
});