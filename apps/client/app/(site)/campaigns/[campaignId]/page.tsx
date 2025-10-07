"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCampaign, useCampaignOperations } from "@/lib/hooks/use-campaigns";
import { useCampaignContacts, useCampaignContactOperations } from "@/lib/hooks/use-campaign-contacts";
import { useBatchCall } from "@/lib/hooks/use-batch-calls";
import { campaignContactAPI } from "@/lib/api/campaign-contacts";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
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
import {
  ArrowLeft,
  Edit,
  Play,
  Pause,
  Copy,
  Trash2,
  Settings,
  Clock,
  CheckCircle,
  Archive,
  Calendar,
  MessageSquare,
  Download,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { cn, isNil } from "@workspace/ui/lib/utils";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  published: "bg-green-100 text-green-800 border-green-200",
};

const statusIcons = {
  draft: Edit,
  published: CheckCircle,
};

export default function CampaignDetailPage() {
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

  const handleDelete = async () => {
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

      // Refresh the campaign data and contacts to show the new contacts
      refetch();
      refetchContacts();

      alert(`CSV uploaded successfully! Imported: ${result.imported}, Duplicates: ${result.duplicates}, Invalid: ${result.invalid}`);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.response?.data?.message || error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
      // Reset file input
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
        // Refresh contacts to show updated call statuses
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
        // Refresh contacts to show updated call statuses
        refetchContacts();
      }
    } catch (error: any) {
      console.error("Stop campaign error:", error);
    }
  };


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

  const StatusIcon = statusIcons[campaign.status];

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/campaigns">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold">{campaign.name}</h1>
                <Badge
                  className={cn(
                    "flex items-center space-x-1",
                    statusColors[campaign.status]
                  )}
                >
                  <StatusIcon className="w-3 h-3" />
                  <span className="capitalize">{campaign.status}</span>
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Created {new Date(campaign.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    Updated {new Date(campaign.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {campaign.status === "draft" && (
              <Button
                onClick={handlePublish}
                disabled={operationsLoading}
              >
                <Play className="w-4 h-4 mr-2" />
                Publish Campaign
              </Button>
            )}

            {campaign.status === "published" && (
              <>
                {!activeBatchCall ? (
                  <Button
                    onClick={handleStartCampaign}
                    disabled={batchCallLoading || pagination.totalContacts === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Campaign
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopCampaign}
                    disabled={batchCallLoading}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Campaign
                  </Button>
                )}
              </>
            )}

            <Button
              onClick={handleDuplicate}
              variant="outline"
              disabled={operationsLoading}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>

            <Link href={`/campaigns/${campaign.campaignId}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>

            <Button
              onClick={handleDelete}
              variant="outline"
              disabled={operationsLoading}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Show operation errors */}
        {operationsError && (
          <Card className="border-red-200">
            <CardContent className="py-4">
              <div className="text-red-600 text-sm">{operationsError}</div>
            </CardContent>
          </Card>
        )}

        {/* Show batch call errors */}
        {batchCallError && (
          <Card className="border-red-200">
            <CardContent className="py-4">
              <div className="text-red-600 text-sm">{batchCallError}</div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content area - currently minimal since general_prompt is not stored */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Campaign Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    This campaign uses Agent ID: {campaign.agent_id}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    General prompt and other agent configurations are managed through the assigned agent.
                  </p>
                </div>

                {campaign.general_prompt && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">General Prompt</h4>
                    <div className="bg-gray-50 rounded-md p-3 border">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {campaign.general_prompt}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CSV Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Contact List Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Template</span>
                  </Button>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      id="csv-upload"
                    />
                    <Button
                      variant="default"
                      disabled={isUploading}
                      className="flex items-center space-x-2 w-full"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isUploading ? "Uploading..." : "Upload CSV"}</span>
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Upload a CSV file with phone numbers and dynamic variables for this campaign.</p>
                  <p className="mt-1">Required format: phone number, dynamic variable1, dynamic variable2...</p>
                </div>
              </CardContent>
            </Card>

            {/* Contacts Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Contact List</span>
                  {pagination.totalContacts > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {pagination.totalContacts} contacts
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contactsError && (
                  <div className="text-red-600 text-sm mb-4">{contactsError}</div>
                )}

                {contactsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No contacts uploaded yet.</p>
                    <p className="text-sm mt-2">Upload a CSV file to add contacts to this campaign.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Phone Number</TableHead>
                          <TableHead>Dynamic Variables</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Call Attempts</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((contact) => (
                          <TableRow key={contact._id}>
                            <TableCell className="font-mono">
                              {contact.phone_number}
                            </TableCell>
                            <TableCell>
                              {Object.keys(contact.dynamic_variables).length > 0 ? (
                                <div className="space-y-1">
                                  {Object.entries(contact.dynamic_variables).map(([key, value]) => (
                                    <div key={key} className="text-sm">
                                      <span className="font-medium">{key}:</span> {value}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">None</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  contact.call_status === "completed" && "bg-green-100 text-green-800",
                                  contact.call_status === "failed" && "bg-red-100 text-red-800",
                                  contact.call_status === "pending" && "bg-gray-100 text-gray-800",
                                  contact.call_status === "in_progress" && "bg-blue-100 text-blue-800"
                                )}
                              >
                                {contact.call_status}
                              </Badge>
                            </TableCell>
                            <TableCell>{contact.call_attempts}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (confirm("Are you sure you want to delete this contact?")) {
                                    const success = await deleteContact(campaignId, contact._id);
                                    if (success) {
                                      refetchContacts();
                                    }
                                  }
                                }}
                                disabled={contactOperationsLoading}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Page {pagination.currentPage} of {pagination.totalPages}
                        </div>
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.currentPage === 1}
                            onClick={() => {
                              // Pagination will be implemented with state management
                              // For now, this is a placeholder
                            }}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.currentPage === pagination.totalPages}
                            onClick={() => {
                              // Pagination will be implemented with state management
                              // For now, this is a placeholder
                            }}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Campaign Details Sidebar */}
          <div className="space-y-6">
            {/* Campaign Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Campaign Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Status
                  </div>
                  <Badge className={cn("mt-1", statusColors[campaign.status])}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    <span className="capitalize">{campaign.status}</span>
                  </Badge>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Campaign ID
                  </div>
                  <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                    {campaign.campaignId}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Created
                  </div>
                  <div className="text-sm">
                    {new Date(campaign.createdAt).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </div>
                  <div className="text-sm">
                    {new Date(campaign.updatedAt).toLocaleString()}
                  </div>
                </div>
                {!isNil(campaign.published_version) && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Published Version
                    </div>
                    <div className="text-sm">{campaign.published_version}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href={`/campaigns/${campaign.campaignId}/edit`}
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Campaign
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleDuplicate}
                  disabled={operationsLoading}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate Campaign
                </Button>

                {campaign.status === "draft" && (
                  <Button
                    className="w-full justify-start"
                    onClick={handlePublish}
                    disabled={operationsLoading}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Publish Campaign
                  </Button>
                )}

                {campaign.status === "published" && (
                  <>
                    {!activeBatchCall ? (
                      <Button
                        className="w-full justify-start bg-green-600 hover:bg-green-700"
                        onClick={handleStartCampaign}
                        disabled={batchCallLoading || pagination.totalContacts === 0}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Campaign
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        onClick={handleStopCampaign}
                        disabled={batchCallLoading}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Stop Campaign
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performDelete} disabled={operationsLoading}>
              {operationsLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
