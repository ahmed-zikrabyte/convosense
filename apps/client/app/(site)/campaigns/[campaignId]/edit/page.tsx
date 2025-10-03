"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useCampaign, useCampaignOperations } from "@/lib/hooks/use-campaigns";
import { CampaignForm } from "@/components/pages/campaigns";
import type { CampaignFormData } from "@/components/pages/campaigns";

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const { campaign, loading: campaignLoading, error: campaignError, refetch } = useCampaign(campaignId);
  const { updateCampaign, loading: apiLoading, error: apiError } = useCampaignOperations();

  const handleSubmit = async (formData: CampaignFormData) => {
    if (!campaign) return;

    try {
      const result = await updateCampaign(campaign.campaignId, formData);

      if (result) {
        refetch();
        router.push(`/campaigns/${campaign.campaignId}`);
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      throw error; // Re-throw so the form can handle it
    }
  };

  const handleCancel = () => {
    router.push(campaign ? `/campaigns/${campaign.campaignId}` : "/campaigns");
  };

  // Loading state
  if (campaignLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (campaignError || !campaign) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            {campaignError || "Campaign not found"}
          </div>
          <div className="space-x-4">
            <button
              onClick={() => router.push("/campaigns")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Campaigns
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CampaignForm
      mode="edit"
      campaign={campaign}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={apiLoading}
      error={apiError || ""}
    />
  );
}