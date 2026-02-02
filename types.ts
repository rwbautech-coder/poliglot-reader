export enum SupportedLanguage {
  EN = 'EN',
  PL = 'PL',
}

export interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
}

export interface TtsConfig {
  engine: 'piper' | 'kokoro' | 'native';
  piperUrl: string; // URL for Polish Piper endpoint/worker
  piperVoice?: string; // Voice ID for Piper
  kokoroUrl: string; // URL for English Kokoro endpoint/worker
  kokoroApiKey?: string; // Optional API Key for Kokoro
  kokoroVoice?: string; // Voice ID for Kokoro
  volume: number;
  rate: number;
}

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  progress: number; // 0 to 1
  currentChunkIndex: number;
  totalChunks: number;
  audioBlob: Blob | null;
}