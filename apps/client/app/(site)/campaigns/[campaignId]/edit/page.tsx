"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCampaign, useCampaignOperations } from "@/lib/hooks/use-campaigns";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Upload,
  FileText,
  Link as LinkIcon,
  X,
  Plus,
  Save,
  ArrowLeft,
  Mic,
  Settings,
  Bot,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

interface KnowledgeFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  fileUrl?: string;
  file?: File;
  isNew?: boolean;
}

interface KnowledgeText {
  id: string;
  title: string;
  content: string;
}

interface KnowledgeUrl {
  id: string;
  url: string;
  title: string;
}

const voiceOptions = [
  {
    id: "voice_1",
    name: "Sarah (Professional)",
    gender: "Female",
    accent: "American",
  },
  {
    id: "voice_2",
    name: "Michael (Friendly)",
    gender: "Male",
    accent: "American",
  },
  {
    id: "voice_3",
    name: "Emma (Conversational)",
    gender: "Female",
    accent: "British",
  },
  {
    id: "voice_4",
    name: "James (Authoritative)",
    gender: "Male",
    accent: "American",
  },
];

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const { campaign, loading: campaignLoading, error: campaignError, refetch } = useCampaign(campaignId);
  const { updateCampaign, loading: apiLoading, error: apiError } = useCampaignOperations();

  const [currentTab, setCurrentTab] = useState("basic");
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    script_raw: "",
    voice_id: "",
    settings: {
      max_duration_seconds: 300,
      retry_attempts: 3,
      retry_delay_seconds: 3600,
      enable_voicemail_detection: true,
      enable_ambient_sounds: false,
      ambient_sound_volume: 0.1,
    },
  });

  // Knowledge base state
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [knowledgeTexts, setKnowledgeTexts] = useState<KnowledgeText[]>([]);
  const [knowledgeUrls, setKnowledgeUrls] = useState<KnowledgeUrl[]>([]);
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState("files");

  // Populate form when campaign loads
  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        script_raw: campaign.script_raw,
        voice_id: campaign.voice_id,
        settings: { ...campaign.settings },
      });

      // Convert existing knowledge base files
      const existingFiles = campaign.kb_files_meta.map((file, index) => ({
        ...file,
        id: `existing-${index}`,
        isNew: false,
      }));
      setKnowledgeFiles(existingFiles);
    }
  }, [campaign]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSettingsChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map((file) => ({
      id: `new-${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      file,
      isNew: true,
    }));
    setKnowledgeFiles((prev) => [...prev, ...newFiles]);
    setHasChanges(true);
  };

  const removeFile = (id: string) => {
    setKnowledgeFiles((prev) => prev.filter((file) => file.id !== id));
    setHasChanges(true);
  };

  const addKnowledgeText = () => {
    setKnowledgeTexts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        title: "",
        content: "",
      },
    ]);
    setHasChanges(true);
  };

  const updateKnowledgeText = (id: string, field: string, value: string) => {
    setKnowledgeTexts((prev) =>
      prev.map((text) => (text.id === id ? { ...text, [field]: value } : text))
    );
    setHasChanges(true);
  };

  const removeKnowledgeText = (id: string) => {
    setKnowledgeTexts((prev) => prev.filter((text) => text.id !== id));
    setHasChanges(true);
  };

  const addKnowledgeUrl = () => {
    setKnowledgeUrls((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        url: "",
        title: "",
      },
    ]);
    setHasChanges(true);
  };

  const updateKnowledgeUrl = (id: string, field: string, value: string) => {
    setKnowledgeUrls((prev) =>
      prev.map((url) => (url.id === id ? { ...url, [field]: value } : url))
    );
    setHasChanges(true);
  };

  const removeKnowledgeUrl = (id: string) => {
    setKnowledgeUrls((prev) => prev.filter((url) => url.id !== id));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!campaign) return;

    try {
      // Prepare knowledge base files metadata
      const kb_files_meta = [
        // Existing files (keep as-is)
        ...knowledgeFiles
          .filter(file => !file.isNew)
          .map(file => ({
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            uploadedAt: file.uploadedAt,
            fileUrl: file.fileUrl,
          })),
        // New files (in a real implementation, you would upload these first)
        ...knowledgeFiles
          .filter(file => file.isNew)
          .map(file => ({
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            uploadedAt: new Date().toISOString(),
            fileUrl: `uploads/${file.fileName}`, // Placeholder
          })),
        // Text knowledge
        ...knowledgeTexts.map(text => ({
          fileName: `${text.title || 'untitled'}.txt`,
          fileType: 'text/plain',
          fileSize: text.content.length,
          uploadedAt: new Date().toISOString(),
        })),
        // URL knowledge
        ...knowledgeUrls.map(url => ({
          fileName: `${url.title || 'untitled'}.url`,
          fileType: 'text/url',
          fileSize: url.url.length,
          uploadedAt: new Date().toISOString(),
          fileUrl: url.url,
        })),
      ];

      const updateData = {
        ...formData,
        kb_files_meta,
      };

      const result = await updateCampaign(campaign.campaignId, updateData);

      if (result) {
        setHasChanges(false);
        refetch();
        router.push(`/campaigns/${campaign.campaignId}`);
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (campaignLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-red-500 mb-4">
              {campaignError || "Campaign not found"}
            </div>
            <div className="space-x-4">
              <Button onClick={() => router.push("/campaigns")}>
                Back to Campaigns
              </Button>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          placeholder="Enter campaign name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="script">Call Script *</Label>
        <Textarea
          id="script"
          placeholder="Write your AI agent's script or conversation prompts..."
          value={formData.script_raw}
          onChange={(e) => handleInputChange("script_raw", e.target.value)}
          rows={8}
        />
        <p className="text-sm text-muted-foreground mt-2">
          This script will guide your AI agent during calls. Be clear and conversational.
        </p>
      </div>
    </div>
  );

  const renderKnowledgeBase = () => (
    <div className="space-y-6">
      <div>
        <Label>Knowledge Base</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Upload files, add text, or provide URLs to train your AI agent with additional context.
        </p>

        <Tabs value={activeKnowledgeTab} onValueChange={setActiveKnowledgeTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="urls">URLs</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.doc,.docx,.csv,.json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium">Upload Files</p>
                <p className="text-xs text-muted-foreground">
                  PDF, TXT, DOC, DOCX, CSV, JSON (Max 10MB each)
                </p>
              </label>
            </div>

            {knowledgeFiles.length > 0 && (
              <div className="space-y-2">
                {knowledgeFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">{file.fileName}</p>
                          {file.isNew && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)} • {file.fileType}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <Button
              onClick={addKnowledgeText}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Text Knowledge
            </Button>

            {knowledgeTexts.map((text) => (
              <Card key={text.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="Knowledge title"
                      value={text.title}
                      onChange={(e) =>
                        updateKnowledgeText(text.id, "title", e.target.value)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeKnowledgeText(text.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter knowledge content..."
                    value={text.content}
                    onChange={(e) =>
                      updateKnowledgeText(text.id, "content", e.target.value)
                    }
                    rows={4}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="urls" className="space-y-4">
            <Button
              onClick={addKnowledgeUrl}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add URL Knowledge
            </Button>

            {knowledgeUrls.map((urlItem) => (
              <Card key={urlItem.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        placeholder="Knowledge title"
                        value={urlItem.title}
                        onChange={(e) =>
                          updateKnowledgeUrl(urlItem.id, "title", e.target.value)
                        }
                        className="flex-1 mr-2"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeKnowledgeUrl(urlItem.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="https://example.com"
                        value={urlItem.url}
                        onChange={(e) =>
                          updateKnowledgeUrl(urlItem.id, "url", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  const renderVoiceSettings = () => (
    <div className="space-y-6">
      <div>
        <Label>Voice Selection *</Label>
        <Select
          value={formData.voice_id}
          onValueChange={(value) => handleInputChange("voice_id", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            {voiceOptions.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                <div className="flex items-center space-x-2">
                  <Mic className="w-4 h-4" />
                  <div>
                    <span className="font-medium">{voice.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {voice.gender} • {voice.accent}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="duration">Max Call Duration (seconds)</Label>
          <Input
            id="duration"
            type="number"
            min="30"
            max="1800"
            value={formData.settings.max_duration_seconds}
            onChange={(e) =>
              handleSettingsChange("max_duration_seconds", parseInt(e.target.value))
            }
          />
        </div>

        <div>
          <Label htmlFor="retries">Retry Attempts</Label>
          <Input
            id="retries"
            type="number"
            min="0"
            max="10"
            value={formData.settings.retry_attempts}
            onChange={(e) =>
              handleSettingsChange("retry_attempts", parseInt(e.target.value))
            }
          />
        </div>

        <div>
          <Label htmlFor="delay">Retry Delay (seconds)</Label>
          <Input
            id="delay"
            type="number"
            min="300"
            value={formData.settings.retry_delay_seconds}
            onChange={(e) =>
              handleSettingsChange("retry_delay_seconds", parseInt(e.target.value))
            }
          />
        </div>

        <div>
          <Label htmlFor="volume">Ambient Sound Volume</Label>
          <Input
            id="volume"
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={formData.settings.ambient_sound_volume}
            onChange={(e) =>
              handleSettingsChange("ambient_sound_volume", parseFloat(e.target.value))
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="voicemail"
            checked={formData.settings.enable_voicemail_detection}
            onChange={(e) =>
              handleSettingsChange("enable_voicemail_detection", e.target.checked)
            }
          />
          <Label htmlFor="voicemail">Enable Voicemail Detection</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="ambient"
            checked={formData.settings.enable_ambient_sounds}
            onChange={(e) =>
              handleSettingsChange("enable_ambient_sounds", e.target.checked)
            }
          />
          <Label htmlFor="ambient">Enable Ambient Sounds</Label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/campaigns/${campaign.campaignId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Campaign</h1>
            <p className="text-muted-foreground">
              {campaign.name} • {campaign.status}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link href={`/campaigns/${campaign.campaignId}`}>
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View Campaign
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={apiLoading || !hasChanges}
          >
            <Save className="w-4 h-4 mr-2" />
            {apiLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Show API errors */}
      {apiError && (
        <Card className="border-red-200">
          <CardContent className="py-4">
            <div className="text-red-600 text-sm">Error: {apiError}</div>
          </CardContent>
        </Card>
      )}

      {/* Form Content */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="flex items-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <span>Basic Info</span>
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Knowledge Base</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Voice & Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="basic" className="space-y-6 mt-0">
                {renderBasicInfo()}
              </TabsContent>

              <TabsContent value="knowledge" className="space-y-6 mt-0">
                {renderKnowledgeBase()}
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-0">
                {renderVoiceSettings()}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Changes indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg">
          <div className="text-sm font-medium text-yellow-800">
            You have unsaved changes
          </div>
        </div>
      )}
    </div>
  );
}