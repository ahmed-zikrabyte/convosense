import {Router, Request, Response} from "express";
import RetellService from "../../services/retell/retell.service";
import WebhookEvent from "../../../../models/webhook-event.model";
import Call from "../../../../models/call.model";

const router: Router = Router();
const retellService = new RetellService();

interface RetellWebhookPayload {
  event: string;
  call_id: string;
  call_status: string;
  from_number: string;
  to_number: string;
  agent_id: string;
  start_timestamp: number;
  end_timestamp?: number;
  call_duration?: number;
  transcript?: string;
  call_analysis?: any;
  call_cost?: number;
}

router.post("/retell", async (req: Request, res: Response) => {
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers["retell-signature"] as string;
    const timestamp = req.headers["retell-timestamp"] as string;

    if (!signature || !timestamp) {
      return res.status(400).json({
        error: "Missing required headers: retell-signature or retell-timestamp",
      });
    }

    // Verify webhook signature
    const isValid = retellService.verifyWebhookSignature(
      rawBody,
      signature,
      timestamp
    );

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid webhook signature",
      });
    }

    const payload: RetellWebhookPayload = req.body;

    // Store webhook event
    const webhookEvent = new WebhookEvent({
      event_type: payload.event,
      payload: payload,
      processed: false,
    });

    await webhookEvent.save();

    // Process webhook based on event type
    await processRetellWebhook(payload, webhookEvent._id);

    res.status(200).json({message: "Webhook processed successfully"});
  } catch (error) {
    console.error("Error processing Retell webhook:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

async function processRetellWebhook(
  payload: RetellWebhookPayload,
  eventId: string
) {
  try {
    switch (payload.event) {
      case "call_started":
        await handleCallStarted(payload);
        break;

      case "call_ended":
        await handleCallEnded(payload);
        break;

      case "call_analyzed":
        await handleCallAnalyzed(payload);
        break;

      default:
        console.log(`Unhandled webhook event: ${payload.event}`);
    }

    // Mark webhook event as processed
    await WebhookEvent.findByIdAndUpdate(eventId, {processed: true});
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Keep webhook event as unprocessed for retry
  }
}

async function handleCallStarted(payload: RetellWebhookPayload) {
  let existingCall = await Call.findOne({retell_call_id: payload.call_id});

  if (!existingCall) {
    // Try to find by phone numbers and recent timestamp for calls from batch
    existingCall = await Call.findOne({
      to: payload.to_number,
      from: payload.from_number,
      agent_id: payload.agent_id,
      status: "initiated",
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Within last 2 hours
    }).sort({ createdAt: -1 });
  }

  if (existingCall) {
    existingCall.status = "in_progress";
    existingCall.retell_call_id = payload.call_id;
    existingCall.start_ts = new Date(payload.start_timestamp);
    await existingCall.save();
  } else {
    // Create new call record if it doesn't exist (for calls not from our batch system)
    const newCall = new Call({
      retell_call_id: payload.call_id,
      agent_id: payload.agent_id,
      from: payload.from_number,
      to: payload.to_number,
      start_ts: new Date(payload.start_timestamp),
      status: "in_progress",
      direction: "outbound",
      metadata: {
        attempt_number: 1,
      },
    });
    await newCall.save();
  }
}

async function handleCallEnded(payload: RetellWebhookPayload) {
  let call = await Call.findOne({retell_call_id: payload.call_id});

  if (!call) {
    // If call not found by retell_call_id, try to find by phone numbers and recent timestamp
    call = await Call.findOne({
      to: payload.to_number,
      from: payload.from_number,
      agent_id: payload.agent_id,
      status: { $in: ["initiated", "in_progress", "ringing", "answered"] },
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Within last 2 hours
    }).sort({ createdAt: -1 });
  }

  if (call) {
    // Fetch detailed call data from Retell
    const detailedCallData = await retellService.getCallDetails(payload.call_id);

    // Map RetellAI status to our call status enum
    const statusMap: { [key: string]: string } = {
      "ended": "completed",
      "call_failed": "failed",
      "no_answer": "no_answer",
      "busy": "busy",
      "voicemail": "voicemail",
      "answered": "completed"
    };

    const mappedStatus = statusMap[detailedCallData.call_status] || "completed";
    call.status = mappedStatus as any;
    call.retell_call_id = payload.call_id;

    // Update call with detailed data from Retell API
    if (detailedCallData.start_timestamp) {
      call.start_ts = new Date(detailedCallData.start_timestamp);
    }
    if (detailedCallData.end_timestamp) {
      call.end_ts = new Date(detailedCallData.end_timestamp);
    }

    call.duration_ms = detailedCallData.duration_ms || 0;
    call.duration_seconds = Math.floor((detailedCallData.duration_ms || 0) / 1000);
    call.transcript = detailedCallData.transcript || "";
    call.transcript_object = detailedCallData.transcript_object || [];

    // Store call analysis
    if (detailedCallData.call_analysis) {
      call.call_analysis = {
        ...call.call_analysis,
        sentiment: detailedCallData.call_analysis.user_sentiment?.toLowerCase() as "positive" | "negative" | "neutral" | undefined,
        summary: detailedCallData.call_analysis.call_summary,
        in_voicemail: detailedCallData.call_analysis.in_voicemail,
        call_successful: detailedCallData.call_analysis.call_successful,
        user_sentiment: detailedCallData.call_analysis.user_sentiment,
        custom_analysis_data: detailedCallData.call_analysis.custom_analysis_data,
      };
    }

    // Store costs
    if (detailedCallData.call_cost) {
      call.retell_cost = detailedCallData.call_cost.combined_cost || 0;
      call.call_cost = call.retell_cost * 1.2; // Add 20% markup
      call.client_cost = call.call_cost;
    }

    // Store metadata
    call.metadata = {
      ...call.metadata,
      recording_url: detailedCallData.recording_url,
      recording_multi_channel_url: detailedCallData.recording_multi_channel_url,
      public_log_url: detailedCallData.public_log_url,
      disconnect_reason: detailedCallData.disconnection_reason,
      telephony_session_id: (detailedCallData as any).telephony_session_id || null,
      llm_token_usage: detailedCallData.llm_token_usage,
      latency: detailedCallData.latency,
    };

    await call.save();
  }
}

async function handleCallAnalyzed(payload: RetellWebhookPayload) {
  const call = await Call.findOne({call_id: payload.call_id});

  if (call) {
    call.transcript = payload.transcript || "";
    call.call_analysis = payload.call_analysis || {};

    await call.save();
  }
}

export default router;
