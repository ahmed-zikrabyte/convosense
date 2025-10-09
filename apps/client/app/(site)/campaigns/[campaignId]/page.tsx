"use client";

import React from "react";
import {Button} from "@workspace/ui/components/button";
import {Card, CardContent} from "@workspace/ui/components/card";
import {useCampaignDetail} from "@/lib/hooks/use-campaign-detail";
import {CampaignDetailsSidebar} from "@/app/components/pages/campaigns/detailpage/CampaignDetailsSidebar";
import {CampaignInfo} from "@/app/components/pages/campaigns/detailpage/CampaignInfo";
import {ContactManagement} from "@/app/components/pages/campaigns/detailpage/ContactManagement";
import {ContactList} from "@/app/components/pages/campaigns/detailpage/ContactList";
import {DeleteCampaignAlert} from "@/app/components/pages/campaigns/detailpage/DeleteCampaignAlert";
import {CampaignHeader} from "@/app/components/pages/campaigns/detailpage/CampaignHeader";

export default function CampaignDetailPage() {
  const {
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
  } = useCampaignDetail();

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-red-500 mb-4">
              {error || "Campaign not found"}
            </div>
            <div className="space-x-4">
              <Button onClick={() => router.push("/campaigns")}>
                Back to Campaigns
              </Button>
              <Button onClick={refetch} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <CampaignHeader
          campaign={campaign}
          operationsLoading={operationsLoading}
          batchCallLoading={batchCallLoading}
          activeBatchCall={activeBatchCall}
          totalContacts={pagination.totalContacts}
          onPublish={handlePublish}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onStart={handleStartCampaign}
          onStop={handleStopCampaign}
        />

        {operationsError && (
          <Card className="border-red-200">
            <CardContent className="py-4">
              <div className="text-red-600 text-sm">{operationsError}</div>
            </CardContent>
          </Card>
        )}

        {batchCallError && (
          <Card className="border-red-200">
            <CardContent className="py-4">
              <div className="text-red-600 text-sm">{batchCallError}</div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CampaignInfo campaign={campaign} />
            <ContactManagement
              isUploading={isUploading}
              onDownloadTemplate={handleDownloadTemplate}
              onFileUpload={handleFileUpload}
            />
            <ContactList
              campaignId={campaignId}
              contacts={contacts}
              pagination={pagination}
              loading={contactsLoading}
              error={contactsError}
              contactOperationsLoading={contactOperationsLoading}
              onDeleteContact={deleteContact}
              onRefetchContacts={refetchContacts}
            />
          </div>

          <div className="space-y-6">
            <CampaignDetailsSidebar
              campaign={campaign}
              operationsLoading={operationsLoading}
              batchCallLoading={batchCallLoading}
              activeBatchCall={activeBatchCall}
              totalContacts={pagination.totalContacts}
              onPublish={handlePublish}
              onDuplicate={handleDuplicate}
              onStart={handleStartCampaign}
              onStop={handleStopCampaign}
            />
          </div>
        </div>
      </div>
      <DeleteCampaignAlert
        isOpen={isDeleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        onConfirm={performDelete}
        isLoading={operationsLoading}
      />
    </>
  );
}
