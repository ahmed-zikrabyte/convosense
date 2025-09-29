"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  Settings,
  Volume2,
  Edit,
  RefreshCw,
  Play,
  Pause,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "@/lib/axios";
import { EditPromptModal } from "@/components/edit-prompt-modal";

interface Agent {
  _id: string;
  agentId: string;
  agentName: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

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

interface VoiceDetails {
  voice_id: string;
  voice_name: string;
  provider: string;
  accent: string;
  gender: string;
  age: string;
  preview_audio_url: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentDetails, setAgentDetails] = useState<RetellAgentDetails | null>(null);
  const [llmDetails, setLLMDetails] = useState<RetellLLMDetails | null>(null);
  const [voiceDetails, setVoiceDetails] = useState<VoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchAgentData();
  }, [agentId]);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [audio]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);

      // Fetch agent from database
      const agentResponse = await api.get(`/admin/agents/${agentId}`);
      if (agentResponse.data.status === "success") {
        const agentData = agentResponse.data.data.agent;
        setAgent(agentData);

        // Fetch Retell agent details
        const detailsResponse = await api.get(`/admin/agents/retell/${agentData.agentId}`);
        if (detailsResponse.data.status === "success") {
          setAgentDetails(detailsResponse.data.data.agentDetails);
          setLLMDetails(detailsResponse.data.data.llmDetails || null);

          // Fetch voice details if voice_id exists
          if (detailsResponse.data.data.agentDetails.voice_id) {
            try {
              const voiceResponse = await api.get(`/admin/agents/voice/${detailsResponse.data.data.agentDetails.voice_id}`);
              if (voiceResponse.data.status === "success") {
                setVoiceDetails(voiceResponse.data.data.voice);
              }
            } catch (error) {
              console.warn("Failed to fetch voice details:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching agent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrompt = async (newPrompt: string, publishAgent = false) => {
    if (!llmDetails || !agentDetails) return;

    try {
      // Update the LLM prompt
      const response = await api.patch(`/admin/agents/llm/${llmDetails.llm_id}`, {
        general_prompt: newPrompt
      });

      if (response.data.status === "success") {
        setLLMDetails(response.data.data.llm);

        // If publish is requested, publish the agent
        if (publishAgent) {
          try {
            await api.post(`/admin/agents/${agentDetails.agent_id}/publish`);
            // Refresh agent details to get updated published status
            await fetchAgentData();
          } catch (publishError) {
            console.error("Error publishing agent:", publishError);
            // Don't throw here - prompt was saved successfully
          }
        }

        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error updating prompt:", error);
      throw error;
    }
  };

  const playVoicePreview = () => {
    if (!voiceDetails?.preview_audio_url) return;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    const newAudio = new Audio(voiceDetails.preview_audio_url);
    newAudio.onplay = () => setAudioPlaying(true);
    newAudio.onpause = () => setAudioPlaying(false);
    newAudio.onended = () => setAudioPlaying(false);
    newAudio.onerror = () => {
      setAudioPlaying(false);
      console.error("Error playing audio");
    };

    setAudio(newAudio);
    newAudio.play().catch(console.error);
  };

  const stopVoicePreview = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading agent details...</span>
        </div>
      </div>
    );
  }

  if (!agent || !agentDetails) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Agent not found</p>
          <Button variant="outline" onClick={() => router.push("/agents")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push("/agents")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{agent.agentName}</h2>
            <p className="text-muted-foreground">Agent Details & Configuration</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={fetchAgentData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>Agent Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm font-medium">{agentDetails.agent_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Agent ID</label>
                <code className="text-sm bg-muted px-2 py-1 rounded block">
                  {agentDetails.agent_id}
                </code>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Slug</label>
                <Badge variant="outline">{agent.slug}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Language</label>
                  <p className="text-sm">{agentDetails.language}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Channel</label>
                  <Badge variant="outline">{agentDetails.channel}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p className="text-sm">{agentDetails.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Published</label>
                  <Badge variant={agentDetails.is_published ? "success" : "secondary"}>
                    {agentDetails.is_published ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Max Call Duration</label>
                <p className="text-sm">{formatDuration(agentDetails.max_call_duration_ms)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Details */}
        {voiceDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Volume2 className="h-5 w-5" />
                <span>Voice Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Voice Name</label>
                  <p className="text-sm font-medium">{voiceDetails.voice_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Voice ID</label>
                  <code className="text-sm bg-muted px-2 py-1 rounded block">
                    {voiceDetails.voice_id}
                  </code>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Provider</label>
                    <Badge variant="outline">{voiceDetails.provider}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Accent</label>
                    <p className="text-sm">{voiceDetails.accent}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="text-sm">{voiceDetails.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Age</label>
                    <p className="text-sm">{voiceDetails.age}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Preview</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={audioPlaying ? stopVoicePreview : playVoicePreview}
                      disabled={!voiceDetails.preview_audio_url}
                    >
                      {audioPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {audioPlaying ? "Playing..." : "Click to preview voice"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Response Engine */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Response Engine</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <Badge variant="outline">{agentDetails.response_engine.type}</Badge>
              </div>
              {agentDetails.response_engine.llm_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">LLM ID</label>
                  <code className="text-sm bg-muted px-2 py-1 rounded block">
                    {agentDetails.response_engine.llm_id}
                  </code>
                </div>
              )}
              {agentDetails.response_engine.version && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Engine Version</label>
                  <p className="text-sm">{agentDetails.response_engine.version}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* LLM Details */}
        {llmDetails && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>LLM Configuration</span>
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Prompt
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Model</label>
                  <p className="text-sm font-medium">{llmDetails.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p className="text-sm">{llmDetails.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Speaker</label>
                  <Badge variant="outline">{llmDetails.start_speaker}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Published</label>
                  <Badge variant={llmDetails.is_published ? "success" : "secondary"}>
                    {llmDetails.is_published ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">General Prompt</label>
                <div className="mt-2 p-4 bg-muted rounded-lg max-h-64 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {llmDetails.general_prompt}
                  </pre>
                </div>
              </div>

              {llmDetails.general_tools && llmDetails.general_tools.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Available Tools</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {llmDetails.general_tools.map((tool, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
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

      {llmDetails && (
        <EditPromptModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditPrompt}
          currentPrompt={llmDetails.general_prompt}
          llmId={llmDetails.llm_id}
          agentId={agentDetails?.agent_id}
        />
      )}
    </div>
  );
}