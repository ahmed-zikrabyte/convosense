"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Edit,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import {Button} from "@workspace/ui/components/button";
import {Badge} from "@workspace/ui/components/badge";
import {cn} from "@workspace/ui/lib/utils";
import {Campaign} from "@/lib/api/campaigns";
// import { Campaign } from "@/lib/hooks/use-campaigns";

const statusColors: {[key: string]: string} = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  published: "bg-green-100 text-green-800 border-green-200",
};

const statusIcons: {[key: string]: React.ElementType} = {
  draft: Edit,
  published: CheckCircle,
};

interface CampaignHeaderProps {
  campaign: Campaign;
  operationsLoading: boolean;
  batchCallLoading: boolean;
  activeBatchCall: string | null;
  totalContacts: number;
  onPublish: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onStart: () => void;
  onStop: () => void;
}

export function CampaignHeader({
  campaign,
  operationsLoading,
  batchCallLoading,
  activeBatchCall,
  totalContacts,
  onPublish,
  onDuplicate,
  onDelete,
  onStart,
  onStop,
}: CampaignHeaderProps) {
  const StatusIcon = statusIcons[campaign.status];

  return (
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
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
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
          <Button onClick={onPublish} disabled={operationsLoading}>
            <Play className="w-4 h-4 mr-2" />
            Publish Campaign
          </Button>
        )}

        {campaign.status === "published" && (
          <>
            {!activeBatchCall ? (
              <Button
                onClick={onStart}
                disabled={batchCallLoading || totalContacts === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Campaign
              </Button>
            ) : (
              <Button
                onClick={onStop}
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
          onClick={onDuplicate}
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
          onClick={onDelete}
          variant="outline"
          disabled={operationsLoading}
          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}
