import axiosInstance from "../axios";

export interface BatchCallResponse {
  batch_call_id: string;
  name: string;
  from_number: string;
  scheduled_timestamp?: number;
  total_task_count: number;
}

export interface BatchCallStatus {
  batch_call_id: string;
  name: string;
  from_number: string;
  status: string;
  total_task_count: number;
  completed_count: number;
  failed_count: number;
}

class BatchCallAPI {
  private basePath = "/client/batch-calls";

  async startBatchCall(campaignId: string): Promise<BatchCallResponse> {
    const response = await axiosInstance.post(
      `${this.basePath}/${campaignId}/start`
    );
    return response.data.data.batchCall;
  }

  async getBatchCallStatus(
    campaignId: string,
    batchCallId: string
  ): Promise<BatchCallStatus> {
    const response = await axiosInstance.get(
      `${this.basePath}/${campaignId}/status/${batchCallId}`
    );
    return response.data.data.status;
  }

  async stopBatchCall(
    campaignId: string,
    batchCallId: string
  ): Promise<void> {
    await axiosInstance.post(
      `${this.basePath}/${campaignId}/stop/${batchCallId}`
    );
  }
}

export const batchCallAPI = new BatchCallAPI();