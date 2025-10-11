import axiosInstance from "../axios";

export interface CallReport {
  _id: string;
  call_id: string;
  campaign_id: string;
  campaign_contact_id?: string;
  agent_id: string;
  agent_name?: string;
  from: string;
  to: string;
  start_ts?: string;
  end_ts?: string;
  duration_ms: number;
  duration_seconds: number;
  call_cost: number;
  retell_cost: number;
  client_cost: number;
  transcript?: string;
  transcript_object?: any[];
  call_analysis: {
    sentiment?: "positive" | "negative" | "neutral";
    keywords?: string[];
    summary?: string;
    outcome?: "completed" | "voicemail" | "no_answer" | "busy" | "failed" | "hung_up";
    conversion_score?: number;
    in_voicemail?: boolean;
    call_successful?: boolean;
    user_sentiment?: string;
    custom_analysis_data?: any;
  };
  status: "initiated" | "ringing" | "answered" | "in_progress" | "completed" | "failed" | "no_answer" | "busy" | "voicemail";
  retell_call_id?: string;
  batch_call_id?: string;
  direction: "inbound" | "outbound";
  metadata: {
    attempt_number: number;
    user_agent?: string;
    disconnect_reason?: string;
    quality_score?: number;
    recording_url?: string;
    recording_multi_channel_url?: string;
    public_log_url?: string;
    telephony_identifier?: any;
    llm_token_usage?: any;
    latency?: any;
  };
  retell_llm_dynamic_variables?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CallReportsStats {
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  total_duration: number;
  total_cost: number;
  average_duration: number;
  success_rate: number;
  by_status: Record<string, number>;
  by_outcome: Record<string, number>;
}

export interface CallReportsFilters {
  campaign_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface CallReportsResponse {
  calls: CallReport[];
  total: number;
  currentPage: number;
  totalPages: number;
  stats: CallReportsStats;
}

export interface CallTranscriptResponse {
  transcript: string;
  transcript_object: any[];
}

export interface CallRecordingResponse {
  recording_url?: string;
  recording_multi_channel_url?: string;
}

class CallReportsAPI {
  private basePath = "/client/call-reports";

  async getCallReports(filters: CallReportsFilters = {}): Promise<CallReportsResponse> {
    const params = new URLSearchParams();

    if (filters.campaign_id) params.append("campaign_id", filters.campaign_id);
    if (filters.status) params.append("status", filters.status);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);

    const response = await axiosInstance.get(
      `${this.basePath}${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data.data;
  }

  async getCallReportsByCampaign(
    campaignId: string,
    filters: Omit<CallReportsFilters, "campaign_id"> = {}
  ): Promise<CallReportsResponse> {
    const params = new URLSearchParams();

    if (filters.status) params.append("status", filters.status);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);

    const response = await axiosInstance.get(
      `${this.basePath}/campaign/${campaignId}${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data.data;
  }

  async getCallReport(callId: string): Promise<CallReport> {
    const response = await axiosInstance.get(`${this.basePath}/${callId}`);
    return response.data.data;
  }

  async getCallTranscript(callId: string): Promise<CallTranscriptResponse> {
    const response = await axiosInstance.get(`${this.basePath}/${callId}/transcript`);
    return response.data.data;
  }

  async getCallRecording(callId: string): Promise<CallRecordingResponse> {
    const response = await axiosInstance.get(`${this.basePath}/${callId}/recording`);
    return response.data.data;
  }
}

export const callReportsAPI = new CallReportsAPI();