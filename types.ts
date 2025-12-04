export enum AppState {
  IDLE = 'IDLE',
  FETCHING_URL = 'FETCHING_URL',
  SUMMARIZING = 'SUMMARIZING',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}

export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
  Aoede = 'Aoede'
}

export enum SummaryTone {
  PROFESSIONAL = 'Professional',
  CASUAL = 'Casual',
  WITTY = 'Witty',
  BRIEF = 'Brief'
}

export interface AudioSummaryResult {
  summaryText: string;
  audioUrl: string; // Blob URL
}

export interface Bookmark {
  id: string;
  createdAt: number;
  script: string;
  tone: SummaryTone;
  voice: VoiceName;
  preview: string;
}