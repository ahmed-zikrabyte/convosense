import CampaignContact, { ICampaignContact } from "../../../../models/campaign-contact.model";
import Campaign from "../../../../models/campaign.model";
import AppError from "../../../../utils/AppError";

interface ContactFilters {
  page: number;
  limit: number;
  status?: string;
}

interface UploadResult {
  imported: number;
  errors: string[];
  duplicates: number;
  invalid: number;
}

interface ContactData {
  phone_number: string;
  dynamic_variables: Record<string, string>;
}

class CampaignContactService {
  async uploadContactsFromCSV(
    clientId: string,
    campaignId: string,
    csvBuffer: Buffer
  ): Promise<UploadResult> {
    // First verify the campaign exists and belongs to the client
    const campaign = await Campaign.findOne({
      campaignId,
      clientId,
    });

    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    const csvContent = csvBuffer.toString('utf-8');
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length === 0) {
      throw new AppError("CSV file is empty", 400);
    }

    // Parse header row
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];

    if (headers.length === 0 || !headers[0]) {
      throw new AppError("CSV file must have a header row", 400);
    }

    // Validate that the first column is for phone numbers
    const phoneColumnName = headers[0].toLowerCase();
    if (!phoneColumnName.includes('phone')) {
      throw new AppError("First column must be 'phone number' or similar", 400);
    }

    const result: UploadResult = {
      imported: 0,
      errors: [],
      duplicates: 0,
      invalid: 0,
    };

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      try {
        const values = this.parseCSVLine(line);

        if (values.length === 0 || !values[0]) {
          continue; // Skip empty rows
        }

        const phoneNumber = this.normalizePhoneNumber(values[0]);
        if (!phoneNumber) {
          result.errors.push(`Row ${i + 1}: Invalid phone number format`);
          result.invalid++;
          continue;
        }

        // Build dynamic variables object
        const dynamicVariables: Record<string, string> = {};
        for (let j = 1; j < Math.min(values.length, headers.length); j++) {
          const headerKey = headers[j];
          const value = values[j];
          if (value && headerKey) {
            dynamicVariables[headerKey] = value;
          }
        }

        // Check if contact already exists for this campaign
        const existingContact = await CampaignContact.findOne({
          campaign_id: campaignId,
          phone_number: phoneNumber,
        });

        if (existingContact) {
          result.duplicates++;
          continue;
        }

        // Create new contact
        await CampaignContact.create({
          campaign_id: campaignId,
          client_id: clientId,
          phone_number: phoneNumber,
          dynamic_variables: dynamicVariables,
        });

        result.imported++;
      } catch (error: any) {
        result.errors.push(`Row ${i + 1}: ${error.message}`);
        result.invalid++;
      }
    }

    return result;
  }

  async getContacts(
    clientId: string,
    campaignId: string,
    filters: ContactFilters
  ): Promise<{
    contacts: ICampaignContact[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalContacts: number;
      limit: number;
    };
  }> {
    // Verify campaign exists and belongs to client
    const campaign = await Campaign.findOne({
      campaignId,
      clientId,
    });

    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    const query: any = {
      campaign_id: campaignId,
      is_active: true,
    };

    if (filters.status) {
      query.call_status = filters.status;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [contacts, totalContacts] = await Promise.all([
      CampaignContact.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit),
      CampaignContact.countDocuments(query),
    ]);

    return {
      contacts,
      pagination: {
        currentPage: filters.page,
        totalPages: Math.ceil(totalContacts / filters.limit),
        totalContacts,
        limit: filters.limit,
      },
    };
  }

  async deleteContact(
    clientId: string,
    campaignId: string,
    contactId: string
  ): Promise<void> {
    // Verify campaign exists and belongs to client
    const campaign = await Campaign.findOne({
      campaignId,
      clientId,
    });

    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    const contact = await CampaignContact.findOne({
      _id: contactId,
      campaign_id: campaignId,
    });

    if (!contact) {
      throw new AppError("Contact not found", 404);
    }

    await CampaignContact.findByIdAndDelete(contactId);
  }

  async updateContact(
    clientId: string,
    campaignId: string,
    contactId: string,
    updateData: Partial<ICampaignContact>
  ): Promise<ICampaignContact> {
    // Verify campaign exists and belongs to client
    const campaign = await Campaign.findOne({
      campaignId,
      clientId,
    });

    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    const contact = await CampaignContact.findOneAndUpdate(
      {
        _id: contactId,
        campaign_id: campaignId,
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!contact) {
      throw new AppError("Contact not found", 404);
    }

    return contact;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values.map(v => v.replace(/^"|"$/g, '')); // Remove surrounding quotes
  }

  private normalizePhoneNumber(phone: string): string | null {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // If it doesn't start with +, add +1 for US numbers
    let normalized = cleaned;
    if (!normalized.startsWith('+')) {
      if (normalized.length === 10) {
        normalized = '+1' + normalized;
      } else if (normalized.length === 11 && normalized.startsWith('1')) {
        normalized = '+' + normalized;
      } else {
        return null; // Invalid format
      }
    }

    // Validate E.164 format
    if (!/^\+[1-9]\d{1,14}$/.test(normalized)) {
      return null;
    }

    return normalized;
  }
}

export default new CampaignContactService();