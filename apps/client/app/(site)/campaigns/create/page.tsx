"use client";

import React, {useState} from "react";
import {useRouter} from "next/navigation";
import {useCampaignOperations} from "@/lib/hooks/use-campaigns";
import {Button} from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {Input} from "@workspace/ui/components/input";
import {Label} from "@workspace/ui/components/label";
import {Textarea} from "@workspace/ui/components/textarea";
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
} from "lucide-react";
import Link from "next/link";
import {cn} from "@workspace/ui/lib/utils";

interface KnowledgeFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  file?: File;
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

interface CampaignData {
  name: string;
  script_raw: string;
  voice_id: string;
  settings: {
    max_duration_seconds: number;
    retry_attempts: number;
    retry_delay_seconds: number;
    enable_voicemail_detection: boolean;
    enable_ambient_sounds: boolean;
    ambient_sound_volume: number;
  };
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

export default function CreateCampaignPage() {
  const router = useRouter();
  const {createCampaign, loading: apiLoading, error: apiError} = useCampaignOperations();

  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState<CampaignData>({
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

  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [knowledgeTexts, setKnowledgeTexts] = useState<KnowledgeText[]>([]);
  const [knowledgeUrls, setKnowledgeUrls] = useState<KnowledgeUrl[]>([]);
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState("files");

  const handleInputChange = (field: string, value: any) => {
    setCampaignData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingsChange = (field: string, value: any) => {
    setCampaignData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      file,
    }));
    setKnowledgeFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setKnowledgeFiles((prev) => prev.filter((file) => file.id !== id));
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
  };

  const updateKnowledgeText = (id: string, field: string, value: string) => {
    setKnowledgeTexts((prev) =>
      prev.map((text) => (text.id === id ? {...text, [field]: value} : text))
    );
  };

  const removeKnowledgeText = (id: string) => {
    setKnowledgeTexts((prev) => prev.filter((text) => text.id !== id));
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
  };

  const updateKnowledgeUrl = (id: string, field: string, value: string) => {
    setKnowledgeUrls((prev) =>
      prev.map((url) => (url.id === id ? {...url, [field]: value} : url))
    );
  };

  const removeKnowledgeUrl = (id: string) => {
    setKnowledgeUrls((prev) => prev.filter((url) => url.id !== id));
  };

  const handleSave = async (isDraft = true) => {
    try {
      // Prepare knowledge base files metadata
      const kb_files_meta = [
        ...knowledgeFiles.map(file => ({
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          uploadedAt: new Date().toISOString(),
          // In a real implementation, you would upload the file first and get the URL
          fileUrl: `uploads/${file.fileName}`,
        })),
        ...knowledgeTexts.map(text => ({
          fileName: `${text.title || 'untitled'}.txt`,
          fileType: 'text/plain',
          fileSize: text.content.length,
          uploadedAt: new Date().toISOString(),
          // Store text content as a file or in a separate field
        })),
        ...knowledgeUrls.map(url => ({
          fileName: `${url.title || 'untitled'}.url`,
          fileType: 'text/url',
          fileSize: url.url.length,
          uploadedAt: new Date().toISOString(),
          fileUrl: url.url,
        })),
      ];

      const payload = {
        name: campaignData.name,
        script_raw: campaignData.script_raw,
        voice_id: campaignData.voice_id,
        settings: campaignData.settings,
        kb_files_meta,
      };

      const result = await createCampaign(payload);

      if (result) {
        // If it's not a draft, update status to active
        if (!isDraft && result.status === "draft") {
          // You might want to update the status here
        }

        // Redirect to campaigns list
        router.push("/campaigns");
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          placeholder="Enter campaign name"
          value={campaignData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="script">Call Script *</Label>
        <Textarea
          id="script"
          placeholder="Write your AI agent's script or conversation prompts..."
          value={campaignData.script_raw}
          onChange={(e) => handleInputChange("script_raw", e.target.value)}
          rows={8}
        />
        <p className="text-sm text-muted-foreground mt-2">
          This script will guide your AI agent during calls. Be clear and
          conversational.
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label>Knowledge Base</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Upload files, add text, or provide URLs to train your AI agent with
          additional context.
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
                        <p className="text-sm font-medium">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)}
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
                          updateKnowledgeUrl(
                            urlItem.id,
                            "title",
                            e.target.value
                          )
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

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label>Voice Selection *</Label>
        <Select
          value={campaignData.voice_id}
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
            value={campaignData.settings.max_duration_seconds}
            onChange={(e) =>
              handleSettingsChange(
                "max_duration_seconds",
                parseInt(e.target.value)
              )
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
            value={campaignData.settings.retry_attempts}
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
            value={campaignData.settings.retry_delay_seconds}
            onChange={(e) =>
              handleSettingsChange(
                "retry_delay_seconds",
                parseInt(e.target.value)
              )
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
            value={campaignData.settings.ambient_sound_volume}
            onChange={(e) =>
              handleSettingsChange(
                "ambient_sound_volume",
                parseFloat(e.target.value)
              )
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="voicemail"
            checked={campaignData.settings.enable_voicemail_detection}
            onChange={(e) =>
              handleSettingsChange(
                "enable_voicemail_detection",
                e.target.checked
              )
            }
          />
          <Label htmlFor="voicemail">Enable Voicemail Detection</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="ambient"
            checked={campaignData.settings.enable_ambient_sounds}
            onChange={(e) =>
              handleSettingsChange("enable_ambient_sounds", e.target.checked)
            }
          />
          <Label htmlFor="ambient">Enable Ambient Sounds</Label>
        </div>
      </div>
    </div>
  );

  const steps = [
    {id: 1, title: "Basic Info", icon: Bot},
    {id: 2, title: "Knowledge Base", icon: FileText},
    {id: 3, title: "Voice & Settings", icon: Settings},
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Campaign</h1>
          <p className="text-muted-foreground">
            Set up your AI voice campaign in 3 simple steps
          </p>
        </div>
      </div>

      {/* Show API errors */}
      {apiError && (
        <Card className="border-red-200 mb-6">
          <CardContent className="py-4">
            <div className="text-red-600 text-sm">
              Error: {apiError}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                  isActive && "bg-blue-100 text-blue-600",
                  isCompleted && "bg-green-100 text-green-600"
                )}
              >
                <StepIcon className="w-4 h-4" />
                <span className="font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-gray-300 mx-4" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="p-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>

        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={apiLoading || !campaignData.name}
          >
            <Save className="w-4 h-4 mr-2" />
            {apiLoading ? "Saving..." : "Save Draft"}
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep((prev) => Math.min(3, prev + 1))}
              disabled={
                !campaignData.name ||
                (currentStep === 1 && !campaignData.script_raw)
              }
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={() => handleSave(false)}
              disabled={apiLoading || !campaignData.voice_id}
            >
              {apiLoading ? "Creating..." : "Create Campaign"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
