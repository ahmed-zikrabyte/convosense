"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {MessageSquare} from "lucide-react";
import {Campaign} from "@/lib/api/campaigns";

interface CampaignInfoProps {
  campaign: Campaign;
}

export function CampaignInfo({campaign}: CampaignInfoProps) {
  return (
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
            General prompt and other agent configurations are managed through
            the assigned agent.
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
  );
}
