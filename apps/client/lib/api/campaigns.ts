import axiosInstance from "../axios";

export interface Campaign {
  _id: string;
  campaignId: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
  script_raw: string;
  voice_id: string;
  kb_files_meta: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    fileUrl?: string;
  }>;
  settings: {
    max_duration_seconds: number;
    retry_attempts: number;
    retry_delay_seconds: number;
    enable_voicemail_detection: boolean;
    enable_ambient_sounds: boolean;
    ambient_sound_volume: number;
    webhook_url?: string;
  };
  agent_id?: string;
  knowledge_base_id?: string;
  published_version?: number;
}

export interface CampaignStats {
  total: number;
  draft: number;
  active: number;
  paused: number;
  completed: number;
}

export interface CreateCampaignData {
  name: string;
  script_raw: string;
  voice_id: string;
  settings?: Partial<Campaign["settings"]>;
  kb_files_meta?: Campaign["kb_files_meta"];
}

export interface UpdateCampaignData {
  name?: string;
  script_raw?: string;
  voice_id?: string;
  settings?: Partial<Campaign["settings"]>;
  status?: Campaign["status"];
}

export interface CampaignFilters {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
  currentPage: number;
  totalPages: number;
}

class CampaignAPI {
  private basePath = "/client/campaigns";

  async getCampaigns(filters: CampaignFilters = {}): Promise<CampaignsResponse> {
    const params = new URLSearchParams();

    if (filters.status) params.append("status", filters.status);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);

    const response = await axiosInstance.get(
      `${this.basePath}${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data.data;
  }

  async getCampaignStats(): Promise<CampaignStats> {
    const response = await axiosInstance.get(`${this.basePath}/stats`);
    return response.data.data.stats;
  }

  async getCampaign(campaignId: string): Promise<Campaign> {
    const response = await axiosInstance.get(`${this.basePath}/${campaignId}`);
    return response.data.data.campaign;
  }

  async createCampaign(data: CreateCampaignData): Promise<Campaign> {
    const response = await axiosInstance.post(this.basePath, data);
    return response.data.data.campaign;
  }

  async updateCampaign(campaignId: string, data: UpdateCampaignData): Promise<Campaign> {
    const response = await axiosInstance.patch(`${this.basePath}/${campaignId}`, data);
    return response.data.data.campaign;
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    await axiosInstance.delete(`${this.basePath}/${campaignId}`);
  }

  async duplicateCampaign(campaignId: string): Promise<Campaign> {
    const response = await axiosInstance.post(`${this.basePath}/${campaignId}/duplicate`);
    return response.data.data.campaign;
  }

  async updateKnowledgeBase(
    campaignId: string,
    kbFiles: Campaign["kb_files_meta"]
  ): Promise<Campaign> {
    const response = await axiosInstance.patch(
      `${this.basePath}/${campaignId}/knowledge-base`,
      { kb_files_meta: kbFiles }
    );
    return response.data.data.campaign;
  }
}

export const campaignAPI = new CampaignAPI();