import { SupportedLanguage } from '../types';
import { APP_CONFIG } from '../constants';

export const detectLanguage = (text: string): SupportedLanguage => {
  const sample = text.slice(0, 1000).toLowerCase();
  
  // Polish specific characters
  const plChars = /[ąęćłńóśźż]/g;
  const matches = sample.match(plChars);
  const count = matches ? matches.length : 0;
  
  // Calculate density
  const density = count / sample.length;

  return density > APP_CONFIG.PL_CHAR_THRESHOLD ? SupportedLanguage.PL : SupportedLanguage.EN;
};

export const chunkText = (text: string, maxLength: number = APP_CONFIG.MAX_CHUNK_LENGTH): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());

  // Split very long chunks strictly if they survived sentence splitting
  const finalChunks: string[] = [];
  for(const c of chunks) {
    if(c.length > maxLength) {
        // Simple slice, ideally would find nearest space
        let i = 0;
        while(i < c.length) {
            finalChunks.push(c.slice(i, i + maxLength));
            i += maxLength;
        }
    } else {
        finalChunks.push(c);
    }
  }

  return finalChunks;
};

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};