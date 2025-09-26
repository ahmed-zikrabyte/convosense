import PhoneNumber, { IPhoneNumber } from "../../../../models/phone-number.model";
import Client from "../../../../models/client.model";
import AppError from "../../../../utils/AppError";

export interface PhoneNumberFilters {
  search?: string;
  provider?: "retell" | "twilio" | "manual";
  type?: "local" | "toll_free" | "international";
  isActive?: boolean;
  assigned?: boolean;
  assignedClientId?: string;
  country?: string;
  purchasedBefore?: Date;
  purchasedAfter?: Date;
}

export interface PhoneNumberCreateData {
  phone_number: string;
  provider: "retell" | "twilio" | "manual";
  type: "local" | "toll_free" | "international";
  imported?: boolean;
  metadata?: {
    country_code?: string;
    region?: string;
    capabilities?: string[];
    monthly_cost?: number;
    setup_cost?: number;
  };
}

export interface PhoneNumberUpdateData {
  provider?: "retell" | "twilio" | "manual";
  type?: "local" | "toll_free" | "international";
  is_active?: boolean;
  metadata?: {
    country_code?: string;
    region?: string;
    capabilities?: string[];
    monthly_cost?: number;
    setup_cost?: number;
  };
}

export interface BulkPhoneNumberOperation {
  phoneNumberIds: string[];
  operation: "activate" | "deactivate" | "unassign" | "delete" | "assign";
  clientId?: string; // For assign operation
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class PhoneNumberManagementService {
  async getAllPhoneNumbers(
    filters: PhoneNumberFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ) {
    const query: any = {};

    // Apply filters
    if (filters.search) {
      query.phone_number = { $regex: filters.search, $options: "i" };
    }

    if (filters.provider) {
      query.provider = filters.provider;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      query.is_active = filters.isActive;
    }

    if (filters.assigned !== undefined) {
      if (filters.assigned) {
        query.assigned_client_id = { $exists: true, $ne: null };
      } else {
        query.assigned_client_id = { $exists: false };
      }
    }

    if (filters.assignedClientId) {
      query.assigned_client_id = filters.assignedClientId;
    }

    if (filters.country) {
      query["metadata.country_code"] = filters.country.toUpperCase();
    }

    if (filters.purchasedAfter || filters.purchasedBefore) {
      query.purchased_at = {};
      if (filters.purchasedAfter) {
        query.purchased_at.$gte = filters.purchasedAfter;
      }
      if (filters.purchasedBefore) {
        query.purchased_at.$lte = filters.purchasedBefore;
      }
    }

    const { page, limit, sortBy = "purchased_at", sortOrder = "desc" } = pagination;
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [phoneNumbers, totalCount] = await Promise.all([
      PhoneNumber.find(query)
        .populate("assigned_client_id", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      PhoneNumber.countDocuments(query)
    ]);

    return {
      phoneNumbers: phoneNumbers.map(phone => ({
        ...phone,
        isAvailable: phone.is_active && !phone.assigned_client_id
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    };
  }

  async getPhoneNumberById(phoneNumberId: string) {
    const phoneNumber = await PhoneNumber.findById(phoneNumberId)
      .populate("assigned_client_id", "name email");

    if (!phoneNumber) {
      throw new AppError("Phone number not found", 404);
    }

    return {
      ...phoneNumber.toJSON(),
      isAvailable: phoneNumber.isAvailable()
    };
  }

  async createPhoneNumber(phoneData: PhoneNumberCreateData) {
    // Check if phone number already exists
    const existingPhone = await PhoneNumber.findOne({
      phone_number: phoneData.phone_number
    });

    if (existingPhone) {
      throw new AppError("Phone number already exists", 400);
    }

    const phoneNumber = new PhoneNumber({
      ...phoneData,
      purchased_at: new Date(),
      is_active: true
    });

    await phoneNumber.save();
    return phoneNumber.toJSON();
  }

  async updatePhoneNumber(phoneNumberId: string, updateData: PhoneNumberUpdateData) {
    const phoneNumber = await PhoneNumber.findById(phoneNumberId);
    if (!phoneNumber) {
      throw new AppError("Phone number not found", 404);
    }

    Object.assign(phoneNumber, updateData);
    await phoneNumber.save();

    return phoneNumber.toJSON();
  }

  async assignPhoneNumberToClient(phoneNumberId: string, clientId: string) {
    const [phoneNumber, client] = await Promise.all([
      PhoneNumber.findById(phoneNumberId),
      Client.findById(clientId)
    ]);

    if (!phoneNumber) {
      throw new AppError("Phone number not found", 404);
    }

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    if (!phoneNumber.is_active) {
      throw new AppError("Cannot assign inactive phone number", 400);
    }

    if (phoneNumber.assigned_client_id) {
      throw new AppError("Phone number is already assigned", 400);
    }

    phoneNumber.assignToClient(clientId);
    await phoneNumber.save();

    return {
      ...phoneNumber.toJSON(),
      assigned_client: {
        _id: client._id,
        name: client.name,
        email: client.email
      }
    };
  }

  async unassignPhoneNumber(phoneNumberId: string) {
    const phoneNumber = await PhoneNumber.findById(phoneNumberId);
    if (!phoneNumber) {
      throw new AppError("Phone number not found", 404);
    }

    if (!phoneNumber.assigned_client_id) {
      throw new AppError("Phone number is not assigned", 400);
    }

    phoneNumber.unassign();
    await phoneNumber.save();

    return phoneNumber.toJSON();
  }

  async bulkOperation(operation: BulkPhoneNumberOperation) {
    const { phoneNumberIds, operation: op, clientId } = operation;

    if (!phoneNumberIds || phoneNumberIds.length === 0) {
      throw new AppError("No phone number IDs provided", 400);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const phoneNumberId of phoneNumberIds) {
      try {
        switch (op) {
          case "activate":
            await this.updatePhoneNumber(phoneNumberId, { is_active: true });
            break;
          case "deactivate":
            await this.updatePhoneNumber(phoneNumberId, { is_active: false });
            break;
          case "unassign":
            await this.unassignPhoneNumber(phoneNumberId);
            break;
          case "assign":
            if (!clientId) {
              throw new Error("Client ID is required for assign operation");
            }
            await this.assignPhoneNumberToClient(phoneNumberId, clientId);
            break;
          case "delete":
            await PhoneNumber.findByIdAndDelete(phoneNumberId);
            break;
          default:
            throw new Error("Invalid operation");
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Phone ${phoneNumberId}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return results;
  }

  async getAvailablePhoneNumbers(type?: string, country?: string) {
    const query: any = {
      is_active: true,
      assigned_client_id: { $exists: false }
    };

    if (type) {
      query.type = type;
    }

    if (country) {
      query["metadata.country_code"] = country.toUpperCase();
    }

    const phoneNumbers = await PhoneNumber.find(query).sort({ purchased_at: -1 });
    return phoneNumbers;
  }

  async getClientPhoneNumbers(clientId: string) {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new AppError("Client not found", 404);
    }

    const phoneNumbers = await PhoneNumber.find({
      assigned_client_id: clientId
    }).sort({ assigned_at: -1 });

    return phoneNumbers;
  }

  async getPhoneNumberStats() {
    const [
      totalPhoneNumbers,
      activePhoneNumbers,
      assignedPhoneNumbers,
      availablePhoneNumbers,
      typeBreakdown,
      providerBreakdown,
      totalMonthlyCost
    ] = await Promise.all([
      PhoneNumber.countDocuments(),
      PhoneNumber.countDocuments({ is_active: true }),
      PhoneNumber.countDocuments({
        assigned_client_id: { $exists: true, $ne: null }
      }),
      PhoneNumber.countDocuments({
        is_active: true,
        assigned_client_id: { $exists: false }
      }),
      PhoneNumber.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ]),
      PhoneNumber.aggregate([
        { $group: { _id: "$provider", count: { $sum: 1 } } }
      ]),
      PhoneNumber.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$metadata.monthly_cost" }
          }
        }
      ])
    ]);

    return {
      totalPhoneNumbers,
      activePhoneNumbers,
      assignedPhoneNumbers,
      availablePhoneNumbers,
      typeBreakdown: typeBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      providerBreakdown: providerBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      totalMonthlyCost: totalMonthlyCost[0]?.total || 0
    };
  }

  async deletePhoneNumber(phoneNumberId: string) {
    const phoneNumber = await PhoneNumber.findById(phoneNumberId);
    if (!phoneNumber) {
      throw new AppError("Phone number not found", 404);
    }

    // Check if phone number is assigned
    if (phoneNumber.assigned_client_id) {
      throw new AppError("Cannot delete assigned phone number. Unassign first.", 400);
    }

    await PhoneNumber.findByIdAndDelete(phoneNumberId);
    return { message: "Phone number deleted successfully" };
  }

  async purchasePhoneNumber(
    phoneData: PhoneNumberCreateData & {
      setupCost?: number;
      monthlyCost?: number;
    }
  ) {
    // This would integrate with phone number providers (Twilio, RetellAI, etc.)
    // For now, we'll just create the record

    const phoneNumber = await this.createPhoneNumber({
      ...phoneData,
      metadata: {
        ...phoneData.metadata,
        setup_cost: phoneData.setupCost,
        monthly_cost: phoneData.monthlyCost
      }
    });

    return phoneNumber;
  }
}

export default new PhoneNumberManagementService();