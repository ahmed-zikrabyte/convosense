"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useCampaign, useCampaignOperations } from "@/lib/hooks/use-campaigns";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  ArrowLeft,
  Edit,
  Play,
  Pause,
  Copy,
  Trash2,
  Download,
  Settings,
  FileText,
  Mic,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  Eye,
  Calendar,
  User,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  active: "bg-green-100 text-green-800 border-green-200",
  paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  archived: "bg-red-100 text-red-800 border-red-200",
};

const statusIcons = {
  draft: Edit,
  active: Play,
  paused: Pause,
  completed: CheckCircle,
  archived: Archive,
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const { campaign, loading, error, refetch } = useCampaign(campaignId);
  const {
    loading: operationsLoading,
    error: operationsError,
    updateCampaign,
    deleteCampaign,
    duplicateCampaign,
  } = useCampaignOperations();

  const handleStatusToggle = async () => {
    if (!campaign) return;

    const newStatus = campaign.status === "active" ? "paused" : "active";
    const result = await updateCampaign(campaign.campaignId, { status: newStatus });
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

    if (window.confirm("Are you sure you want to delete this campaign?")) {
      const result = await deleteCampaign(campaign.campaignId);
      if (result) {
        router.push("/campaigns");
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
                <span>Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Updated {new Date(campaign.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {campaign.status === "active" || campaign.status === "paused" ? (
            <Button
              onClick={handleStatusToggle}
              disabled={operationsLoading}
              variant={campaign.status === "active" ? "destructive" : "default"}
            >
              {campaign.status === "active" ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              )}
            </Button>
          ) : null}

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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Script */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Campaign Script</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {campaign.script_raw}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Knowledge Base</span>
                </div>
                <Badge variant="secondary">
                  {campaign.kb_files_meta.length} files
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.kb_files_meta.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No knowledge base files uploaded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaign.kb_files_meta.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{file.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)} • {file.fileType}
                          </p>
                        </div>
                      </div>
                      {file.fileUrl && (
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
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
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <Badge className={cn("mt-1", statusColors[campaign.status])}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  <span className="capitalize">{campaign.status}</span>
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Campaign ID</div>
                <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                  {campaign.campaignId}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Created</div>
                <div className="text-sm">
                  {new Date(campaign.createdAt).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                <div className="text-sm">
                  {new Date(campaign.updatedAt).toLocaleString()}
                </div>
              </div>

              {campaign.published_version && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Published Version</div>
                  <div className="text-sm">{campaign.published_version}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voice Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="w-5 h-5" />
                <span>Voice & Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Voice ID</div>
                <div className="text-sm">{campaign.voice_id}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Max Duration</div>
                <div className="text-sm">
                  {Math.floor(campaign.settings.max_duration_seconds / 60)}m {campaign.settings.max_duration_seconds % 60}s
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Retry Attempts</div>
                <div className="text-sm">{campaign.settings.retry_attempts}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Retry Delay</div>
                <div className="text-sm">
                  {Math.floor(campaign.settings.retry_delay_seconds / 3600)}h
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Features</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Voicemail Detection</span>
                    <Badge variant={campaign.settings.enable_voicemail_detection ? "default" : "secondary"}>
                      {campaign.settings.enable_voicemail_detection ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Ambient Sounds</span>
                    <Badge variant={campaign.settings.enable_ambient_sounds ? "default" : "secondary"}>
                      {campaign.settings.enable_ambient_sounds ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {campaign.settings.enable_ambient_sounds && (
                    <div className="text-xs text-muted-foreground">
                      Volume: {Math.round(campaign.settings.ambient_sound_volume * 100)}%
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/campaigns/${campaign.campaignId}/edit`} className="block">
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
                  onClick={() => handleStatusToggle()}
                  disabled={operationsLoading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Activate Campaign
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}