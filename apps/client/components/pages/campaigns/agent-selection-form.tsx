"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Bot, Loader2 } from "lucide-react";
import { CampaignFormData } from "./types";
import { agentAPI, Agent } from "../../../lib/api/agents";

interface AgentSelectionFormProps {
  data: CampaignFormData;
  onChange: (field: keyof CampaignFormData, value: string) => void;
  errors?: Partial<Record<keyof CampaignFormData, string>>;
  isReadOnly?: boolean;
}

export function AgentSelectionForm({ data, onChange, errors, isReadOnly = false }: AgentSelectionFormProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const availableAgents = await agentAPI.getAssignedAgents();
        setAgents(availableAgents);
      } catch (err) {
        setError("Failed to load agents");
        console.error("Error fetching agents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const selectedAgent = agents.find(agent => agent.agentId === data.agent_id);

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Campaign Title *</Label>
        <Input
          id="name"
          placeholder="Enter campaign title"
          value={data.name}
          onChange={(e) => onChange("name", e.target.value)}
          className={errors?.name ? "border-red-500" : ""}
        />
        {errors?.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      {!isReadOnly && (
        <div>
          <Label htmlFor="agent">Select Agent *</Label>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading agents...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm py-4">{error}</div>
          ) : agents.length === 0 ? (
            <div className="text-muted-foreground text-sm py-4">
              No available agents. Please contact your administrator to assign agents to your account.
            </div>
          ) : (
            <>
              <Select
                value={data.agent_id}
                onValueChange={(value) => onChange("agent_id", value)}
              >
                <SelectTrigger className={errors?.agent_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Choose an agent for this campaign" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.agentId} value={agent.agentId}>
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4" />
                        <span>{agent.agentName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors?.agent_id && (
                <p className="text-sm text-red-500 mt-1">{errors.agent_id}</p>
              )}
            </>
          )}
        </div>
      )}

      {selectedAgent && (
        <div>
          {isReadOnly && <Label>Assigned Agent</Label>}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Bot className="w-8 h-8 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">{selectedAgent.agentName}</h4>
                  <p className="text-sm text-blue-700">Agent ID: {selectedAgent.agentId}</p>
                  {selectedAgent.assignedAt && (
                    <p className="text-sm text-blue-600">
                      Assigned on {new Date(selectedAgent.assignedAt).toLocaleDateString()}
                    </p>
                  )}
                  {isReadOnly && (
                    <p className="text-xs text-blue-500 mt-1">
                      Agent cannot be changed after campaign creation
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}