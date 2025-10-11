import { useState, useEffect, useCallback } from "react";
import {
  campaignAPI,
  Campaign,
  CampaignStats,
  CampaignFilters,
  CreateCampaignData,
  UpdateCampaignData
} from "../api/campaigns";

export const useCampaigns = (filters: CampaignFilters = {}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    currentPage: 1,
    totalPages: 1,
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await campaignAPI.getCampaigns(filters);
      setCampaigns(response.campaigns);
      setPagination({
        total: response.total,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.page, filters.limit, filters.search]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    pagination,
    refetch: fetchCampaigns,
  };
};

export const useCampaignStats = () => {
  const [stats, setStats] = useState<CampaignStats>({
    total: 0,
    draft: 0,
    published: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await campaignAPI.getCampaignStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch campaign stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

export const useCampaignOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = async (data: CreateCampaignData): Promise<Campaign | null> => {
    try {
      setLoading(true);
      setError(null);
      const campaign = await campaignAPI.createCampaign(data);
      return campaign;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCampaign = async (
    campaignId: string,
    data: UpdateCampaignData
  ): Promise<Campaign | null> => {
    try {
      setLoading(true);
      setError(null);
      const campaign = await campaignAPI.updateCampaign(campaignId, data);
      return campaign;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update campaign");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (campaignId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await campaignAPI.deleteCampaign(campaignId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete campaign");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const duplicateCampaign = async (campaignId: string): Promise<Campaign | null> => {
    try {
      setLoading(true);
      setError(null);
      const campaign = await campaignAPI.duplicateCampaign(campaignId);
      return campaign;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate campaign");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const publishCampaign = async (campaignId: string): Promise<Campaign | null> => {
    try {
      setLoading(true);
      setError(null);
      const campaign = await campaignAPI.publishCampaign(campaignId);
      return campaign;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish campaign");
      return null;
    } finally {
      setLoading(false);
    }
  };


  return {
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    duplicateCampaign,
    publishCampaign,
  };
};

export const useCampaign = (campaignId: string) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await campaignAPI.getCampaign(campaignId);
      setCampaign(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch campaign");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  return {
    campaign,
    loading,
    error,
    refetch: fetchCampaign,
  };
};