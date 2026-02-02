import React from 'react';
import { TtsConfig } from '../types';

interface Props {
  config: TtsConfig;
  onSave: (c: TtsConfig) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = React.useState(config);

  const handleChange = (field: keyof TtsConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-slate-800">TTS Settings</h2>
        
        <div className="space-y-6">
          {/* Engine Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Select TTS Engine
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['native', 'piper', 'kokoro'] as const).map((eng) => (
                <button
                  key={eng}
                  onClick={() => handleChange('engine', eng)}
                  className={`px-3 py-2 rounded border text-sm font-medium capitalize transition-colors ${
                    localConfig.engine === eng 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-primary'
                  }`}
                >
                  {eng}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              <b>Native:</b> Fast, works everywhere. <b>Piper/Kokoro:</b> High-quality AI.
            </p>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-red-500 rounded-sm"></span>
                Piper TTS (Polish)
            </h3>
            <div className="bg-orange-50 p-2 rounded text-xs text-orange-800 mb-2">
                <strong>Client-Side Mode:</strong> Leave URL empty. First run downloads the model (~40MB).
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                API Endpoint URL (Optional)
                </label>
                <input 
                type="text" 
                value={localConfig.piperUrl}
                onChange={(e) => handleChange('piperUrl', e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Leave empty for In-Browser WASM"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Voice ID
                </label>
                <input 
                type="text" 
                value={localConfig.piperVoice}
                onChange={(e) => handleChange('piperVoice', e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="pl_PL-gosia-medium"
                />
                <p className="text-xs text-slate-400 mt-1">e.g., pl_PL-gosia-medium, pl_PL-mc_speech-medium</p>
            </div>
          </div>

          {/* Kokoro Settings */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
                Kokoro TTS (English)
            </h3>
            <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 mb-2">
                Requires a local or hosted Kokoro API server.
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                API Endpoint URL
                </label>
                <input 
                type="text" 
                value={localConfig.kokoroUrl}
                onChange={(e) => handleChange('kokoroUrl', e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="http://localhost:8880/v1/audio/speech"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                API Key (Optional)
                </label>
                <input 
                type="password" 
                value={localConfig.kokoroApiKey || ''}
                onChange={(e) => handleChange('kokoroApiKey', e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="sk-..."
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Voice ID
                </label>
                <input 
                type="text" 
                value={localConfig.kokoroVoice}
                onChange={(e) => handleChange('kokoroVoice', e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="af_bella"
                />
                <p className="text-xs text-slate-400 mt-1">e.g., af_bella, af_nicole, am_michael</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">
            Cancel
          </button>
          <button 
            onClick={() => { onSave(localConfig); onClose(); }}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 font-medium"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};