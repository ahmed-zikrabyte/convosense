export interface KnowledgeFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt?: string;
  fileUrl?: string;
  file?: File;
  isNew?: boolean;
}

export interface KnowledgeText {
  id: string;
  title: string;
  content: string;
}

export interface KnowledgeUrl {
  id: string;
  url: string;
  title: string;
}

export interface CampaignSettings {
  max_duration_seconds: number;
  retry_attempts: number;
  retry_delay_seconds: number;
  enable_voicemail_detection: boolean;
  enable_ambient_sounds: boolean;
  ambient_sound_volume: number;
}

export interface CampaignFormData {
  name: string;
  script_raw: string;
  voice_id: string;
  settings: CampaignSettings;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  accent: string;
}

export type CampaignFormMode = "create" | "edit";

export interface CampaignFormProps {
  mode: CampaignFormMode;
  campaign?: any; // Replace with actual campaign type from API
  onSubmit: (data: CampaignFormData, knowledgeBase: {
    files: KnowledgeFile[];
    texts: KnowledgeText[];
    urls: KnowledgeUrl[];
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
}