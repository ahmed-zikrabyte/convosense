import { useState } from "react";
import { batchCallAPI, BatchCallResponse, BatchCallStatus } from "../api/batch-calls";

export function useBatchCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startBatchCall = async (campaignId: string): Promise<BatchCallResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await batchCallAPI.startBatchCall(campaignId);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to start batch call";
      setError(errorMessage);
      console.error("Start batch call error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getBatchCallStatus = async (
    campaignId: string,
    batchCallId: string
  ): Promise<BatchCallStatus | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await batchCallAPI.getBatchCallStatus(campaignId, batchCallId);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to get batch call status";
      setError(errorMessage);
      console.error("Get batch call status error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const stopBatchCall = async (
    campaignId: string,
    batchCallId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await batchCallAPI.stopBatchCall(campaignId, batchCallId);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to stop batch call";
      setError(errorMessage);
      console.error("Stop batch call error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    startBatchCall,
    getBatchCallStatus,
    stopBatchCall,
  };
}