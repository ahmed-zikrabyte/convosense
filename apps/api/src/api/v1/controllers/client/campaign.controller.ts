import { Request, Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import campaignService, { CreateCampaignData, UpdateCampaignData } from "../../services/client/campaign.service";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    type: string;
  };
}

export const createCampaign = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const campaignData: CreateCampaignData = req.body;

  const campaign = await campaignService.createCampaign(clientId, campaignData);

  res.status(201).json({
    status: "success",
    data: {
      campaign,
    },
  });
});

export const getCampaigns = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { status, page, limit, search } = req.query;

  const filters = {
    status: status as string | undefined,
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    search: search as string | undefined,
  };

  const result = await campaignService.getCampaigns(clientId, filters);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getCampaign = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId } = req.params;

  if (!campaignId) {
    return res.status(400).json({ status: "error", message: "Campaign ID is required" });
  }

  const campaign = await campaignService.getCampaignById(clientId, campaignId);

  res.status(200).json({
    status: "success",
    data: {
      campaign,
    },
  });
});

export const updateCampaign = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId } = req.params;
  const updateData: UpdateCampaignData = req.body;

  if (!campaignId) {
    return res.status(400).json({ status: "error", message: "Campaign ID is required" });
  }

  const campaign = await campaignService.updateCampaign(clientId, campaignId, updateData);

  res.status(200).json({
    status: "success",
    data: {
      campaign,
    },
  });
});

export const deleteCampaign = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId } = req.params;

  if (!campaignId) {
    return res.status(400).json({ status: "error", message: "Campaign ID is required" });
  }

  await campaignService.deleteCampaign(clientId, campaignId);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const duplicateCampaign = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId } = req.params;

  if (!campaignId) {
    return res.status(400).json({ status: "error", message: "Campaign ID is required" });
  }

  const campaign = await campaignService.duplicateCampaign(clientId, campaignId);

  res.status(201).json({
    status: "success",
    data: {
      campaign,
    },
  });
});

export const updateKnowledgeBase = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId } = req.params;
  const { kb_files_meta } = req.body;

  if (!campaignId) {
    return res.status(400).json({ status: "error", message: "Campaign ID is required" });
  }

  const campaign = await campaignService.updateKnowledgeBase(clientId, campaignId, kb_files_meta);

  res.status(200).json({
    status: "success",
    data: {
      campaign,
    },
  });
});

export const getCampaignStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;

  const stats = await campaignService.getCampaignStats(clientId);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});