"use client";

import React from "react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { CampaignFormData } from "./types";

interface BasicInfoFormProps {
  data: CampaignFormData;
  onChange: (field: keyof CampaignFormData, value: string) => void;
  errors?: Partial<Record<keyof CampaignFormData, string>>;
}

export function BasicInfoForm({ data, onChange, errors }: BasicInfoFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          placeholder="Enter campaign name"
          value={data.name}
          onChange={(e) => onChange("name", e.target.value)}
          className={errors?.name ? "border-red-500" : ""}
        />
        {errors?.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="script">Call Script *</Label>
        <Textarea
          id="script"
          placeholder="Write your AI agent's script or conversation prompts..."
          value={data.script_raw}
          onChange={(e) => onChange("script_raw", e.target.value)}
          rows={8}
          className={errors?.script_raw ? "border-red-500" : ""}
        />
        <p className="text-sm text-muted-foreground mt-2">
          This script will guide your AI agent during calls. Be clear and
          conversational.
        </p>
        {errors?.script_raw && (
          <p className="text-sm text-red-500 mt-1">{errors.script_raw}</p>
        )}
      </div>
    </div>
  );
}