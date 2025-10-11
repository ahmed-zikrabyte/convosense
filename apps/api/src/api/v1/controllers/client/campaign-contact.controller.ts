import { Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import campaignContactService from "../../services/client/campaign-contact.service";
import multer from "multer";
import { AuthenticatedRequest } from "../../../../middleware/auth.middleware";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

export const uploadMiddleware: any = upload.single('csv');

export const uploadContacts = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId } = req.params;
  const file = req.file;

  if (!campaignId) {
    return res.status(400).json({
      status: "error",
      message: "Campaign ID is required"
    });
  }

  if (!file) {
    return res.status(400).json({
      status: "error",
      message: "CSV file is required"
    });
  }

  try {
    const result = await campaignContactService.uploadContactsFromCSV(
      clientId,
      campaignId,
      file.buffer
    );

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message || "Failed to upload contacts",
    });
  }
});

export const getContacts = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId } = req.params;
  const { page, limit, status } = req.query;

  if (!campaignId) {
    return res.status(400).json({
      status: "error",
      message: "Campaign ID is required"
    });
  }

  const filters = {
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 50,
    status: status as string | undefined,
  };

  const result = await campaignContactService.getContacts(clientId, campaignId, filters);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const deleteContact = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId, contactId } = req.params;

  if (!campaignId || !contactId) {
    return res.status(400).json({
      status: "error",
      message: "Campaign ID and Contact ID are required"
    });
  }

  await campaignContactService.deleteContact(clientId, campaignId, contactId);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const updateContact = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { id: clientId } = req.user!;
  const { campaignId, contactId } = req.params;
  const updateData = req.body;

  if (!campaignId || !contactId) {
    return res.status(400).json({
      status: "error",
      message: "Campaign ID and Contact ID are required"
    });
  }

  const contact = await campaignContactService.updateContact(
    clientId,
    campaignId,
    contactId,
    updateData
  );

  res.status(200).json({
    status: "success",
    data: { contact },
  });
});