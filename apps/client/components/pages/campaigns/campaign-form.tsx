"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
} from "@workspace/ui/components/card";
import {
  Save,
  ArrowLeft,
  Bot,
  MessageSquare,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

import { AgentSelectionForm } from "./agent-selection-form";
import { GeneralPromptForm } from "./general-prompt-form";
import {
  CampaignFormProps,
  CampaignFormData,
} from "./types";

export function CampaignForm({
  mode,
  campaign,
  onSubmit,
  onCancel,
  loading = false,
  error,
}: CampaignFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    agent_id: "",
    general_prompt: "",
  });

  // Form validation errors
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Populate form when campaign loads (edit mode)
  useEffect(() => {
    if (mode === "edit" && campaign) {
      setFormData({
        name: campaign.name || "",
        agent_id: campaign.agent_id || "",
        general_prompt: campaign.general_prompt || "",
      });

      setHasChanges(false);
    }
  }, [campaign, mode]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Campaign title is required";
    }

    if (mode === "create" && !formData.agent_id) {
      newErrors.agent_id = "Agent selection is required";
    }

    if (!formData.general_prompt.trim()) {
      newErrors.general_prompt = "General prompt is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (step: number): boolean => {
    const stepErrors: Partial<Record<string, string>> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        stepErrors.name = "Campaign title is required";
      }
      if (mode === "create" && !formData.agent_id) {
        stepErrors.agent_id = "Agent selection is required";
      }
    } else if (step === 2) {
      if (!formData.general_prompt.trim()) {
        stepErrors.general_prompt = "General prompt is required";
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(2, prev + 1));
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

  const handleSubmit = async (isDraft = false) => {
    if (!validateForm()) {
      setCurrentStep(1);
      return;
    }

    try {
      await onSubmit(formData);
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
      return "Set up your AI voice campaign in 2 simple steps";
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
    { id: 1, title: "Agent Selection", icon: Bot },
    { id: 2, title: "General Prompt", icon: MessageSquare },
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
          <AgentSelectionForm
            data={formData}
            onChange={handleInputChange}
            errors={errors}
          />
        );
      case 2:
        return (
          <GeneralPromptForm
            data={formData}
            onChange={handleInputChange}
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
          disabled={loading || !formData.name || (mode === "create" && !formData.agent_id)}
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Saving..." : "Save Draft"}
        </Button>

        {currentStep < 2 ? (
          <Button
            onClick={handleNextStep}
            disabled={
              !formData.name ||
              (mode === "create" && !formData.agent_id)
            }
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={() => handleSubmit(false)}
            disabled={loading || !formData.general_prompt}
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

      {/* Form Content */}
      <Card>
        <CardContent className="p-8">
          {mode === "create" ? (
            <>
              {/* Step Progress Indicator for Create Mode */}
              {renderStepIndicator()}
              {renderStepContent()}
            </>
          ) : (
            <div className="space-y-6">
              <AgentSelectionForm
                data={formData}
                onChange={handleInputChange}
                errors={errors}
                isReadOnly={true}
              />
              <hr className="my-8" />
              <GeneralPromptForm
                data={formData}
                onChange={handleInputChange}
                errors={errors}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {mode === "create" ? (
        renderStepNavigation()
      ) : (
        <div className="flex justify-end mt-8">
          <Button
            onClick={() => handleSubmit(false)}
            disabled={loading || !hasChanges}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}

      {/* Changes indicator for Edit Mode */}
      {mode === "edit" && hasChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg">
          <div className="text-sm font-medium text-yellow-800">
            You have unsaved changes
          </div>
        </div>
      )}
    </div>
  );
}