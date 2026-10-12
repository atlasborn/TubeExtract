import React from 'react';
import { X, Sliders, Music, Video, Save } from 'lucide-react';
import { UserPreferences, MediaFormat, Mp3Bitrate, Mp4Quality } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (newPrefs: UserPreferences) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSave,
}) => {
  const [formState, setFormState] = React.useState<UserPreferences>(preferences);

  React.useEffect(() => {
    setFormState(preferences);
  }, [preferences, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formState);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-neutral-100">Preferências de Download</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Default Format */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              Formato Padrão Preferido
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormState({ ...formState, defaultFormat: 'mp3' })}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
                  formState.defaultFormat === 'mp3'
                    ? 'bg-neutral-800 border-red-500/80 text-white shadow-sm'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
                }`}
              >
                <Music className="w-4 h-4 text-red-400" />
                <span>Áudio (MP3)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormState({ ...formState, defaultFormat: 'mp4' })}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
                  formState.defaultFormat === 'mp4'
                    ? 'bg-neutral-800 border-blue-500/80 text-white shadow-sm'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
                }`}
              >
                <Video className="w-4 h-4 text-blue-400" />
                <span>Vídeo (MP4)</span>
              </button>
            </div>
          </div>

          {/* Default MP3 Bitrate */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              Qualidade MP3 Padrão (Taxa de Bits)
            </label>
            <select
              value={formState.defaultMp3Bitrate}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  defaultMp3Bitrate: e.target.value as Mp3Bitrate,
                })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-red-500 font-mono"
            >
              <option value="320kbps">320 kbps - Qualidade Máxima (Recomendado)</option>
              <option value="256kbps">256 kbps - Alta Fidelidade</option>
              <option value="192kbps">192 kbps - Padrão Equilibrado</option>
              <option value="128kbps">128 kbps - Arquivo Leve</option>
            </select>
          </div>

          {/* Default MP4 Quality */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              Resolução de Vídeo MP4 Padrão
            </label>
            <select
              value={formState.defaultMp4Quality}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  defaultMp4Quality: e.target.value as Mp4Quality,
                })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="1080p">1080p - Full HD</option>
              <option value="720p">720p - HD Padrão</option>
              <option value="480p">480p - SD</option>
              <option value="360p">360p - Baixo Consumo de Dados</option>
            </select>
          </div>

          {/* File naming pattern */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              Padrão de Nome do Arquivo Salvo
            </label>
            <select
              value={formState.fileNamePattern}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  fileNamePattern: e.target.value as any,
                })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700 font-mono"
            >
              <option value="title_artist">Título - Canal.mp3</option>
              <option value="artist_title">Canal - Título.mp3</option>
              <option value="index_title">01 - Título.mp3 (Para Playlists)</option>
            </select>
          </div>

          {/* Concurrency limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300">
                Downloads Simultâneos
              </label>
              <span className="text-xs font-mono text-red-400 tabular-nums">
                {formState.concurrencyLimit} arquivos por vez
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="4"
              value={formState.concurrencyLimit}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  concurrencyLimit: Number(e.target.value),
                })
              }
              className="w-full accent-red-600 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-md shadow-red-950"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Preferências</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
