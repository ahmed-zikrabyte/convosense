import { useState, useEffect } from "react";
import { callReportsAPI, CallReport, CallReportsStats, CallReportsFilters } from "../api/call-reports";

export interface UseCallReportsReturn {
  callReports: CallReport[];
  stats: CallReportsStats | null;
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  totalPages: number;
  refetch: () => void;
  setFilters: (filters: CallReportsFilters) => void;
  filters: CallReportsFilters;
}

export const useCallReports = (initialFilters: CallReportsFilters = {}): UseCallReportsReturn => {
  const [callReports, setCallReports] = useState<CallReport[]>([]);
  const [stats, setStats] = useState<CallReportsStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [filters, setFilters] = useState<CallReportsFilters>(initialFilters);

  const fetchCallReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await callReportsAPI.getCallReports(filters);

      setCallReports(response.calls);
      setStats(response.stats);
      setTotal(response.total);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch call reports");
      console.error("Error fetching call reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchCallReports();
  };

  useEffect(() => {
    fetchCallReports();
  }, [filters]);

  return {
    callReports,
    stats,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    refetch,
    setFilters,
    filters,
  };
};

export interface UseCallReportDetailReturn {
  callReport: CallReport | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCallReportDetail = (callId: string): UseCallReportDetailReturn => {
  const [callReport, setCallReport] = useState<CallReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCallReport = async () => {
    if (!callId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await callReportsAPI.getCallReport(callId);
      setCallReport(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch call report");
      console.error("Error fetching call report:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchCallReport();
  };

  useEffect(() => {
    fetchCallReport();
  }, [callId]);

  return {
    callReport,
    loading,
    error,
    refetch,
  };
};

export interface UseCampaignCallReportsReturn {
  callReports: CallReport[];
  stats: CallReportsStats | null;
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  totalPages: number;
  refetch: () => void;
  setFilters: (filters: Omit<CallReportsFilters, "campaign_id">) => void;
  filters: Omit<CallReportsFilters, "campaign_id">;
}

export const useCampaignCallReports = (
  campaignId: string,
  initialFilters: Omit<CallReportsFilters, "campaign_id"> = {}
): UseCampaignCallReportsReturn => {
  const [callReports, setCallReports] = useState<CallReport[]>([]);
  const [stats, setStats] = useState<CallReportsStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [filters, setFilters] = useState<Omit<CallReportsFilters, "campaign_id">>(initialFilters);

  const fetchCallReports = async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await callReportsAPI.getCallReportsByCampaign(campaignId, filters);

      setCallReports(response.calls);
      setStats(response.stats);
      setTotal(response.total);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch campaign call reports");
      console.error("Error fetching campaign call reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchCallReports();
  };

  useEffect(() => {
    fetchCallReports();
  }, [campaignId, filters]);

  return {
    callReports,
    stats,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    refetch,
    setFilters,
    filters,
  };
};