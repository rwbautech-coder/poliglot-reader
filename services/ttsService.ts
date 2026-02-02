import { SupportedLanguage, TtsConfig } from '../types';

/**
 * Interface for TTS generation.
 * Retuns a Promise that resolves to an AudioBlob.
 */
export interface ITTSGenerator {
  generate(text: string, lang: SupportedLanguage, config: TtsConfig): Promise<Blob>;
}

// Global cache for the Piper module to avoid re-importing/re-initializing
let piperModule: any = null;

// 1. Piper TTS (Polish) - Hybrid API/WASM wrapper
class PiperTTS implements ITTSGenerator {
  async generate(text: string, lang: SupportedLanguage, config: TtsConfig): Promise<Blob> {
    
    // MODE A: HTTP Server (Docker/Python)
    // If user provided a URL starting with http, use Server mode.
    if (config.piperUrl && config.piperUrl.trim().startsWith('http')) {
        const url = new URL(config.piperUrl);
        url.searchParams.append('text', text);
        url.searchParams.append('output_file', 'false'); // Stream
        
        if (!url.searchParams.has('voice')) {
          url.searchParams.append('voice', config.piperVoice || 'pl_PL-gosia-medium'); 
        }

        try {
          const response = await fetch(url.toString());
          if (!response.ok) throw new Error(`Piper Server Error: ${response.statusText}`);
          return await response.blob();
        } catch (e) {
          console.error("Piper Server Fetch Failed", e);
          throw e;
        }
    } 
    
    // MODE B: Client-Side WASM (Default)
    // Uses @mintplex-labs/piper-tts-web via ESM CDN
    else {
        try {
            console.log("Starting Piper WASM generation...");
            // Initialize module if not already loaded
            if (!piperModule) {
                console.log("Initializing Piper TTS Web Module from CDN...");
                // Using jsdelivr as it handles ESM + WASM paths slightly better for this package
                // @ts-ignore
                piperModule = await import('https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.0/+esm');
                console.log("Piper Module loaded successfully:", piperModule);
            }
            
            // Voice ID examples: 'pl_PL-gosia-medium', 'en_US-hfc_female-medium'
            const voiceId = config.piperVoice || 'pl_PL-gosia-medium';
            
            console.log(`Generating Piper TTS (Client-Side) for voice: ${voiceId}, text snippet: ${text.substring(0, 20)}...`);
            
            // Generate audio
            const wavBlob = await piperModule.predict({
                text: text,
                voiceId: voiceId,
            });

            console.log("Piper generation successful, blob size:", wavBlob.size);
            return wavBlob;
        } catch (e: any) {
            console.error("Piper WASM Error details:", e);
            
            let msg = e.message;
            if (e.message.includes("fetch")) {
                msg = "Failed to download voice model. Check internet connection.";
            } else if (e.message.includes("OPFS")) {
                msg = "Browser storage error (OPFS). Try using Chrome/Edge/Firefox.";
            }

            throw new Error(`Piper Client-Side Error: ${msg}`);
        }
    }
  }
}

// 2. Kokoro TTS (English) - API wrapper
class KokoroTTS implements ITTSGenerator {
  async generate(text: string, lang: SupportedLanguage, config: TtsConfig): Promise<Blob> {
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json' 
    };

    if (config.kokoroApiKey) {
      headers['Authorization'] = `Bearer ${config.kokoroApiKey}`;
    }

    try {
      const response = await fetch(config.kokoroUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'kokoro',
          input: text,
          voice: config.kokoroVoice || 'af_bella', 
          response_format: 'mp3',
          speed: config.rate
        })
      });

      if (!response.ok) throw new Error(`Kokoro Error: ${response.statusText}`);
      return await response.blob();
    } catch (e) {
      console.error("Kokoro Fetch Failed", e);
      throw e;
    }
  }
}

// Factory
export const getTTSGenerator = (lang: SupportedLanguage, config: TtsConfig): ITTSGenerator => {
  // Native fallback removed entirely.
  // Prioritize Piper for PL, Kokoro for EN (or Piper if configured for EN too, but simpler logic here)
  
  if (lang === SupportedLanguage.PL) {
    return new PiperTTS();
  } else {
    // Attempt Kokoro for English
    // If user wants Piper for English, they can change the logic later, but keeping it split for now
    return new KokoroTTS();
  }
};