import Campaign from "../../../../models/campaign.model";
import CampaignContact, {
  ICampaignContact,
} from "../../../../models/campaign-contact.model";
import Agent from "../../../../models/agent.model";
import PhoneNumber from "../../../../models/phone-number.model";
import Call from "../../../../models/call.model";
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
      console.log("📞 [startBatchCall] Making Retell batch call request with data:", {
        from_number: batchCallData.from_number,
        task_count: batchCallData.tasks.length,
        name: batchCallData.name
      });
      const response = await this.makeRetellBatchCallRequest(batchCallData);
      console.log("✅ [startBatchCall] Retell batch call created successfully:", {
        batch_call_id: response.batch_call_id,
        total_task_count: response.total_task_count
      });

      // Create call records for tracking
      console.log("📝 Creating call records for batch:", response.batch_call_id);
      await this.createCallRecords(
        pendingContacts,
        campaign,
        agent,
        response.batch_call_id,
        batchCallData.from_number
      );
      console.log("✅ Call records created successfully");

      // Update contact statuses to in_progress
      console.log("📊 Updating contact statuses to in_progress");
      await this.updateContactStatuses(pendingContacts, "in_progress");
      console.log("✅ Contact statuses updated");

      // Start background process to sync call IDs from Retell
      console.log("⏰ Starting background sync process for batch:", response.batch_call_id);
      this.startSyncWithRetry(response.batch_call_id);

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

  private async createCallRecords(
    contacts: ICampaignContact[],
    campaign: any,
    agent: any,
    batchCallId: string,
    fromNumber: string
  ): Promise<void> {
    try {
      console.log("📝 [createCallRecords] Starting with:", {
        contactCount: contacts.length,
        batchCallId,
        fromNumber,
        campaignId: campaign.campaignId
      });

      const callRecords = contacts.map((contact, index) => {
        const record = {
          campaign_id: campaign.campaignId,
          campaign_contact_id: contact._id,
          agent_id: campaign.agent_id,
          agent_name: agent.name || "Unknown",
          from: fromNumber,
          to: contact.phone_number,
          batch_call_id: batchCallId,
          status: "initiated",
          direction: "outbound",
          retell_llm_dynamic_variables: contact.dynamic_variables,
          metadata: {
            attempt_number: contact.call_attempts + 1,
          },
        };
        console.log(`📄 [createCallRecords] Record ${index + 1}:`, {
          to: record.to,
          batch_call_id: record.batch_call_id,
          status: record.status,
          has_call_id: 'call_id' in record
        });
        return record;
      });

      console.log("📦 [createCallRecords] Inserting", callRecords.length, "call records");
      const insertResult = await Call.insertMany(callRecords);
      console.log("✅ [createCallRecords] Successfully inserted", insertResult.length, "call records");

      // Log each inserted record
      insertResult.forEach((record, index) => {
        console.log(`📋 [createCallRecords] Inserted record ${index + 1}:`, {
          _id: record._id,
          call_id: record.call_id,
          to: record.to,
          batch_call_id: record.batch_call_id,
          status: record.status
        });
      });
    } catch (error) {
      console.error("❌ [createCallRecords] Failed to create call records:", error);
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

  private async syncCallIdsFromRetell(batchCallId: string): Promise<void> {
    try {
      console.log("🔄 [syncCallIdsFromRetell] Starting sync for batch:", batchCallId);

      // First, check what we have in the database before sync
      const existingCalls = await Call.find({ batch_call_id: batchCallId });
      console.log("📋 [syncCallIdsFromRetell] Found", existingCalls.length, "existing call records in DB");
      existingCalls.forEach((call, index) => {
        console.log(`  DB Record ${index + 1}:`, {
          _id: call._id,
          call_id: call.call_id,
          to: call.to,
          status: call.status
        });
      });

      // Use Retell SDK to list calls by batch_call_id
      console.log("📞 [syncCallIdsFromRetell] Calling Retell API...");
      const callsResponse = await this.retellService.listCallsByBatchId(batchCallId);
      const calls = callsResponse || [];
      console.log(`📦 [syncCallIdsFromRetell] Found ${calls.length} calls from Retell for batch ${batchCallId}`);

      // Log details of each call from Retell
      calls.forEach((retellCall: any, index: number) => {
        console.log(`📦 [syncCallIdsFromRetell] Retell Call ${index + 1}:`, {
          call_id: retellCall.call_id,
          to_number: retellCall.to_number,
          call_status: retellCall.call_status,
          full_call_data: retellCall
        });
      });

      // Update our call records with Retell call IDs and other data
      for (let i = 0; i < calls.length; i++) {
        const retellCall = calls[i];
        console.log(`🔄 [syncCallIdsFromRetell] Processing call ${i + 1}/${calls.length}:`, {
          batch_call_id: batchCallId,
          to: retellCall.to_number,
          call_id: retellCall.call_id,
          retell_status: retellCall.call_status
        });

        // Check if we can find the matching record
        const existingRecord = await Call.findOne({
          batch_call_id: batchCallId,
          to: retellCall.to_number,
        });

        if (existingRecord) {
          console.log("🔍 [syncCallIdsFromRetell] Found matching record:", {
            _id: existingRecord._id,
            current_call_id: existingRecord.call_id,
            to: existingRecord.to
          });
        } else {
          console.log("⚠️ [syncCallIdsFromRetell] No matching record found for:", retellCall.to_number);
          continue;
        }

        const updateData = {
          call_id: retellCall.call_id,
          retell_call_id: retellCall.call_id,
          status: this.mapRetellStatusToOurStatus(retellCall.call_status),
          start_ts: retellCall.start_timestamp ? new Date(retellCall.start_timestamp) : undefined,
          end_ts: retellCall.end_timestamp ? new Date(retellCall.end_timestamp) : undefined,
          duration_ms: retellCall.duration_ms || 0,
          duration_seconds: retellCall.duration_ms ? Math.floor(retellCall.duration_ms / 1000) : 0,
          transcript: retellCall.transcript,
          transcript_object: retellCall.transcript_object,
          call_analysis: {
            ...retellCall.call_analysis,
            outcome: this.mapRetellOutcome(retellCall.call_analysis?.call_successful, retellCall.disconnection_reason),
          },
          retell_cost: retellCall.call_cost?.combined_cost || 0,
          call_cost: retellCall.call_cost?.combined_cost || 0,
          client_cost: retellCall.call_cost?.combined_cost || 0,
          metadata: {
            attempt_number: 1,
            disconnect_reason: retellCall.disconnection_reason,
            recording_url: retellCall.recording_url,
            recording_multi_channel_url: retellCall.recording_multi_channel_url,
            public_log_url: retellCall.public_log_url,
            telephony_session_id: retellCall.telephony_identifier,
            llm_token_usage: retellCall.llm_token_usage,
            latency: retellCall.latency,
          },
        };

        console.log("📝 [syncCallIdsFromRetell] Update data:", {
          call_id: updateData.call_id,
          status: updateData.status,
          retell_cost: updateData.retell_cost
        });

        const updateResult = await Call.findOneAndUpdate(
          {
            batch_call_id: batchCallId,
            to: retellCall.to_number,
          },
          { $set: updateData },
          { new: true }
        );

        if (updateResult) {
          console.log("✅ [syncCallIdsFromRetell] Successfully updated call record:", {
            _id: updateResult._id,
            call_id: updateResult.call_id,
            to: updateResult.to,
            status: updateResult.status
          });
        } else {
          console.log("❌ [syncCallIdsFromRetell] Failed to update record for:", retellCall.to_number);
        }
      }

      // Final verification - check what we have after sync
      const updatedCalls = await Call.find({ batch_call_id: batchCallId });
      console.log("🔍 [syncCallIdsFromRetell] Final verification - Found", updatedCalls.length, "call records after sync:");
      updatedCalls.forEach((call, index) => {
        console.log(`  Final Record ${index + 1}:`, {
          _id: call._id,
          call_id: call.call_id,
          to: call.to,
          status: call.status,
          has_call_id: !!call.call_id
        });
      });

      console.log(`✅ [syncCallIdsFromRetell] Successfully synced ${calls.length} call IDs from Retell`);
    } catch (error) {
      console.error("❌ [syncCallIdsFromRetell] Failed to sync call IDs from Retell:", error);
      console.error("❌ [syncCallIdsFromRetell] Error stack:", (error as Error).stack);
      // Don't throw error to avoid breaking the main flow
    }
  }

  private mapRetellStatusToOurStatus(retellStatus: string): string {
    const statusMap: Record<string, string> = {
      'registered': 'initiated',
      'ongoing': 'in_progress',
      'ended': 'completed',
      'error': 'failed'
    };
    return statusMap[retellStatus] || 'initiated';
  }

  private async startSyncWithRetry(batchCallId: string): Promise<void> {
    const maxAttempts = 5;
    const delays = [15000, 30000, 60000, 120000, 300000]; // 15s, 30s, 1m, 2m, 5m

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const delay = delays[attempt - 1];
      console.log(`⏰ [startSyncWithRetry] Scheduling attempt ${attempt}/${maxAttempts} after ${delay ? delay/1000 : 0}s delay`);

      setTimeout(async () => {
        try {
          console.log(`🔄 [startSyncWithRetry] Attempt ${attempt}/${maxAttempts} - Syncing call IDs`);
          const calls = await this.retellService.listCallsByBatchId(batchCallId);

          if (calls && calls.length > 0) {
            console.log(`✅ [startSyncWithRetry] Found ${calls.length} calls on attempt ${attempt}, proceeding with sync`);
            await this.syncCallIdsFromRetell(batchCallId);
            return; // Success, stop retrying
          } else {
            console.log(`⏳ [startSyncWithRetry] Attempt ${attempt}: No calls found yet, will retry...`);
            if (attempt === maxAttempts) {
              console.log(`❌ [startSyncWithRetry] All ${maxAttempts} attempts failed. Calls may not have been initiated.`);
            }
          }
        } catch (error) {
          console.error(`❌ [startSyncWithRetry] Attempt ${attempt} failed:`, error);
          if (attempt === maxAttempts) {
            console.log(`❌ [startSyncWithRetry] All ${maxAttempts} attempts failed with errors.`);
          }
        }
      }, delay);
    }
  }

  private mapRetellOutcome(callSuccessful?: boolean, disconnectionReason?: string): string {
    if (callSuccessful === true) return 'completed';
    if (callSuccessful === false) {
      switch (disconnectionReason) {
        case 'user_hangup':
        case 'agent_hangup':
          return 'hung_up';
        case 'call_transfer':
          return 'completed';
        case 'inactivity':
          return 'failed';
        case 'machine_detected':
          return 'voicemail';
        case 'max_duration_reached':
          return 'completed';
        case 'concurrent_limit_reached':
        case 'unknown_error':
        case 'twilio_error':
          return 'failed';
        default:
          return 'failed';
      }
    }
    return 'failed';
  }
}

const batchCallService = new BatchCallService();
export default batchCallService;
