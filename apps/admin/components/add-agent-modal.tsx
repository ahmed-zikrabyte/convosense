"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { RefreshCw, Bot, MessageSquare, Settings } from "lucide-react";
import api from "@/lib/axios";

interface RetellAgentDetails {
  agent_id: string;
  channel: string;
  last_modification_timestamp: number;
  agent_name: string;
  response_engine: {
    type: string;
    llm_id?: string;
    version?: number;
  };
  language: string;
  opt_out_sensitive_data_storage: boolean;
  data_storage_setting: string;
  opt_in_signed_url: boolean;
  end_call_after_silence_ms: number;
  version: number;
  is_published: boolean;
  post_call_analysis_model: string;
  pii_config: {
    mode: string;
    categories: string[];
  };
  voice_id: string;
  max_call_duration_ms: number;
  interruption_sensitivity: number;
  user_dtmf_options: Record<string, any>;
}

interface RetellLLMDetails {
  llm_id: string;
  version: number;
  model: string;
  model_high_priority: boolean;
  general_prompt: string;
  general_tools: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  start_speaker: string;
  kb_config: {
    top_k: number;
    filter_score: number;
  };
  last_modification_timestamp: number;
  is_published: boolean;
}

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { agentId: string; agentName: string }) => Promise<void>;
  loading: boolean;
}

export function AddAgentModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
}: AddAgentModalProps) {
  const [agentId, setAgentId] = useState("");
  const [agentDetails, setAgentDetails] = useState<RetellAgentDetails | null>(null);
  const [llmDetails, setLLMDetails] = useState<RetellLLMDetails | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [error, setError] = useState("");

  const handleFetchDetails = async () => {
    if (!agentId.trim()) {
      setError("Please enter an agent ID");
      return;
    }

    try {
      setFetchingDetails(true);
      setError("");

      const response = await api.get(`/admin/agents/retell/${agentId}`);
      const data = response.data;

      if (data.status === "success") {
        setAgentDetails(data.data.agentDetails);
        setLLMDetails(data.data.llmDetails || null);
      }
    } catch (error: any) {
      console.error("Error fetching agent details:", error);
      setError(error.response?.data?.message || "Failed to fetch agent details");
      setAgentDetails(null);
      setLLMDetails(null);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleSubmit = async () => {
    if (!agentDetails) {
      setError("Please fetch agent details first");
      return;
    }

    try {
      await onSubmit({
        agentId: agentDetails.agent_id,
        agentName: agentDetails.agent_name,
      });
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to add agent");
    }
  };

  const handleClose = () => {
    setAgentId("");
    setAgentDetails(null);
    setLLMDetails(null);
    setError("");
    onClose();
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Agent</DialogTitle>
          <DialogDescription>
            Enter a Retell Agent ID to fetch its details and add it to your system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Label htmlFor="agentId">Agent ID</Label>
              <Input
                id="agentId"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="agent_xxxxxxxxxxxxxxxxxxxxxxxx"
                disabled={fetchingDetails}
              />
            </div>
            <Button
              onClick={handleFetchDetails}
              disabled={fetchingDetails || !agentId.trim()}
            >
              {fetchingDetails ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Bot className="h-4 w-4 mr-2" />
              )}
              Fetch Details
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {agentDetails && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="h-5 w-5" />
                    <span>Agent Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm">{agentDetails.agent_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Agent ID</Label>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {agentDetails.agent_id}
                      </code>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Language</Label>
                      <p className="text-sm">{agentDetails.language}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Channel</Label>
                      <Badge variant="outline">{agentDetails.channel}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Version</Label>
                      <p className="text-sm">{agentDetails.version}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Published</Label>
                      <Badge variant={agentDetails.is_published ? "success" : "secondary"}>
                        {agentDetails.is_published ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Voice ID</Label>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {agentDetails.voice_id}
                      </code>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Max Duration</Label>
                      <p className="text-sm">{formatDuration(agentDetails.max_call_duration_ms)}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Response Engine</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{agentDetails.response_engine.type}</Badge>
                      {agentDetails.response_engine.llm_id && (
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {agentDetails.response_engine.llm_id}
                        </code>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {llmDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>LLM Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">LLM ID</Label>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {llmDetails.llm_id}
                        </code>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Model</Label>
                        <p className="text-sm">{llmDetails.model}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Version</Label>
                        <p className="text-sm">{llmDetails.version}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Start Speaker</Label>
                        <Badge variant="outline">{llmDetails.start_speaker}</Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">General Prompt</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{llmDetails.general_prompt}</p>
                      </div>
                    </div>

                    {llmDetails.general_tools && llmDetails.general_tools.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Tools</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {llmDetails.general_tools.map((tool, index) => (
                            <Badge key={index} variant="secondary">
                              {tool.name} ({tool.type})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !agentDetails}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Add Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}