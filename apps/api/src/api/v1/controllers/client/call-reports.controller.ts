import { Response } from "express";
import callReportsService, { CallReportsFilters } from "../../services/client/call-reports.service";
import catchAsync from "../../../../utils/catchAsync";
import { AuthenticatedRequest } from "../../../../middleware/auth.middleware";

export const getCallReports = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;

  const filters: CallReportsFilters = {
    campaign_id: req.query.campaign_id as string,
    status: req.query.status as string,
    start_date: req.query.start_date as string,
    end_date: req.query.end_date as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    search: req.query.search as string,
  };

  const result = await callReportsService.getCallReports(clientId, filters);

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getCallReportById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { callId } = req.params;

  if (!callId) {
    return res.status(400).json({
      success: false,
      message: "Call ID is required",
    });
  }

  const call = await callReportsService.getCallReportById(clientId, callId);

  res.status(200).json({
    success: true,
    data: call,
  });
});

export const getCallReportsByCampaign = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId } = req.params;

  if (!campaignId) {
    return res.status(400).json({
      success: false,
      message: "Campaign ID is required",
    });
  }

  const filters: Omit<CallReportsFilters, "campaign_id"> = {
    status: req.query.status as string,
    start_date: req.query.start_date as string,
    end_date: req.query.end_date as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    search: req.query.search as string,
  };

  const result = await callReportsService.getCallReportsByCampaign(
    clientId,
    campaignId,
    filters
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getCallTranscript = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { callId } = req.params;

  if (!callId) {
    return res.status(400).json({
      success: false,
      message: "Call ID is required",
    });
  }

  const transcript = await callReportsService.getCallTranscript(
    clientId,
    callId
  );

  res.status(200).json({
    success: true,
    data: transcript,
  });
});

export const getCallRecording = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { callId } = req.params;

  if (!callId) {
    return res.status(400).json({
      success: false,
      message: "Call ID is required",
    });
  }

  const recording = await callReportsService.getCallRecording(
    clientId,
    callId
  );

  res.status(200).json({
    success: true,
    data: recording,
  });
});