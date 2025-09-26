import Client, { IClient } from "../../../../models/client.model";
import AppError from "../../../../utils/AppError";

export interface ClientFilters {
  search?: string;
  isActive?: boolean;
  minCredits?: number;
  maxCredits?: number;
  createdBefore?: Date;
  createdAfter?: Date;
}

export interface ClientCreateData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  credits_total_minutes?: number;
  billing_rate?: number;
  isActive?: boolean;
}

export interface ClientUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  credits_total_minutes?: number;
  billing_rate?: number;
  isActive?: boolean;
}

export interface BulkOperation {
  clientIds: string[];
  operation: "activate" | "deactivate" | "addCredits" | "delete";
  value?: number; // For addCredits operation
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class ClientManagementService {
  async getAllClients(
    filters: ClientFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ) {
    const query: any = {};

    // Apply filters
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
        { phone: { $regex: filters.search, $options: "i" } }
      ];
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.minCredits !== undefined || filters.maxCredits !== undefined) {
      query.credits_total_minutes = {};
      if (filters.minCredits !== undefined) {
        query.credits_total_minutes.$gte = filters.minCredits;
      }
      if (filters.maxCredits !== undefined) {
        query.credits_total_minutes.$lte = filters.maxCredits;
      }
    }

    if (filters.createdAfter || filters.createdBefore) {
      query.createdAt = {};
      if (filters.createdAfter) {
        query.createdAt.$gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        query.createdAt.$lte = filters.createdBefore;
      }
    }

    const { page, limit, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [clients, totalCount] = await Promise.all([
      Client.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("+password") // Explicitly exclude password in toJSON method
        .lean(),
      Client.countDocuments(query)
    ]);

    return {
      clients: clients.map(client => {
        const { password, ...clientWithoutPassword } = client;
        return {
          ...clientWithoutPassword,
          availableCredits: client.credits_total_minutes - client.credits_reserved_minutes - client.credits_consumed_minutes
        };
      }),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    };
  }

  async getClientById(clientId: string) {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new AppError("Client not found", 404);
    }

    return {
      ...client.toJSON(),
      availableCredits: client.getAvailableCredits()
    };
  }

  async createClient(clientData: ClientCreateData) {
    // Check if email already exists
    const existingClient = await Client.findOne({ email: clientData.email });
    if (existingClient) {
      throw new AppError("Client with this email already exists", 400);
    }

    const client = new Client({
      ...clientData,
      credits_total_minutes: clientData.credits_total_minutes || 0,
      billing_rate: clientData.billing_rate || 0.10,
      isActive: clientData.isActive !== false // Default to true unless explicitly false
    });

    await client.save();

    return {
      ...client.toJSON(),
      availableCredits: client.getAvailableCredits()
    };
  }

  async updateClient(clientId: string, updateData: ClientUpdateData) {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new AppError("Client not found", 404);
    }

    // If email is being updated, check for duplicates
    if (updateData.email && updateData.email !== client.email) {
      const existingClient = await Client.findOne({ email: updateData.email });
      if (existingClient) {
        throw new AppError("Client with this email already exists", 400);
      }
    }

    Object.assign(client, updateData);
    await client.save();

    return {
      ...client.toJSON(),
      availableCredits: client.getAvailableCredits()
    };
  }

  async toggleClientStatus(clientId: string, isActive: boolean) {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new AppError("Client not found", 404);
    }

    client.isActive = isActive;
    await client.save();

    return {
      ...client.toJSON(),
      availableCredits: client.getAvailableCredits()
    };
  }

  async addCreditsToClient(clientId: string, minutes: number) {
    if (minutes <= 0) {
      throw new AppError("Minutes must be greater than 0", 400);
    }

    const client = await Client.findById(clientId);
    if (!client) {
      throw new AppError("Client not found", 404);
    }

    client.credits_total_minutes += minutes;
    await client.save();

    return {
      ...client.toJSON(),
      availableCredits: client.getAvailableCredits()
    };
  }

  async bulkOperation(operation: BulkOperation) {
    const { clientIds, operation: op, value } = operation;

    if (!clientIds || clientIds.length === 0) {
      throw new AppError("No client IDs provided", 400);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const clientId of clientIds) {
      try {
        switch (op) {
          case "activate":
            await this.toggleClientStatus(clientId, true);
            break;
          case "deactivate":
            await this.toggleClientStatus(clientId, false);
            break;
          case "addCredits":
            if (!value || value <= 0) {
              throw new Error("Invalid credit amount");
            }
            await this.addCreditsToClient(clientId, value);
            break;
          case "delete":
            await Client.findByIdAndDelete(clientId);
            break;
          default:
            throw new Error("Invalid operation");
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Client ${clientId}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return results;
  }

  async getClientStats() {
    const [
      totalClients,
      activeClients,
      inactiveClients,
      totalCreditsDistributed,
      totalCreditsConsumed,
      totalCreditsReserved
    ] = await Promise.all([
      Client.countDocuments(),
      Client.countDocuments({ isActive: true }),
      Client.countDocuments({ isActive: false }),
      Client.aggregate([{ $group: { _id: null, total: { $sum: "$credits_total_minutes" } } }]),
      Client.aggregate([{ $group: { _id: null, total: { $sum: "$credits_consumed_minutes" } } }]),
      Client.aggregate([{ $group: { _id: null, total: { $sum: "$credits_reserved_minutes" } } }])
    ]);

    return {
      totalClients,
      activeClients,
      inactiveClients,
      totalCreditsDistributed: totalCreditsDistributed[0]?.total || 0,
      totalCreditsConsumed: totalCreditsConsumed[0]?.total || 0,
      totalCreditsReserved: totalCreditsReserved[0]?.total || 0,
      availableCredits: (totalCreditsDistributed[0]?.total || 0) - (totalCreditsConsumed[0]?.total || 0) - (totalCreditsReserved[0]?.total || 0)
    };
  }

  async deleteClient(clientId: string) {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new AppError("Client not found", 404);
    }

    // Check if client has reserved credits
    if (client.credits_reserved_minutes > 0) {
      throw new AppError("Cannot delete client with reserved credits", 400);
    }

    await Client.findByIdAndDelete(clientId);
    return { message: "Client deleted successfully" };
  }
}

export default new ClientManagementService();