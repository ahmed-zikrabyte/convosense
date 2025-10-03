"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCampaignOperations } from "@/lib/hooks/use-campaigns";
import { CampaignForm } from "@/components/pages/campaigns";
import type { CampaignFormData } from "@/components/pages/campaigns";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { createCampaign, loading, error } = useCampaignOperations();

  const handleSubmit = async (formData: CampaignFormData) => {
    try {
      const result = await createCampaign(formData);

      if (result) {
        // Redirect to campaigns list
        router.push("/campaigns");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      throw error; // Re-throw so the form can handle it
    }
  };

  const handleCancel = () => {
    router.push("/campaigns");
  };

  return (
    <CampaignForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
      error={error || ""}
    />
  );
}