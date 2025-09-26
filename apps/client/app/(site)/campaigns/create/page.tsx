"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCampaignOperations } from "@/lib/hooks/use-campaigns";
import { CampaignForm, prepareKnowledgeBaseForSubmit } from "@/components/pages/campaigns";
import type { CampaignFormData, KnowledgeFile, KnowledgeText, KnowledgeUrl } from "@/components/pages/campaigns";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { createCampaign, loading, error } = useCampaignOperations();

  const handleSubmit = async (
    formData: CampaignFormData,
    knowledgeBase: {
      files: KnowledgeFile[];
      texts: KnowledgeText[];
      urls: KnowledgeUrl[];
    }
  ) => {
    try {
      // Prepare knowledge base files metadata
      const kb_files_meta = prepareKnowledgeBaseForSubmit(
        knowledgeBase.files,
        knowledgeBase.texts,
        knowledgeBase.urls
      );

      const payload = {
        name: formData.name,
        script_raw: formData.script_raw,
        voice_id: formData.voice_id,
        settings: formData.settings,
        kb_files_meta,
      };

      const result = await createCampaign(payload);

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