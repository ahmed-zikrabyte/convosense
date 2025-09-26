"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Save,
  ArrowLeft,
  Bot,
  FileText,
  Settings,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

import { BasicInfoForm } from "./basic-info-form";
import { KnowledgeBaseForm } from "./knowledge-base-form";
import { VoiceSettingsForm } from "./voice-settings-form";
import {
  CampaignFormProps,
  CampaignFormData,
  KnowledgeFile,
  KnowledgeText,
  KnowledgeUrl,
  CampaignSettings,
} from "./types";
import { DEFAULT_CAMPAIGN_SETTINGS } from "./constants";
import { generateId, prepareKnowledgeBaseForSubmit } from "./utils";

export function CampaignForm({
  mode,
  campaign,
  onSubmit,
  onCancel,
  loading = false,
  error,
}: CampaignFormProps) {
  const [currentTab, setCurrentTab] = useState("basic");
  const [currentStep, setCurrentStep] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    script_raw: "",
    voice_id: "",
    settings: { ...DEFAULT_CAMPAIGN_SETTINGS },
  });

  // Knowledge base state
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [knowledgeTexts, setKnowledgeTexts] = useState<KnowledgeText[]>([]);
  const [knowledgeUrls, setKnowledgeUrls] = useState<KnowledgeUrl[]>([]);
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState("files");

  // Form validation errors
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Populate form when campaign loads (edit mode)
  useEffect(() => {
    if (mode === "edit" && campaign) {
      setFormData({
        name: campaign.name || "",
        script_raw: campaign.script_raw || "",
        voice_id: campaign.voice_id || "",
        settings: { ...DEFAULT_CAMPAIGN_SETTINGS, ...campaign.settings },
      });

      // Convert existing knowledge base files
      if (campaign.kb_files_meta) {
        const existingFiles = campaign.kb_files_meta.map((file: any, index: number) => ({
          ...file,
          id: `existing-${index}`,
          isNew: false,
        }));
        setKnowledgeFiles(existingFiles);
      }

      setHasChanges(false);
    }
  }, [campaign, mode]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Campaign name is required";
    }

    if (!formData.script_raw.trim()) {
      newErrors.script_raw = "Call script is required";
    }

    if (!formData.voice_id) {
      newErrors.voice_id = "Voice selection is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (step: number): boolean => {
    const stepErrors: Partial<Record<string, string>> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        stepErrors.name = "Campaign name is required";
      }
      if (!formData.script_raw.trim()) {
        stepErrors.script_raw = "Call script is required";
      }
    } else if (step === 3) {
      if (!formData.voice_id) {
        stepErrors.voice_id = "Voice selection is required";
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(3, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleInputChange = (field: keyof CampaignFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSettingsChange = (field: keyof CampaignSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  // Knowledge base handlers
  const handleFileUpload = (fileList: FileList) => {
    const files = Array.from(fileList);
    const newFiles = files.map((file) => ({
      id: `new-${generateId()}`,
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

  const handleFileRemove = (id: string) => {
    setKnowledgeFiles((prev) => prev.filter((file) => file.id !== id));
    setHasChanges(true);
  };

  const handleTextAdd = () => {
    setKnowledgeTexts((prev) => [
      ...prev,
      {
        id: generateId(),
        title: "",
        content: "",
      },
    ]);
    setHasChanges(true);
  };

  const handleTextUpdate = (id: string, field: keyof KnowledgeText, value: string) => {
    setKnowledgeTexts((prev) =>
      prev.map((text) => (text.id === id ? { ...text, [field]: value } : text))
    );
    setHasChanges(true);
  };

  const handleTextRemove = (id: string) => {
    setKnowledgeTexts((prev) => prev.filter((text) => text.id !== id));
    setHasChanges(true);
  };

  const handleUrlAdd = () => {
    setKnowledgeUrls((prev) => [
      ...prev,
      {
        id: generateId(),
        url: "",
        title: "",
      },
    ]);
    setHasChanges(true);
  };

  const handleUrlUpdate = (id: string, field: keyof KnowledgeUrl, value: string) => {
    setKnowledgeUrls((prev) =>
      prev.map((url) => (url.id === id ? { ...url, [field]: value } : url))
    );
    setHasChanges(true);
  };

  const handleUrlRemove = (id: string) => {
    setKnowledgeUrls((prev) => prev.filter((url) => url.id !== id));
    setHasChanges(true);
  };

  const handleSubmit = async (isDraft = false) => {
    if (!validateForm()) {
      setCurrentTab("basic");
      return;
    }

    try {
      await onSubmit(formData, {
        files: knowledgeFiles,
        texts: knowledgeTexts,
        urls: knowledgeUrls,
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Error submitting campaign:", error);
    }
  };

  const getTitle = () => {
    return mode === "create" ? "Create Campaign" : "Edit Campaign";
  };

  const getSubtitle = () => {
    if (mode === "create") {
      return "Set up your AI voice campaign in 3 simple steps";
    }
    return campaign ? `${campaign.name} • ${campaign.status}` : "";
  };

  const getBackUrl = () => {
    if (mode === "create") {
      return "/campaigns";
    }
    return campaign ? `/campaigns/${campaign.campaignId}` : "/campaigns";
  };

  const steps = [
    { id: 1, title: "Basic Info", icon: Bot },
    { id: 2, title: "Knowledge Base", icon: FileText },
    { id: 3, title: "Voice & Settings", icon: Settings },
  ];

  const renderStepIndicator = () => (
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
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoForm
            data={formData}
            onChange={handleInputChange}
            errors={errors}
          />
        );
      case 2:
        return (
          <KnowledgeBaseForm
            files={knowledgeFiles}
            texts={knowledgeTexts}
            urls={knowledgeUrls}
            activeTab={activeKnowledgeTab}
            onTabChange={setActiveKnowledgeTab}
            onFileUpload={handleFileUpload}
            onFileRemove={handleFileRemove}
            onTextAdd={handleTextAdd}
            onTextUpdate={handleTextUpdate}
            onTextRemove={handleTextRemove}
            onUrlAdd={handleUrlAdd}
            onUrlUpdate={handleUrlUpdate}
            onUrlRemove={handleUrlRemove}
          />
        );
      case 3:
        return (
          <VoiceSettingsForm
            data={formData}
            onChange={handleInputChange}
            onSettingsChange={handleSettingsChange}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  const renderStepNavigation = () => (
    <div className="flex justify-between mt-8">
      <Button
        variant="outline"
        onClick={handlePrevStep}
        disabled={currentStep === 1}
      >
        Previous
      </Button>

      <div className="space-x-4">
        <Button
          variant="outline"
          onClick={() => handleSubmit(true)}
          disabled={loading || !formData.name}
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Saving..." : "Save Draft"}
        </Button>

        {currentStep < 3 ? (
          <Button
            onClick={handleNextStep}
            disabled={
              !formData.name ||
              (currentStep === 1 && !formData.script_raw)
            }
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={() => handleSubmit(false)}
            disabled={loading || !formData.voice_id}
          >
            {loading ? "Creating..." : "Create Campaign"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href={getBackUrl()}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{getTitle()}</h1>
            <p className="text-muted-foreground">{getSubtitle()}</p>
          </div>
        </div>

        {mode === "edit" && (
          <div className="flex items-center space-x-2">
            {campaign && (
              <Link href={`/campaigns/${campaign.campaignId}`}>
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  View Campaign
                </Button>
              </Link>
            )}
            <Button
              onClick={() => handleSubmit(false)}
              disabled={loading || !hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Show errors */}
      {error && (
        <Card className="border-red-200 mb-6">
          <CardContent className="py-4">
            <div className="text-red-600 text-sm">Error: {error}</div>
          </CardContent>
        </Card>
      )}

      {mode === "create" ? (
        <>
          {/* Step Progress Indicator for Create Mode */}
          {renderStepIndicator()}

          {/* Form Content for Create Mode */}
          <Card>
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Step Navigation for Create Mode */}
          {renderStepNavigation()}
        </>
      ) : (
        <>
          {/* Tab Interface for Edit Mode */}
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
                    <BasicInfoForm
                      data={formData}
                      onChange={handleInputChange}
                      errors={errors}
                    />
                  </TabsContent>

                  <TabsContent value="knowledge" className="space-y-6 mt-0">
                    <KnowledgeBaseForm
                      files={knowledgeFiles}
                      texts={knowledgeTexts}
                      urls={knowledgeUrls}
                      activeTab={activeKnowledgeTab}
                      onTabChange={setActiveKnowledgeTab}
                      onFileUpload={handleFileUpload}
                      onFileRemove={handleFileRemove}
                      onTextAdd={handleTextAdd}
                      onTextUpdate={handleTextUpdate}
                      onTextRemove={handleTextRemove}
                      onUrlAdd={handleUrlAdd}
                      onUrlUpdate={handleUrlUpdate}
                      onUrlRemove={handleUrlRemove}
                    />
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6 mt-0">
                    <VoiceSettingsForm
                      data={formData}
                      onChange={handleInputChange}
                      onSettingsChange={handleSettingsChange}
                      errors={errors}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Changes indicator for Edit Mode */}
          {hasChanges && (
            <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg">
              <div className="text-sm font-medium text-yellow-800">
                You have unsaved changes
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}