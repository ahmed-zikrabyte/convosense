"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Loader2, RefreshCw, Bot } from "lucide-react";
import { CampaignFormData } from "./types";
import { agentAPI, RetellLLMDetails, Agent } from "../../../lib/api/agents";

interface GeneralPromptFormProps {
  data: CampaignFormData;
  onChange: (field: keyof CampaignFormData, value: string) => void;
  errors?: Partial<Record<keyof CampaignFormData, string>>;
}

export function GeneralPromptForm({ data, onChange, errors }: GeneralPromptFormProps) {
  const [llmDetails, setLlmDetails] = useState<RetellLLMDetails | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (!data.agent_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const agentData = await agentAPI.getAgentWithLLM(data.agent_id);
        setAgent(agentData.agent);
        setLlmDetails(agentData.llmDetails || null);

        // Set the general prompt from the LLM if available and user hasn't edited it yet
        if (agentData.llmDetails?.general_prompt && !data.general_prompt) {
          onChange("general_prompt", agentData.llmDetails.general_prompt);
        }
      } catch (err) {
        setError("Failed to load agent details");
        console.error("Error fetching agent details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentDetails();
  }, [data.agent_id]);

  const handleRefresh = async () => {
    if (!data.agent_id) return;

    try {
      setLoading(true);
      setError(null);
      const agentData = await agentAPI.getAgentWithLLM(data.agent_id);
      setLlmDetails(agentData.llmDetails || null);

      // Update the prompt with fresh data
      if (agentData.llmDetails?.general_prompt) {
        onChange("general_prompt", agentData.llmDetails.general_prompt);
      }
    } catch (err) {
      setError("Failed to refresh agent details");
      console.error("Error refreshing agent details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!data.agent_id) {
    return (
      <div className="text-center py-8">
        <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Please select an agent in the previous step to continue.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading agent configuration...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {agent && (
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span>Selected Agent: {agent.agentName}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p><strong>Agent ID:</strong> {agent.agentId}</p>
              {llmDetails && (
                <>
                  <p><strong>LLM Model:</strong> {llmDetails.model}</p>
                  <p><strong>Version:</strong> {llmDetails.version}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="general_prompt">General Prompt *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh from Agent
          </Button>
        </div>
        <Textarea
          id="general_prompt"
          placeholder="Edit the general prompt for your campaign..."
          value={data.general_prompt}
          onChange={(e) => onChange("general_prompt", e.target.value)}
          rows={12}
          className={errors?.general_prompt ? "border-red-500" : ""}
        />
        <p className="text-sm text-muted-foreground mt-2">
          This prompt will guide your AI agent's behavior during calls.
          You can customize it for your specific campaign needs.
        </p>
        {errors?.general_prompt && (
          <p className="text-sm text-red-500 mt-1">{errors.general_prompt}</p>
        )}
      </div>

      {llmDetails && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">LLM Configuration</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Model:</strong> {llmDetails.model}</p>
              <p><strong>Start Speaker:</strong> {llmDetails.start_speaker}</p>
              <p><strong>Published:</strong> {llmDetails.is_published ? "Yes" : "No"}</p>
              {llmDetails.general_tools?.length > 0 && (
                <p><strong>Tools:</strong> {llmDetails.general_tools.map(tool => tool.name).join(", ")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}