import { Request, Response } from "express";
import catchAsync from "../../../../utils/catchAsync";
import clientManagementService from "../../services/admin/client-management.service";
import AppError from "../../../../utils/AppError";

// Get all clients with filters and pagination
export const getAllClients = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    isActive,
    minCredits,
    maxCredits,
    createdBefore,
    createdAfter,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = req.query;

  const filters = {
    search: search as string,
    isActive: isActive !== undefined ? isActive === "true" : undefined,
    minCredits: minCredits ? Number(minCredits) : undefined,
    maxCredits: maxCredits ? Number(maxCredits) : undefined,
    createdBefore: createdBefore ? new Date(createdBefore as string) : undefined,
    createdAfter: createdAfter ? new Date(createdAfter as string) : undefined
  };

  const pagination = {
    page: Number(page),
    limit: Number(limit),
    sortBy: sortBy as string,
    sortOrder: sortOrder as "asc" | "desc"
  };

  const result = await clientManagementService.getAllClients(filters, pagination);

  res.status(200).json({
    status: "success",
    data: result
  });
});

// Get client by ID
export const getClientById = catchAsync(async (req: Request, res: Response) => {
  const { clientId } = req.params;

  if (!clientId) {
    throw new AppError("Client ID is required", 400);
  }

  const client = await clientManagementService.getClientById(clientId);

  res.status(200).json({
    status: "success",
    data: { client }
  });
});

// Create new client
export const createClient = catchAsync(async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    phone,
    address,
    credits_total_minutes,
    billing_rate,
    isActive
  } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required", 400);
  }

  const clientData = {
    name,
    email,
    password,
    phone,
    address,
    credits_total_minutes: credits_total_minutes ? Number(credits_total_minutes) : undefined,
    billing_rate: billing_rate ? Number(billing_rate) : undefined,
    isActive
  };

  const client = await clientManagementService.createClient(clientData);

  res.status(201).json({
    status: "success",
    message: "Client created successfully",
    data: { client }
  });
});

// Update client
export const updateClient = catchAsync(async (req: Request, res: Response) => {
  const { clientId } = req.params;
  const updateData = req.body;

  if (!clientId) {
    throw new AppError("Client ID is required", 400);
  }

  // Convert numeric fields if provided
  if (updateData.credits_total_minutes) {
    updateData.credits_total_minutes = Number(updateData.credits_total_minutes);
  }
  if (updateData.billing_rate) {
    updateData.billing_rate = Number(updateData.billing_rate);
  }

  const client = await clientManagementService.updateClient(clientId, updateData);

  res.status(200).json({
    status: "success",
    message: "Client updated successfully",
    data: { client }
  });
});

// Toggle client status (activate/deactivate)
export const toggleClientStatus = catchAsync(async (req: Request, res: Response) => {
  const { clientId } = req.params;
  const { isActive } = req.body;

  if (!clientId) {
    throw new AppError("Client ID is required", 400);
  }

  if (typeof isActive !== "boolean") {
    throw new AppError("isActive must be a boolean value", 400);
  }

  const client = await clientManagementService.toggleClientStatus(clientId, isActive);

  res.status(200).json({
    status: "success",
    message: `Client ${isActive ? "activated" : "deactivated"} successfully`,
    data: { client }
  });
});

// Add credits to client
export const addCreditsToClient = catchAsync(async (req: Request, res: Response) => {
  const { clientId } = req.params;
  const { minutes } = req.body;

  if (!clientId) {
    throw new AppError("Client ID is required", 400);
  }

  if (!minutes || Number(minutes) <= 0) {
    throw new AppError("Minutes must be a positive number", 400);
  }

  const client = await clientManagementService.addCreditsToClient(clientId, Number(minutes));

  res.status(200).json({
    status: "success",
    message: "Credits added successfully",
    data: { client }
  });
});

// Bulk operations
export const bulkOperation = catchAsync(async (req: Request, res: Response) => {
  const { clientIds, operation, value } = req.body;

  if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
    throw new AppError("Client IDs array is required", 400);
  }

  if (!operation || !["activate", "deactivate", "addCredits", "delete"].includes(operation)) {
    throw new AppError("Valid operation is required (activate, deactivate, addCredits, delete)", 400);
  }

  if (operation === "addCredits" && (!value || Number(value) <= 0)) {
    throw new AppError("Value is required for addCredits operation", 400);
  }

  const result = await clientManagementService.bulkOperation({
    clientIds,
    operation,
    value: value ? Number(value) : undefined
  });

  res.status(200).json({
    status: "success",
    message: "Bulk operation completed",
    data: result
  });
});

// Get client statistics
export const getClientStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await clientManagementService.getClientStats();

  res.status(200).json({
    status: "success",
    data: { stats }
  });
});

// Delete client
export const deleteClient = catchAsync(async (req: Request, res: Response) => {
  const { clientId } = req.params;

  if (!clientId) {
    throw new AppError("Client ID is required", 400);
  }

  await clientManagementService.deleteClient(clientId);

  res.status(200).json({
    status: "success",
    message: "Client deleted successfully"
  });
});