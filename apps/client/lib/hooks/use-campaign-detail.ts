"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCampaign, useCampaignOperations } from "@/lib/hooks/use-campaigns";
import { useCampaignContacts, useCampaignContactOperations } from "@/lib/hooks/use-campaign-contacts";
import { useBatchCall } from "@/lib/hooks/use-batch-calls";
import { campaignContactAPI } from "@/lib/api/campaign-contacts";

export function useCampaignDetail() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeBatchCall, setActiveBatchCall] = useState<string | null>(null);

  const { campaign, loading, error, refetch } = useCampaign(campaignId);
  const {
    loading: operationsLoading,
    error: operationsError,
    deleteCampaign,
    duplicateCampaign,
    publishCampaign,
  } = useCampaignOperations();

  const {
    contacts,
    loading: contactsLoading,
    error: contactsError,
    pagination,
    refetch: refetchContacts,
  } = useCampaignContacts(campaignId, { limit: 10 });

  const {
    loading: contactOperationsLoading,
    error: contactOperationsError,
    deleteContact,
  } = useCampaignContactOperations();

  const {
    loading: batchCallLoading,
    error: batchCallError,
    startBatchCall,
    stopBatchCall,
  } = useBatchCall();

  const handlePublish = async () => {
    if (!campaign) return;
    const result = await publishCampaign(campaign.campaignId);
    if (result) {
      refetch();
    }
  };

  const handleDuplicate = async () => {
    if (!campaign) return;
    const result = await duplicateCampaign(campaign.campaignId);
    if (result) {
      router.push(`/campaigns/${result.campaignId}`);
    }
  };

  const handleDelete = () => {
    if (!campaign) return;
    setDeleteAlertOpen(true);
  };

  const performDelete = async () => {
    if (!campaign) return;
    const result = await deleteCampaign(campaign.campaignId);
    if (result) {
      router.push("/campaigns");
    }
    setDeleteAlertOpen(false);
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/retell-template.csv";
    link.download = "retell-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !campaign) return;

    setIsUploading(true);
    try {
      const result = await campaignContactAPI.uploadContacts(campaign.campaignId, file);
      refetch();
      refetchContacts();
      alert(`CSV uploaded successfully! Imported: ${result.imported}, Duplicates: ${result.duplicates}, Invalid: ${result.invalid}`);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.response?.data?.message || error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleStartCampaign = async () => {
    if (!campaign) return;
    if (pagination.totalContacts === 0) {
      alert("No contacts found. Please upload contacts before starting the campaign.");
      return;
    }
    try {
      const result = await startBatchCall(campaign.campaignId);
      if (result) {
        setActiveBatchCall(result.batch_call_id);
        alert(`Campaign started successfully! Batch Call ID: ${result.batch_call_id}`);
        refetchContacts();
      }
    } catch (error: any) {
      console.error("Start campaign error:", error);
    }
  };

  const handleStopCampaign = async () => {
    if (!campaign || !activeBatchCall) return;
    try {
      const success = await stopBatchCall(campaign.campaignId, activeBatchCall);
      if (success) {
        setActiveBatchCall(null);
        alert("Campaign stopped successfully!");
        refetchContacts();
      }
    } catch (error: any) {
      console.error("Stop campaign error:", error);
    }
  };

  return {
    router,
    campaignId,
    isDeleteAlertOpen,
    setDeleteAlertOpen,
    isUploading,
    activeBatchCall,
    campaign,
    loading,
    error,
    refetch,
    operationsLoading,
    operationsError,
    contacts,
    contactsLoading,
    contactsError,
    pagination,
    refetchContacts,
    contactOperationsLoading,
    contactOperationsError,
    deleteContact,
    batchCallLoading,
    batchCallError,
    handlePublish,
    handleDuplicate,
    handleDelete,
    performDelete,
    handleDownloadTemplate,
    handleFileUpload,
    handleStartCampaign,
    handleStopCampaign,
  };
}
