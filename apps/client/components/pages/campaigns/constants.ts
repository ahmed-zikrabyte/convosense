import { VoiceOption, CampaignSettings } from "./types";

export const VOICE_OPTIONS: VoiceOption[] = [
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

export const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = {
  max_duration_seconds: 300,
  retry_attempts: 3,
  retry_delay_seconds: 3600,
  enable_voicemail_detection: true,
  enable_ambient_sounds: false,
  ambient_sound_volume: 0.1,
};

export const ACCEPTED_FILE_TYPES = ".pdf,.txt,.doc,.docx,.csv,.json";
export const MAX_FILE_SIZE_MB = 10;