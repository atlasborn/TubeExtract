import React, { useState, useMemo } from 'react';
import { DownloadHistoryItem, MediaFormat } from '../types';
import { History, Trash2, Download, Search, Music, Video, HardDrive } from 'lucide-react';
import { createRealAudioBlob, createRealVideoBlob, downloadFile, DEFAULT_PLACEHOLDER_THUMBNAIL } from '../utils/mediaGenerator';

interface DownloadHistoryViewProps {
  history: DownloadHistoryItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
}

export const DownloadHistoryView: React.FC<DownloadHistoryViewProps> = ({
  history,
  onClearHistory,
  onRemoveItem,
}) => {
  const [formatFilter, setFormatFilter] = useState<'all' | 'mp3' | 'mp4'>('all');
  const [search, setSearch] = useState('');
  const [reDownloadingId, setReDownloadingId] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesFormat = formatFilter === 'all' || item.format === formatFilter;
      const matchesSearch =
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.channel.toLowerCase().includes(search.toLowerCase());
      return matchesFormat && matchesSearch;
    });
  }, [history, formatFilter, search]);

  const totalSizeMb = useMemo(() => {
    return history.reduce((acc, item) => acc + item.sizeMb, 0);
  }, [history]);

  const mp3Count = useMemo(() => history.filter((i) => i.format === 'mp3').length, [history]);
  const mp4Count = useMemo(() => history.filter((i) => i.format === 'mp4').length, [history]);

  const handleReDownload = async (item: DownloadHistoryItem) => {
    setReDownloadingId(item.id);
    try {
      const blob =
        item.format === 'mp3'
          ? await createRealAudioBlob(item.title, item.channel, 210)
          : await createRealVideoBlob(item.title, item.channel, 210);

      downloadFile(blob, item.fileName);
    } catch (e) {
      console.error(e);
    } finally {
      setReDownloadingId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Overview Stat Strip */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <History className="w-5 h-5 text-red-500" />
            <span>Biblioteca de Downloads Salvos</span>
          </h2>
          {/* Zero-Pill Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1">
            <span className="font-mono tabular-nums">{history.length} arquivos baixados</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="font-mono tabular-nums">{mp3Count} áudios MP3</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="font-mono tabular-nums">{mp4Count} vídeos MP4</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="font-mono tabular-nums">Total: ~{totalSizeMb.toFixed(1)} MB</span>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-400 hover:text-red-400 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-xl transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Histórico</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3">
        {/* Interactive segmented filter control */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg">
          <button
            onClick={() => setFormatFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              formatFilter === 'all'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Todos ({history.length})
          </button>
          <button
            onClick={() => setFormatFilter('mp3')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              formatFilter === 'mp3'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Music className="w-3 h-3 text-red-400" />
            <span>MP3 ({mp3Count})</span>
          </button>
          <button
            onClick={() => setFormatFilter('mp4')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              formatFilter === 'mp4'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Video className="w-3 h-3 text-blue-400" />
            <span>MP4 ({mp4Count})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar histórico..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700"
          />
        </div>
      </div>

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/40 border border-neutral-850 rounded-2xl p-6">
          <p className="text-sm text-neutral-400">
            {history.length === 0
              ? 'Nenhum download concluído ainda. Baixe seus vídeos e playlists favoritos!'
              : 'Nenhum resultado corresponde aos filtros aplicados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-14 h-11 rounded-lg overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800 relative">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_PLACEHOLDER_THUMBNAIL;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    {item.format === 'mp3' ? (
                      <Music className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Video className="w-3.5 h-3.5 text-blue-400" />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-neutral-200 truncate">
                    {item.title}
                  </h4>
                  {/* Zero-Pill Metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-0.5">
                    <span className="text-neutral-300">{item.channel}</span>
                    <span aria-hidden="true" className="text-neutral-600">·</span>
                    <span className="font-mono text-neutral-300 font-medium uppercase">
                      {item.format} ({item.quality})
                    </span>
                    <span aria-hidden="true" className="text-neutral-600">·</span>
                    <span className="font-mono tabular-nums">~{item.sizeMb.toFixed(1)} MB</span>
                    <span aria-hidden="true" className="text-neutral-600">·</span>
                    <span className="font-mono text-neutral-500 tabular-nums">
                      {formatDate(item.downloadedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleReDownload(item)}
                  disabled={reDownloadingId === item.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                  title="Baixar este arquivo novamente"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{reDownloadingId === item.id ? 'Gerando...' : 'Baixar Novamente'}</span>
                </button>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg transition-colors"
                  title="Remover do histórico"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
