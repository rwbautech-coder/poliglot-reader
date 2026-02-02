export const APP_CONFIG = {
  // Heuristic thresholds
  PL_CHAR_THRESHOLD: 0.02, // 2% of unique chars must be Polish specific

  // Default endpoints (User can change these in UI)
  // Empty URL implies Client-Side WASM mode for Piper
  DEFAULT_PIPER_URL: '', 
  DEFAULT_PIPER_VOICE: 'pl_PL-gosia-medium',
  
  DEFAULT_KOKORO_URL: 'http://localhost:8880/v1/audio/speech',
  DEFAULT_KOKORO_VOICE: 'af_bella',
  
  // Chunking
  MAX_CHUNK_LENGTH: 200, // Characters per TTS chunk
};