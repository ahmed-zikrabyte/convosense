"use client";

import React from "react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Mic } from "lucide-react";
import { CampaignFormData, CampaignSettings } from "./types";
import { VOICE_OPTIONS } from "./constants";

interface VoiceSettingsFormProps {
  data: CampaignFormData;
  onChange: (field: keyof CampaignFormData, value: string) => void;
  onSettingsChange: (field: keyof CampaignSettings, value: any) => void;
  errors?: Partial<Record<keyof CampaignFormData | keyof CampaignSettings, string>>;
}

export function VoiceSettingsForm({
  data,
  onChange,
  onSettingsChange,
  errors
}: VoiceSettingsFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Voice Selection *</Label>
        <Select
          value={data.voice_id}
          onValueChange={(value) => onChange("voice_id", value)}
        >
          <SelectTrigger className={errors?.voice_id ? "border-red-500" : ""}>
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            {VOICE_OPTIONS.map((voice) => (
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
        {errors?.voice_id && (
          <p className="text-sm text-red-500 mt-1">{errors.voice_id}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="duration">Max Call Duration (seconds)</Label>
          <Input
            id="duration"
            type="number"
            min="30"
            max="1800"
            value={data.settings.max_duration_seconds}
            onChange={(e) =>
              onSettingsChange("max_duration_seconds", parseInt(e.target.value))
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
            value={data.settings.retry_attempts}
            onChange={(e) =>
              onSettingsChange("retry_attempts", parseInt(e.target.value))
            }
          />
        </div>

        <div>
          <Label htmlFor="delay">Retry Delay (seconds)</Label>
          <Input
            id="delay"
            type="number"
            min="300"
            value={data.settings.retry_delay_seconds}
            onChange={(e) =>
              onSettingsChange("retry_delay_seconds", parseInt(e.target.value))
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
            value={data.settings.ambient_sound_volume}
            onChange={(e) =>
              onSettingsChange("ambient_sound_volume", parseFloat(e.target.value))
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="voicemail"
            checked={data.settings.enable_voicemail_detection}
            onChange={(e) =>
              onSettingsChange("enable_voicemail_detection", e.target.checked)
            }
          />
          <Label htmlFor="voicemail">Enable Voicemail Detection</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="ambient"
            checked={data.settings.enable_ambient_sounds}
            onChange={(e) =>
              onSettingsChange("enable_ambient_sounds", e.target.checked)
            }
          />
          <Label htmlFor="ambient">Enable Ambient Sounds</Label>
        </div>
      </div>
    </div>
  );
}