"use client";

import React, {useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {ArrowLeft, ChevronLeft, ChevronRight} from "lucide-react";
import {Button} from "@workspace/ui/components/button";
import {useCampaignCallReports} from "@/lib/hooks/use-call-reports";
import {useCampaignDetail} from "@/lib/hooks/use-campaign-detail";
import {
  CallReportsStatsComponent,
  CallReportsFiltersComponent,
  CallReportsTable,
  CallDetailModal,
} from "@/components/pages/call-reports";
import {CallReportsFilters} from "@/lib/api/call-reports";
import {callReportsAPI} from "@/lib/api/call-reports";

export default function CampaignCallReportsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const {campaign} = useCampaignDetail(campaignId);

  const {
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
  } = useCampaignCallReports(campaignId, {
    page: 1,
    limit: 20,
  });

  const handleViewDetails = (callId: string) => {
    setSelectedCallId(callId);
    setIsDetailModalOpen(true);
  };

  const handleViewTranscript = (callId: string) => {
    setSelectedCallId(callId);
    setIsDetailModalOpen(true);
  };

  const handleDownloadRecording = async (callId: string) => {
    try {
      const recordingData = await callReportsAPI.getCallRecording(callId);
      if (recordingData.recording_url) {
        const link = document.createElement("a");
        link.href = recordingData.recording_url;
        link.download = `call-${callId}-recording.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Failed to download recording:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters({...filters, page});
  };

  const handleFiltersChange = (
    newFilters: Omit<CallReportsFilters, "campaign_id">
  ) => {
    setFilters(newFilters);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedCallId(null);
  };

  const handleBackToCampaign = () => {
    router.push(`/campaigns/${campaignId}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBackToCampaign}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaign
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Call Reports - {campaign?.name || "Loading..."}
          </h1>
          <p className="text-muted-foreground">
            View call analytics and performance for this campaign
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && <CallReportsStatsComponent stats={stats} loading={loading} />}

      {/* Filters */}
      <CallReportsFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        showCampaignFilter={false}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <Button variant="outline" onClick={refetch} className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/* Table */}
      <CallReportsTable
        callReports={callReports}
        loading={loading}
        onViewDetails={handleViewDetails}
        onViewTranscript={handleViewTranscript}
        onDownloadRecording={handleDownloadRecording}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * (filters.limit || 20) + 1} to{" "}
            {Math.min(currentPage * (filters.limit || 20), total)} of {total}{" "}
            calls
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <CallDetailModal
        callId={selectedCallId}
        open={isDetailModalOpen}
        onClose={closeDetailModal}
      />
    </div>
  );
}
