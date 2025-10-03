"use client";

import React, { useState, useMemo } from "react";
import {
  useCampaigns,
  useCampaignStats,
  useCampaignOperations,
} from "@/lib/hooks/use-campaigns";
import { Campaign } from "@/lib/api/campaigns";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit,
  Eye,
  Megaphone,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  published: "bg-green-100 text-green-800 border-green-200",
};

const statusIcons = {
  draft: Edit,
  published: CheckCircle,
};

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const campaignFilters = useMemo(
    () => ({
      search: searchTerm || undefined,
      status: filterStatus || undefined,
    }),
    [searchTerm, filterStatus]
  );

  const {
    campaigns,
    loading: campaignsLoading,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useCampaigns(campaignFilters);

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useCampaignStats();

  const {
    loading: operationsLoading,
    error: operationsError,
    deleteCampaign,
    duplicateCampaign,
    updateCampaign,
    publishCampaign,
  } = useCampaignOperations();

  const loading = campaignsLoading || statsLoading;

  const handleDuplicate = async (campaignId: string) => {
    const result = await duplicateCampaign(campaignId);
    if (result) {
      refetchCampaigns();
      refetchStats();
    }
  };

  const handleDelete = (campaignId: string) => {
    setCampaignToDelete(campaignId);
    setDeleteAlertOpen(true);
  };

  const performDelete = async () => {
    if (campaignToDelete) {
      const result = await deleteCampaign(campaignToDelete);
      if (result) {
        refetchCampaigns();
        refetchStats();
      }
      setCampaignToDelete(null);
      setDeleteAlertOpen(false);
    }
  };

  const handleStatusChange = async (
    campaignId: string,
    newStatus: Campaign["status"]
  ) => {
    if (newStatus === "published") {
      const result = await publishCampaign(campaignId);
      if (result) {
        refetchCampaigns();
        refetchStats();
      }
    } else {
      const result = await updateCampaign(campaignId, { status: newStatus });
      if (result) {
        refetchCampaigns();
        refetchStats();
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (campaignsError || statsError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-red-500 mb-4">
              Error loading campaigns: {campaignsError || statsError}
            </div>
            <Button
              onClick={() => {
                refetchCampaigns();
                refetchStats();
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage your AI voice campaigns
          </p>
        </div>
        <Link href="/campaigns/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Show operation errors */}
      {operationsError && (
        <Card className="border-red-200">
          <CardContent className="py-4">
            <div className="text-red-600 text-sm">{operationsError}</div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.draft}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.published}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Filter: {filterStatus || "All"}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus("")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("draft")}>
              Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("published")}>
              Published
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus
                  ? "No campaigns match your current filters."
                  : "Get started by creating your first campaign."}
              </p>
              {!searchTerm && !filterStatus && (
                <Link href="/campaigns/create">
                  <Button>Create Campaign</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign: Campaign) => {
            const StatusIcon = statusIcons[campaign.status];
            return (
              <Card
                key={campaign._id}
                className={operationsLoading ? "opacity-50" : ""}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Megaphone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {campaign.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Created{" "}
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge
                        className={cn(
                          "flex items-center space-x-1",
                          statusColors[campaign.status]
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span className="capitalize">{campaign.status}</span>
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Agent: {campaign.agent_id}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={operationsLoading}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/campaigns/${campaign.campaignId}`}>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          <Link
                            href={`/campaigns/${campaign.campaignId}/edit`}
                          >
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(campaign.campaignId)}
                            disabled={operationsLoading}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {campaign.status === "draft" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(
                                  campaign.campaignId,
                                  "published"
                                )
                              }
                              disabled={operationsLoading}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(campaign.campaignId)}
                            className="text-red-600 hover:text-red-700"
                            disabled={operationsLoading}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this campaign?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and the campaign data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCampaignToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={performDelete} disabled={operationsLoading}>
              {operationsLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
