import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SupportedLanguage, FileData, TtsConfig, AudioState } from './types';
import { detectLanguage, chunkText, formatTime } from './services/textUtils';
import { readFileContent } from './services/pdfService';
import { getTTSGenerator } from './services/ttsService';
import { APP_CONFIG } from './constants';
import { SettingsModal } from './components/SettingsModal';

const Icons = {
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
  ),
  Play: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
  ),
  Pause: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
  ),
  Stop: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12"/></svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  ),
  FileText: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  ),
};

function App() {
  // State
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [text, setText] = useState<string>('');
  const [language, setLanguage] = useState<SupportedLanguage>(SupportedLanguage.EN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Removed useNativeFallback from state
  const [ttsConfig, setTtsConfig] = useState<TtsConfig>({
    piperUrl: APP_CONFIG.DEFAULT_PIPER_URL,
    piperVoice: APP_CONFIG.DEFAULT_PIPER_VOICE,
    kokoroUrl: APP_CONFIG.DEFAULT_KOKORO_URL,
    kokoroVoice: APP_CONFIG.DEFAULT_KOKORO_VOICE,
    kokoroApiKey: '',
    volume: 1,
    rate: 1,
  });

  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isLoading: false,
    progress: 0,
    currentChunkIndex: 0,
    totalChunks: 0,
    audioBlob: null,
  });

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textChunks = useRef<string[]>([]);

  // Effects
  useEffect(() => {
    // Auto-detect language when text changes
    if (text) {
      const detected = detectLanguage(text);
      setLanguage(detected);
    }
  }, [text]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setAudioState(prev => ({ ...prev, isPlaying: false, audioBlob: null, progress: 0 }));
    if(audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
    }

    try {
      const content = await readFileContent(file);
      setFileData({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        content: content
      });
      setText(content);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAudio = async () => {
    if (!text) return;
    
    // Chunking
    const chunks = chunkText(text);
    textChunks.current = chunks;
    setAudioState(prev => ({ 
      ...prev, 
      isLoading: true, 
      totalChunks: chunks.length, 
      currentChunkIndex: 0 
    }));

    try {
      const generator = getTTSGenerator(language, ttsConfig);
      
      // Generate first chunk
      const firstChunk = chunks[0];
      console.log("Requesting generation for chunk 0:", firstChunk.substring(0, 30));
      const blob = await generator.generate(firstChunk, language, ttsConfig);
      console.log("Blob received:", blob);
      
      // If we get here, it's an API blob
      const url = URL.createObjectURL(blob);
      console.log("Created Object URL:", url);
      setAudioState(prev => ({ ...prev, isLoading: false, audioBlob: blob }));
      
      if (audioRef.current) {
        audioRef.current.src = url;
        console.log("Setting audioRef.src and calling play()");
        audioRef.current.play().catch(e => {
            console.error("Playback failed after generation:", e);
            setError(`Playback failed: ${e.message}. You might need to click Play again after the model is ready.`);
        });
        setAudioState(prev => ({ ...prev, isPlaying: true }));
      }

    } catch (err: any) {
      // Direct error display without fallback
      setError(`TTS Error: ${err.message}`);
      setAudioState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (audioState.isPlaying) {
        audioRef.current.pause();
        setAudioState(prev => ({ ...prev, isPlaying: false }));
      } else {
        if (!audioRef.current.src) {
            generateAudio();
        } else {
            audioRef.current.play();
            setAudioState(prev => ({ ...prev, isPlaying: true }));
        }
      }
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
  };

  const handleDownload = () => {
    if (audioState.audioBlob) {
      const url = URL.createObjectURL(audioState.audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audio-${language}-${Date.now()}.wav`; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert("Audio not generated yet.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-5xl mx-auto font-sans">
      <header className="w-full flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">PolyGlot <span className="text-primary">Reader</span></h1>
           <p className="text-slate-500 text-sm mt-1">High-Quality AI PDF & Text to Speech (Piper/Kokoro)</p>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 text-slate-500 hover:text-primary transition-colors"
          title="TTS Settings"
        >
          <Icons.Settings />
        </button>
      </header>

      {/* Main Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Upload & Info */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
               <Icons.Upload /> Upload File
            </h2>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-slate-500">PDF or TXT</p>
              </div>
              <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
            </label>
          </div>

          {fileData && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 animate-fade-in">
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-blue-100 text-blue-600 rounded">
                    <Icons.FileText />
                 </div>
                 <div className="overflow-hidden">
                    <p className="font-medium text-slate-800 truncate">{fileData.name}</p>
                    <p className="text-xs text-slate-500 uppercase">{fileData.type.split('/')[1] || 'TXT'} • {(fileData.size / 1024).toFixed(1)} KB</p>
                 </div>
               </div>
            </div>
          )}

          {/* Stats */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
             <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Language Detected</span>
                <span className={`font-bold ${language === SupportedLanguage.PL ? 'text-red-500' : 'text-blue-500'}`}>
                  {language}
                </span>
             </div>
             <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Character Count</span>
                <span className="font-mono text-slate-700">{text.length.toLocaleString()}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-slate-500">Est. Duration</span>
                <span className="font-mono text-slate-700">~{formatTime(text.length / 15)}</span>
             </div>
          </div>
        </div>

        {/* Right Col: Editor & Controls */}
        <div className="md:col-span-2 space-y-4 flex flex-col h-full">
           
           {/* Toolbar */}
           <div className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                 <button 
                   onClick={() => setLanguage(SupportedLanguage.PL)}
                   className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${language === SupportedLanguage.PL ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   PL
                 </button>
                 <button 
                   onClick={() => setLanguage(SupportedLanguage.EN)}
                   className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${language === SupportedLanguage.EN ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   EN
                 </button>
              </div>

              <div className="h-6 w-px bg-slate-200"></div>

              {/* Playback Controls */}
              <button 
                onClick={togglePlay} 
                disabled={!text}
                className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                 {audioState.isPlaying ? <Icons.Pause /> : <Icons.Play />}
                 <span className="font-medium">{audioState.isPlaying ? 'Pause' : 'Read Aloud'}</span>
              </button>

              <button onClick={handleStop} disabled={!audioState.isPlaying} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                 <Icons.Stop />
              </button>

              <div className="flex-1"></div>

              <button 
                onClick={handleDownload} 
                disabled={!audioState.audioBlob}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                title="Download Audio (Not available in Native Mode)"
              >
                <Icons.Download />
                <span className="hidden sm:inline">Download</span>
              </button>
           </div>

           {/* Error Display */}
           {error && (
             <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 shadow-sm animate-fade-in">
               <strong>Warning:</strong> {error}
             </div>
           )}

           {/* Loading State */}
           {audioState.isLoading && (
             <div className="bg-blue-50 text-blue-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
               <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
               <span>Generating Audio via <b>{language === 'PL' ? 'Piper WASM (Client-Side)' : 'Kokoro API'}</b>...</span>
             </div>
           )}

           {/* Text Area */}
           <div className="flex-grow relative">
             <textarea 
               value={text}
               onChange={(e) => setText(e.target.value)}
               placeholder="Upload a file or paste text here to begin..."
               className="w-full h-[60vh] p-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none font-sans text-lg leading-relaxed text-black bg-white shadow-inner"
             />
           </div>
        </div>
      </div>

      <audio ref={audioRef} onEnded={() => setAudioState(p => ({...p, isPlaying: false}))} className="hidden" />

      {showSettings && (
        <SettingsModal 
          config={ttsConfig} 
          onClose={() => setShowSettings(false)} 
          onSave={(newConfig) => setTtsConfig(newConfig)} 
        />
      )}
    </div>
  );
}

export default App;