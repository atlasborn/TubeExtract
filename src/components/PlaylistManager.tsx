import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Square, 
  MinusSquare, 
  Download, 
  FileArchive, 
  Music, 
  Video, 
  Play, 
  Search, 
  SlidersHorizontal,
  Clock,
  HardDrive,
  Eye,
  Check
} from 'lucide-react';
import { PlaylistInfo, VideoItem, MediaFormat, Mp3Bitrate, Mp4Quality } from '../types';
import { calculateEstimatedSize, DEFAULT_PLACEHOLDER_THUMBNAIL } from '../utils/mediaGenerator';

interface PlaylistManagerProps {
  playlist: PlaylistInfo;
  onUpdateVideos: (updatedVideos: VideoItem[]) => void;
  onStartBatchDownload: (selectedVideos: VideoItem[], asZip: boolean) => void;
  onDownloadSingle: (video: VideoItem) => void;
  onPreviewMedia: (video: VideoItem) => void;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlist,
  onUpdateVideos,
  onStartBatchDownload,
  onDownloadSingle,
  onPreviewMedia,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [globalFormat, setGlobalFormat] = useState<MediaFormat>('mp3');
  const [globalMp3Bitrate, setGlobalMp3Bitrate] = useState<Mp3Bitrate>('320kbps');
  const [globalMp4Quality, setGlobalMp4Quality] = useState<Mp4Quality>('1080p');

  // Filtered videos based on search
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return playlist.videos;
    const q = searchQuery.toLowerCase();
    return playlist.videos.filter(
      (v) => v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q)
    );
  }, [playlist.videos, searchQuery]);

  // Selected videos statistics
  const selectedVideos = useMemo(
    () => playlist.videos.filter((v) => v.selected),
    [playlist.videos]
  );

  const totalSelectedDurationSeconds = useMemo(
    () => selectedVideos.reduce((acc, v) => acc + v.duration, 0),
    [selectedVideos]
  );

  const totalEstimatedSizeMb = useMemo(
    () => selectedVideos.reduce((acc, v) => acc + v.estimatedSizeMb, 0),
    [selectedVideos]
  );

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min ${seconds}s`;
  };

  // Master checkbox states
  const allSelected = playlist.videos.length > 0 && selectedVideos.length === playlist.videos.length;
  const someSelected = selectedVideos.length > 0 && selectedVideos.length < playlist.videos.length;

  const handleToggleAll = () => {
    const nextState = !allSelected;
    const updated = playlist.videos.map((v) => ({ ...v, selected: nextState }));
    onUpdateVideos(updated);
  };

  const handleSelectAll = () => {
    const updated = playlist.videos.map((v) => ({ ...v, selected: true }));
    onUpdateVideos(updated);
  };

  const handleDeselectAll = () => {
    const updated = playlist.videos.map((v) => ({ ...v, selected: false }));
    onUpdateVideos(updated);
  };

  const handleInvertSelection = () => {
    const updated = playlist.videos.map((v) => ({ ...v, selected: !v.selected }));
    onUpdateVideos(updated);
  };

  const handleToggleSingle = (id: string) => {
    const updated = playlist.videos.map((v) =>
      v.id === id ? { ...v, selected: !v.selected } : v
    );
    onUpdateVideos(updated);
  };

  // Apply batch format to all videos
  const handleApplyGlobalFormat = (format: MediaFormat) => {
    setGlobalFormat(format);
    const updated = playlist.videos.map((v) => {
      const estimated = calculateEstimatedSize(
        v.duration,
        format,
        format === 'mp3' ? globalMp3Bitrate : globalMp4Quality
      );
      return {
        ...v,
        format,
        mp3Bitrate: globalMp3Bitrate,
        mp4Quality: globalMp4Quality,
        estimatedSizeMb: estimated,
      };
    });
    onUpdateVideos(updated);
  };

  const handleApplyGlobalBitrate = (bitrate: Mp3Bitrate) => {
    setGlobalMp3Bitrate(bitrate);
    const updated = playlist.videos.map((v) => {
      if (v.format === 'mp3') {
        return {
          ...v,
          mp3Bitrate: bitrate,
          estimatedSizeMb: calculateEstimatedSize(v.duration, 'mp3', bitrate),
        };
      }
      return v;
    });
    onUpdateVideos(updated);
  };

  const handleApplyGlobalQuality = (quality: Mp4Quality) => {
    setGlobalMp4Quality(quality);
    const updated = playlist.videos.map((v) => {
      if (v.format === 'mp4') {
        return {
          ...v,
          mp4Quality: quality,
          estimatedSizeMb: calculateEstimatedSize(v.duration, 'mp4', quality),
        };
      }
      return v;
    });
    onUpdateVideos(updated);
  };

  // Change individual video format
  const handleChangeVideoFormat = (id: string, format: MediaFormat) => {
    const updated = playlist.videos.map((v) => {
      if (v.id === id) {
        const estimated = calculateEstimatedSize(
          v.duration,
          format,
          format === 'mp3' ? v.mp3Bitrate : v.mp4Quality
        );
        return { ...v, format, estimatedSizeMb: estimated };
      }
      return v;
    });
    onUpdateVideos(updated);
  };

  const handleChangeVideoQualityOrBitrate = (
    id: string,
    val: Mp3Bitrate | Mp4Quality,
    format: MediaFormat
  ) => {
    const updated = playlist.videos.map((v) => {
      if (v.id === id) {
        if (format === 'mp3') {
          const bitrate = val as Mp3Bitrate;
          return {
            ...v,
            mp3Bitrate: bitrate,
            estimatedSizeMb: calculateEstimatedSize(v.duration, 'mp3', bitrate),
          };
        } else {
          const quality = val as Mp4Quality;
          return {
            ...v,
            mp4Quality: quality,
            estimatedSizeMb: calculateEstimatedSize(v.duration, 'mp4', quality),
          };
        }
      }
      return v;
    });
    onUpdateVideos(updated);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Playlist Top Summary Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          {/* Playlist Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800">
              <img
                src={playlist.thumbnail}
                alt={playlist.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_PLACEHOLDER_THUMBNAIL;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                <span className="text-[11px] font-mono text-neutral-200 tabular-nums">
                  {playlist.videos.length} faixas
                </span>
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 text-xs text-red-400 font-medium">
                <span>Playlist do YouTube</span>
                <span className="text-neutral-600">·</span>
                <span>ID: {playlist.id.substring(0, 16)}</span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-neutral-100 truncate">
                {playlist.title}
              </h2>

              {/* Zero-Pill Metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                <span className="text-neutral-300 font-medium">{playlist.channel}</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span>{playlist.videos.length} vídeos no total</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-emerald-400 font-medium">
                  {selectedVideos.length} selecionados para download
                </span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="font-mono tabular-nums">
                  Aprox. {totalEstimatedSizeMb.toFixed(1)} MB
                </span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="font-mono tabular-nums">
                  {formatDuration(totalSelectedDurationSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Master Batch Download Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => onStartBatchDownload(selectedVideos, true)}
              disabled={selectedVideos.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-neutral-200 bg-neutral-800/90 hover:bg-neutral-800 border border-neutral-700 disabled:opacity-40 rounded-xl transition-all shadow-sm"
              title="Baixar todos os selecionados reunidos em um único arquivo .ZIP com organizador"
            >
              <FileArchive className="w-4 h-4 text-amber-400" />
              <span>Baixar ZIP ({selectedVideos.length})</span>
            </button>

            <button
              onClick={() => onStartBatchDownload(selectedVideos, false)}
              disabled={selectedVideos.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded-xl transition-all shadow-md shadow-red-950"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Selecionados ({selectedVideos.length})</span>
            </button>
          </div>
        </div>

        {/* Global Format Bar for entire playlist */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Formato global da playlist:
            </span>

            {/* MP3 / MP4 segmented switch */}
            <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg">
              <button
                onClick={() => handleApplyGlobalFormat('mp3')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  globalFormat === 'mp3'
                    ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Music className="w-3.5 h-3.5 text-red-400" />
                <span>Áudio (MP3)</span>
              </button>
              <button
                onClick={() => handleApplyGlobalFormat('mp4')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  globalFormat === 'mp4'
                    ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-blue-400" />
                <span>Vídeo (MP4)</span>
              </button>
            </div>

            {/* Bitrate or Quality global picker */}
            {globalFormat === 'mp3' ? (
              <div className="flex items-center gap-1 text-xs text-neutral-400">
                <span className="text-neutral-500">Taxa:</span>
                {(['320kbps', '256kbps', '192kbps', '128kbps'] as Mp3Bitrate[]).map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleApplyGlobalBitrate(rate)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${
                      globalMp3Bitrate === rate
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-medium'
                        : 'text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800'
                    }`}
                  >
                    {rate}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-neutral-400">
                <span className="text-neutral-500">Resolução:</span>
                {(['1080p', '720p', '480p', '360p'] as Mp4Quality[]).map((qual) => (
                  <button
                    key={qual}
                    onClick={() => handleApplyGlobalQuality(qual)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${
                      globalMp4Quality === qual
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-medium'
                        : 'text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800'
                    }`}
                  >
                    {qual}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-neutral-500">
            Você também pode personalizar cada faixa individualmente abaixo
          </div>
        </div>
      </div>

      {/* Playlist Track Selection & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3">
        {/* Selection buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToggleAll}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700/80 rounded-lg transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : someSelected ? (
              <MinusSquare className="w-4 h-4 text-amber-400" />
            ) : (
              <Square className="w-4 h-4 text-neutral-400" />
            )}
            <span>
              {allSelected
                ? 'Todos Selecionados'
                : someSelected
                ? `${selectedVideos.length} Selecionados`
                : 'Selecionar Todos'}
            </span>
          </button>

          <button
            onClick={handleSelectAll}
            className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 rounded-md transition-colors"
          >
            Marcar Todos
          </button>
          <span className="text-neutral-700">|</span>
          <button
            onClick={handleDeselectAll}
            className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 rounded-md transition-colors"
          >
            Desmarcar Todos
          </button>
          <span className="text-neutral-700">|</span>
          <button
            onClick={handleInvertSelection}
            className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 rounded-md transition-colors"
          >
            Inverter
          </button>
        </div>

        {/* Search within playlist */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar vídeos nesta playlist..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700"
          />
        </div>
      </div>

      {/* Videos List / Table */}
      <div className="space-y-2">
        {filteredVideos.map((video, index) => {
          const isSelected = video.selected;

          return (
            <div
              key={video.id}
              className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-neutral-900/90 border-neutral-700/80 shadow-md'
                  : 'bg-neutral-950/60 border-neutral-900 opacity-70 hover:opacity-100 hover:bg-neutral-900/40'
              }`}
            >
              {/* Left Zone: Checkbox + Index + Thumbnail + Title + Info */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleSingle(video.id)}
                  aria-label={isSelected ? `Desmarcar ${video.title}` : `Marcar ${video.title}`}
                  className="p-1 text-neutral-400 hover:text-neutral-100 transition-colors shrink-0 cursor-pointer"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-red-500" />
                  ) : (
                    <Square className="w-5 h-5 text-neutral-600 hover:text-neutral-400" />
                  )}
                </button>

                {/* Index */}
                <span className="text-xs font-mono text-neutral-500 w-6 text-center tabular-nums shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Thumbnail with duration and preview button */}
                <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-neutral-800">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_PLACEHOLDER_THUMBNAIL;
                    }}
                  />
                  {/* Duration badge */}
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/85 text-[10px] font-mono text-neutral-300 rounded tabular-nums">
                    {video.durationFormatted}
                  </span>

                  {/* Hover play preview overlay */}
                  <button
                    onClick={() => onPreviewMedia(video)}
                    title="Ouvir / Pré-visualizar"
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                  >
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                </div>

                {/* Title & Metadata */}
                <div className="min-w-0 flex-1 space-y-1">
                  <h3
                    onClick={() => handleToggleSingle(video.id)}
                    className="text-sm font-semibold text-neutral-200 hover:text-white truncate cursor-pointer"
                  >
                    {video.title}
                  </h3>

                  {/* Zero-Pill Unboxed Metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    <span className="text-neutral-300">{video.channel}</span>
                    <span aria-hidden="true" className="text-neutral-600">·</span>
                    <span className="font-mono tabular-nums">{video.viewsFormatted} visualizações</span>
                    <span aria-hidden="true" className="text-neutral-600">·</span>
                    <span className="text-neutral-500 font-mono tabular-nums">
                      {video.estimatedSizeMb.toFixed(1)} MB estimado
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Zone: Format selector & Individual Download CTA */}
              <div className="flex items-center gap-3 shrink-0 pl-10 sm:pl-0">
                {/* Format switcher (MP3 vs MP4) */}
                <div className="flex items-center gap-1 p-0.5 bg-neutral-950 border border-neutral-800 rounded-lg">
                  <button
                    onClick={() => handleChangeVideoFormat(video.id, 'mp3')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                      video.format === 'mp3'
                        ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    MP3
                  </button>
                  <button
                    onClick={() => handleChangeVideoFormat(video.id, 'mp4')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                      video.format === 'mp4'
                        ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    MP4
                  </button>
                </div>

                {/* Quality / Bitrate selector dropdown */}
                {video.format === 'mp3' ? (
                  <select
                    value={video.mp3Bitrate}
                    onChange={(e) =>
                      handleChangeVideoQualityOrBitrate(
                        video.id,
                        e.target.value as Mp3Bitrate,
                        'mp3'
                      )
                    }
                    className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-neutral-700 font-mono"
                  >
                    <option value="320kbps">320 kbps (Alta)</option>
                    <option value="256kbps">256 kbps</option>
                    <option value="192kbps">192 kbps</option>
                    <option value="128kbps">128 kbps</option>
                  </select>
                ) : (
                  <select
                    value={video.mp4Quality}
                    onChange={(e) =>
                      handleChangeVideoQualityOrBitrate(
                        video.id,
                        e.target.value as Mp4Quality,
                        'mp4'
                      )
                    }
                    className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-neutral-700 font-mono"
                  >
                    <option value="1080p">1080p (FHD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="480p">480p (SD)</option>
                    <option value="360p">360p</option>
                  </select>
                )}

                {/* Preview button */}
                <button
                  onClick={() => onPreviewMedia(video)}
                  title="Pré-visualizar vídeo ou áudio"
                  className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Single Download button */}
                <button
                  onClick={() => onDownloadSingle(video)}
                  title={`Baixar ${video.title} agora em ${video.format.toUpperCase()}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-red-600 rounded-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Baixar</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredVideos.length === 0 && (
          <div className="text-center py-12 border border-neutral-800/60 rounded-xl bg-neutral-950/40 text-neutral-400">
            <p className="text-sm">Nenhum vídeo encontrado para o filtro "{searchQuery}".</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs text-red-400 hover:underline"
            >
              Limpar busca
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar when items selected */}
      {selectedVideos.length > 0 && (
        <div className="sticky bottom-4 z-30 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-100">
                {selectedVideos.length} de {playlist.videos.length} vídeos selecionados
              </p>
              <p className="text-xs text-neutral-400 font-mono tabular-nums">
                Tamanho estimado: {totalEstimatedSizeMb.toFixed(1)} MB · Duração: {formatDuration(totalSelectedDurationSeconds)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onStartBatchDownload(selectedVideos, true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-colors"
            >
              <FileArchive className="w-3.5 h-3.5 text-amber-400" />
              <span>Exportar em ZIP</span>
            </button>

            <button
              onClick={() => onStartBatchDownload(selectedVideos, false)}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-md shadow-red-950"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Iniciar Downloads</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
