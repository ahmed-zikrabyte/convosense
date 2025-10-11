import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import batchCallService from "../../services/client/batch-call.service";
import { AuthenticatedRequest } from "../../../../middleware/auth.middleware";

export const startBatchCall = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId } = req.params;

  if (!campaignId) {
    return res.status(400).json({ status: "error", message: "Campaign ID is required" });
  }

  const result = await batchCallService.startBatchCall(clientId, campaignId);

  res.status(201).json({
    status: "success",
    data: {
      batchCall: result,
    },
  });
});

export const getBatchCallStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId, batchCallId } = req.params;

  if (!campaignId || !batchCallId) {
    return res.status(400).json({ status: "error", message: "Campaign ID and Batch Call ID are required" });
  }

  const status = await batchCallService.getBatchCallStatus(clientId, campaignId, batchCallId);

  res.status(200).json({
    status: "success",
    data: {
      status,
    },
  });
});

export const stopBatchCall = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId, batchCallId } = req.params;

  if (!campaignId || !batchCallId) {
    return res.status(400).json({ status: "error", message: "Campaign ID and Batch Call ID are required" });
  }

  await batchCallService.stopBatchCall(clientId, campaignId, batchCallId);

  res.status(200).json({
    status: "success",
    data: null,
  });
});