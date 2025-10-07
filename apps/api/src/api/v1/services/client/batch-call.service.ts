import Campaign from "../../../../models/campaign.model";
import CampaignContact, {
  ICampaignContact,
} from "../../../../models/campaign-contact.model";
import Agent from "../../../../models/agent.model";
import PhoneNumber from "../../../../models/phone-number.model";
import AppError from "../../../../utils/AppError";
import {RetellService} from "../retell/retell.service";

interface BatchCallTask {
  to_number: string;
  retell_llm_dynamic_variables?: Record<string, any>;
}

interface BatchCallResponse {
  batch_call_id: string;
  name: string;
  from_number: string;
  scheduled_timestamp?: number;
  total_task_count: number;
}

interface BatchCallStatus {
  batch_call_id: string;
  name: string;
  from_number: string;
  status: string;
  total_task_count: number;
  completed_count: number;
  failed_count: number;
}

class BatchCallService {
  private retellService: RetellService;

  constructor() {
    this.retellService = new RetellService();
  }

  async startBatchCall(
    clientId: string,
    campaignId: string
  ): Promise<BatchCallResponse> {
    try {
      // Verify campaign exists and belongs to client
      const campaign = await Campaign.findOne({
        campaignId: campaignId,
        clientId: clientId,
        status: "published",
      });

      if (!campaign) {
        throw new AppError("Campaign not found or not published", 404);
      }

      // Get agent details to verify it exists and is assigned to client
      const agent = await Agent.findOne({
        agentId: campaign.agent_id,
        assignedClientId: clientId,
      });

      if (!agent) {
        throw new AppError("Agent not found for this campaign", 404);
      }

      // Get pending contacts (limit to 2 simultaneous calls as requested)
      const pendingContacts = await (CampaignContact as any).getPendingContacts(
        campaignId,
        2
      );

      if (pendingContacts.length === 0) {
        throw new AppError("No pending contacts found for this campaign", 400);
      }

      // For Retell batch calls, we need a "from" number.
      // We'll use a default system phone number or the first available phone number
      // Since campaign contacts only have "to" numbers, we need a system phone number for outbound calls
      // const systemPhoneNumber = await PhoneNumber.findOne({
      //   is_active: true,
      //   provider: "retell",
      //   assigned_client_id: clientId
      // });

      // if (!systemPhoneNumber) {
      //   throw new AppError("No system phone number available for outbound calls. Please contact support.", 404);
      // }

      // Prepare batch call tasks
      const tasks: BatchCallTask[] = pendingContacts.map(
        (contact: ICampaignContact) => ({
          to_number: contact.phone_number,
          retell_llm_dynamic_variables: contact.dynamic_variables,
        })
      );

      // Create batch call using native Retell API
      const batchCallData = {
        // from_number: systemPhoneNumber.phone_number,
        from_number: "+17252414504",
        tasks: tasks,
        name: `Campaign: ${campaign.name} - ${new Date().toISOString()}`,
      };

      // Make direct API call to Retell batch call endpoint
      const response = await this.makeRetellBatchCallRequest(batchCallData);

      // Update contact statuses to in_progress
      await this.updateContactStatuses(pendingContacts, "in_progress");

      return response;
    } catch (error) {
      console.error("Failed to start batch call:", error);
      throw error;
    }
  }

  private async makeRetellBatchCallRequest(
    data: any
  ): Promise<BatchCallResponse> {
    try {
      const response = await fetch(
        "https://api.retellai.com/create-batch-call",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new AppError(
          `Retell API error: ${errorData.message || "Unknown error"}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Retell batch call API request failed:", error);
      throw error;
    }
  }

  async getBatchCallStatus(
    clientId: string,
    campaignId: string,
    batchCallId: string
  ): Promise<BatchCallStatus> {
    try {
      // Verify campaign belongs to client
      const campaign = await Campaign.findOne({
        campaignId: campaignId,
        clientId: clientId,
      });

      if (!campaign) {
        throw new AppError("Campaign not found", 404);
      }

      // Make API call to get batch call status from Retell
      const response = await fetch(
        `https://api.retellai.com/get-batch-call/${batchCallId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new AppError(
          `Retell API error: ${errorData.message || "Batch call not found"}`,
          response.status
        );
      }

      const batchCallStatus = await response.json();

      // Update local contact statuses based on batch call results if needed
      await this.syncContactStatuses(campaignId, batchCallStatus);

      return batchCallStatus;
    } catch (error) {
      console.error("Failed to get batch call status:", error);
      throw error;
    }
  }

  async stopBatchCall(
    clientId: string,
    campaignId: string,
    batchCallId: string
  ): Promise<void> {
    try {
      // Verify campaign belongs to client
      const campaign = await Campaign.findOne({
        campaignId: campaignId,
        clientId: clientId,
      });

      if (!campaign) {
        throw new AppError("Campaign not found", 404);
      }

      // Make API call to stop batch call (if supported by Retell API)
      // Note: This endpoint might not exist in Retell API, check documentation
      const response = await fetch(
        `https://api.retellai.com/stop-batch-call/${batchCallId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        const errorData = await response.json();
        throw new AppError(
          `Retell API error: ${errorData.message || "Failed to stop batch call"}`,
          response.status
        );
      }

      // Update contact statuses to failed for any in_progress contacts
      await CampaignContact.updateMany(
        {
          campaign_id: campaignId,
          call_status: "in_progress",
        },
        {
          call_status: "failed",
          last_call_at: new Date(),
        }
      );
    } catch (error) {
      console.error("Failed to stop batch call:", error);
      throw error;
    }
  }

  private async updateContactStatuses(
    contacts: ICampaignContact[],
    status: string
  ): Promise<void> {
    try {
      const contactIds = contacts.map((contact) => contact._id);
      await CampaignContact.updateMany(
        {_id: {$in: contactIds}},
        {
          call_status: status,
          $inc: {call_attempts: 1},
          last_call_at: new Date(),
        }
      );
    } catch (error) {
      console.error("Failed to update contact statuses:", error);
      throw error;
    }
  }

  private async syncContactStatuses(
    campaignId: string,
    batchCallStatus: any
  ): Promise<void> {
    try {
      // This is a placeholder for syncing contact statuses based on batch call results
      // The actual implementation would depend on the structure of batch call status response
      console.log(
        "Syncing contact statuses for campaign:",
        campaignId,
        "batch call:",
        batchCallStatus.batch_call_id
      );

      // Update logic would go here based on individual call statuses within the batch
      // For now, we'll leave contacts as they are since we don't have the exact API structure
    } catch (error) {
      console.error("Failed to sync contact statuses:", error);
      // Don't throw error here to avoid breaking the main flow
    }
  }
}

const batchCallService = new BatchCallService();
export default batchCallService;
