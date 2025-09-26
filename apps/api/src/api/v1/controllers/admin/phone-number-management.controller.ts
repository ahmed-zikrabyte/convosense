import { Request, Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import phoneNumberManagementService from "../../services/admin/phone-number-management.service";
import AppError from "../../../../utils/AppError";

// Get all phone numbers with filters and pagination
export const getAllPhoneNumbers = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    provider,
    type,
    isActive,
    assigned,
    assignedClientId,
    country,
    purchasedBefore,
    purchasedAfter,
    sortBy = "purchased_at",
    sortOrder = "desc"
  } = req.query;

  const filters = {
    search: search as string,
    provider: provider as "retell" | "twilio" | "manual",
    type: type as "local" | "toll_free" | "international",
    isActive: isActive !== undefined ? isActive === "true" : undefined,
    assigned: assigned !== undefined ? assigned === "true" : undefined,
    assignedClientId: assignedClientId as string,
    country: country as string,
    purchasedBefore: purchasedBefore ? new Date(purchasedBefore as string) : undefined,
    purchasedAfter: purchasedAfter ? new Date(purchasedAfter as string) : undefined
  };

  const pagination = {
    page: Number(page),
    limit: Number(limit),
    sortBy: sortBy as string,
    sortOrder: sortOrder as "asc" | "desc"
  };

  const result = await phoneNumberManagementService.getAllPhoneNumbers(filters, pagination);

  res.status(200).json({
    status: "success",
    data: result
  });
});

// Get phone number by ID
export const getPhoneNumberById = catchAsync(async (req: Request, res: Response) => {
  const { phoneNumberId } = req.params;

  if (!phoneNumberId) {
    throw new AppError("Phone number ID is required", 400);
  }

  const phoneNumber = await phoneNumberManagementService.getPhoneNumberById(phoneNumberId);

  res.status(200).json({
    status: "success",
    data: { phoneNumber }
  });
});

// Create new phone number
export const createPhoneNumber = catchAsync(async (req: Request, res: Response) => {
  const {
    phone_number,
    provider,
    type,
    imported,
    metadata
  } = req.body;

  if (!phone_number || !provider || !type) {
    throw new AppError("Phone number, provider, and type are required", 400);
  }

  // Validate phone number format (E.164)
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (!e164Regex.test(phone_number)) {
    throw new AppError("Phone number must be in E.164 format", 400);
  }

  const phoneData = {
    phone_number,
    provider,
    type,
    imported: imported || false,
    metadata
  };

  const phoneNumber = await phoneNumberManagementService.createPhoneNumber(phoneData);

  res.status(201).json({
    status: "success",
    message: "Phone number created successfully",
    data: { phoneNumber }
  });
});

// Update phone number
export const updatePhoneNumber = catchAsync(async (req: Request, res: Response) => {
  const { phoneNumberId } = req.params;
  const updateData = req.body;

  if (!phoneNumberId) {
    throw new AppError("Phone number ID is required", 400);
  }

  const phoneNumber = await phoneNumberManagementService.updatePhoneNumber(phoneNumberId, updateData);

  res.status(200).json({
    status: "success",
    message: "Phone number updated successfully",
    data: { phoneNumber }
  });
});

// Assign phone number to client
export const assignPhoneNumber = catchAsync(async (req: Request, res: Response) => {
  const { phoneNumberId } = req.params;
  const { clientId } = req.body;

  if (!phoneNumberId) {
    throw new AppError("Phone number ID is required", 400);
  }

  if (!clientId) {
    throw new AppError("Client ID is required", 400);
  }

  const result = await phoneNumberManagementService.assignPhoneNumberToClient(phoneNumberId, clientId);

  res.status(200).json({
    status: "success",
    message: "Phone number assigned successfully",
    data: { phoneNumber: result }
  });
});

// Unassign phone number
export const unassignPhoneNumber = catchAsync(async (req: Request, res: Response) => {
  const { phoneNumberId } = req.params;

  if (!phoneNumberId) {
    throw new AppError("Phone number ID is required", 400);
  }

  const phoneNumber = await phoneNumberManagementService.unassignPhoneNumber(phoneNumberId);

  res.status(200).json({
    status: "success",
    message: "Phone number unassigned successfully",
    data: { phoneNumber }
  });
});

// Bulk operations
export const bulkOperation = catchAsync(async (req: Request, res: Response) => {
  const { phoneNumberIds, operation, clientId } = req.body;

  if (!phoneNumberIds || !Array.isArray(phoneNumberIds) || phoneNumberIds.length === 0) {
    throw new AppError("Phone number IDs array is required", 400);
  }

  if (!operation || !["activate", "deactivate", "unassign", "assign", "delete"].includes(operation)) {
    throw new AppError("Valid operation is required (activate, deactivate, unassign, assign, delete)", 400);
  }

  if (operation === "assign" && !clientId) {
    throw new AppError("Client ID is required for assign operation", 400);
  }

  const result = await phoneNumberManagementService.bulkOperation({
    phoneNumberIds,
    operation,
    clientId
  });

  res.status(200).json({
    status: "success",
    message: "Bulk operation completed",
    data: result
  });
});

// Get available phone numbers
export const getAvailablePhoneNumbers = catchAsync(async (req: Request, res: Response) => {
  const { type, country } = req.query;

  const phoneNumbers = await phoneNumberManagementService.getAvailablePhoneNumbers(
    type as string,
    country as string
  );

  res.status(200).json({
    status: "success",
    data: { phoneNumbers }
  });
});

// Get client's phone numbers
export const getClientPhoneNumbers = catchAsync(async (req: Request, res: Response) => {
  const { clientId } = req.params;

  if (!clientId) {
    throw new AppError("Client ID is required", 400);
  }

  const phoneNumbers = await phoneNumberManagementService.getClientPhoneNumbers(clientId);

  res.status(200).json({
    status: "success",
    data: { phoneNumbers }
  });
});

// Get phone number statistics
export const getPhoneNumberStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await phoneNumberManagementService.getPhoneNumberStats();

  res.status(200).json({
    status: "success",
    data: { stats }
  });
});

// Delete phone number
export const deletePhoneNumber = catchAsync(async (req: Request, res: Response) => {
  const { phoneNumberId } = req.params;

  if (!phoneNumberId) {
    throw new AppError("Phone number ID is required", 400);
  }

  await phoneNumberManagementService.deletePhoneNumber(phoneNumberId);

  res.status(200).json({
    status: "success",
    message: "Phone number deleted successfully"
  });
});

// Purchase phone number (integration with providers)
export const purchasePhoneNumber = catchAsync(async (req: Request, res: Response) => {
  const {
    phone_number,
    provider,
    type,
    country_code,
    region,
    setupCost,
    monthlyCost
  } = req.body;

  if (!phone_number || !provider || !type) {
    throw new AppError("Phone number, provider, and type are required", 400);
  }

  const phoneData = {
    phone_number,
    provider,
    type,
    imported: false,
    metadata: {
      country_code,
      region,
      capabilities: ["voice"], // Default to voice capability
    },
    setupCost,
    monthlyCost
  };

  const phoneNumber = await phoneNumberManagementService.purchasePhoneNumber(phoneData);

  res.status(201).json({
    status: "success",
    message: "Phone number purchased successfully",
    data: { phoneNumber }
  });
});