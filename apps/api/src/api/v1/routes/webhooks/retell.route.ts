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
  const existingCall = await Call.findOne({call_id: payload.call_id});

  if (existingCall) {
    existingCall.status = "in_progress";
    existingCall.start_ts = new Date(payload.start_timestamp);
    await existingCall.save();
  } else {
    // Create new call record if it doesn't exist
    const newCall = new Call({
      call_id: payload.call_id,
      agent_id: payload.agent_id,
      from: payload.from_number,
      to: payload.to_number,
      start_ts: new Date(payload.start_timestamp),
      status: "in_progress",
    });
    await newCall.save();
  }
}

async function handleCallEnded(payload: RetellWebhookPayload) {
  const call = await Call.findOne({call_id: payload.call_id});

  if (call) {
    // Map RetellAI status to our call status enum
    const statusMap: { [key: string]: string } = {
      "call_ended": "completed",
      "call_failed": "failed",
      "no_answer": "no_answer",
      "busy": "busy",
      "voicemail": "voicemail",
      "answered": "completed"
    };

    const mappedStatus = statusMap[payload.call_status] || "completed";
    call.status = mappedStatus as any;

    call.end_ts = payload.end_timestamp
      ? new Date(payload.end_timestamp)
      : new Date();
    call.duration_seconds = payload.call_duration || 0;
    call.call_cost = payload.call_cost || 0;
    call.retell_cost = payload.call_cost || 0;

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
