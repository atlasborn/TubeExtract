import React, { useState } from 'react';
import { Search, Link as LinkIcon, Clipboard, X, Video, ListFilter } from 'lucide-react';
import { parseYouTubeUrl } from '../utils/youtube';

interface UrlInputBarProps {
  onAnalyzeUrl: (url: string) => void;
  isLoading: boolean;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  onAnalyzeUrl,
  isLoading,
}) => {
  const [url, setUrl] = useState('');

  const detected = url.trim() ? parseYouTubeUrl(url) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onAnalyzeUrl(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        onAnalyzeUrl(text.trim());
      }
    } catch {
      // Fallback if permission not granted
    }
  };

  const handleClear = () => {
    setUrl('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {/* Primary Input Container */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 rounded-xl p-1.5 focus-within:border-red-500/80 focus-within:ring-2 focus-within:ring-red-500/20 shadow-xl transition-all">
          <div className="pl-3 text-neutral-500 flex items-center pointer-events-none">
            <LinkIcon className="w-5 h-5 text-neutral-400" />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Cole o link do YouTube aqui (ex: https://www.youtube.com/playlist?list=... ou vídeo)..."
            className="flex-1 bg-transparent px-2 py-2.5 text-sm sm:text-base text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
          />

          {url && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-neutral-500 hover:text-neutral-300 rounded-md transition-colors"
              title="Limpar campo"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handlePaste}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-800/80 hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
            title="Colar link da área de transferência"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Colar</span>
          </button>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 rounded-lg transition-all shadow-md shadow-red-950 shrink-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Analisando...' : 'Analisar'}</span>
          </button>
        </div>

        {/* Input detected hints */}
        {detected && (
          <div className="absolute -bottom-6 left-2 flex items-center gap-2 text-xs text-neutral-400">
            {detected.isPlaylist ? (
              <span className="flex items-center gap-1 text-red-400 font-medium">
                <ListFilter className="w-3 h-3" />
                Playlist do YouTube identificada
              </span>
            ) : detected.videoId ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Video className="w-3 h-3" />
                Vídeo individual identificado
              </span>
            ) : null}
          </div>
        )}
      </form>
    </div>
  );
};
