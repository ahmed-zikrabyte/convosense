"use client";

import React from "react";
import Link from "next/link";
import {Copy, Edit, Pause, Play, Settings, CheckCircle} from "lucide-react";
import {Button} from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {Badge} from "@workspace/ui/components/badge";
import {cn, isNil} from "@workspace/ui/lib/utils";
import {Campaign} from "@/lib/api/campaigns";

const statusColors: {[key: string]: string} = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  published: "bg-green-100 text-green-800 border-green-200",
};

const statusIcons: {[key: string]: React.ElementType} = {
  draft: Edit,
  published: CheckCircle,
};

interface CampaignDetailsSidebarProps {
  campaign: Campaign;
  operationsLoading: boolean;
  batchCallLoading: boolean;
  activeBatchCall: string | null;
  totalContacts: number;
  onPublish: () => void;
  onDuplicate: () => void;
  onStart: () => void;
  onStop: () => void;
}

export function CampaignDetailsSidebar({
  campaign,
  operationsLoading,
  batchCallLoading,
  activeBatchCall,
  totalContacts,
  onPublish,
  onDuplicate,
  onStart,
  onStop,
}: CampaignDetailsSidebarProps) {
  const StatusIcon = statusIcons[campaign.status];

  return (
    <div className="space-y-6">
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
              {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
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
            onClick={onDuplicate}
            disabled={operationsLoading}
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate Campaign
          </Button>
          {campaign.status === "draft" && (
            <Button
              className="w-full justify-start"
              onClick={onPublish}
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
                  onClick={onStart}
                  disabled={batchCallLoading || totalContacts === 0}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Campaign
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  onClick={onStop}
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
  );
}
