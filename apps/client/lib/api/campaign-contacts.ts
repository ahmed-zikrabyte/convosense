import axiosInstance from "../axios";

export interface CampaignContact {
  _id: string;
  campaign_id: string;
  client_id: string;
  phone_number: string;
  dynamic_variables: Record<string, string>;
  is_active: boolean;
  call_status: "pending" | "completed" | "failed" | "in_progress";
  call_attempts: number;
  last_call_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactsResponse {
  contacts: CampaignContact[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalContacts: number;
    limit: number;
  };
}

export interface ContactFilters {
  page?: number;
  limit?: number;
  status?: string;
}

class CampaignContactAPI {
  private basePath = "/client/campaigns";

  async getContacts(
    campaignId: string,
    filters: ContactFilters = {}
  ): Promise<ContactsResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.status) params.append("status", filters.status);

    const queryString = params.toString();
    const endpoint = `${this.basePath}/${campaignId}/contacts${queryString ? `?${queryString}` : ""}`;

    const response = await axiosInstance.get(endpoint);
    return response.data.data;
  }

  async uploadContacts(campaignId: string, csvFile: File): Promise<any> {
    const formData = new FormData();
    formData.append("csv", csvFile);

    const response = await axiosInstance.post(
      `${this.basePath}/${campaignId}/contacts/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  }

  async deleteContact(campaignId: string, contactId: string): Promise<void> {
    await axiosInstance.delete(
      `${this.basePath}/${campaignId}/contacts/${contactId}`
    );
  }

  async updateContact(
    campaignId: string,
    contactId: string,
    updateData: Partial<CampaignContact>
  ): Promise<CampaignContact> {
    const response = await axiosInstance.patch(
      `${this.basePath}/${campaignId}/contacts/${contactId}`,
      updateData
    );
    return response.data.data.contact;
  }
}

export const campaignContactAPI = new CampaignContactAPI();
