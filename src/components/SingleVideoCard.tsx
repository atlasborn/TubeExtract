import React, { useState } from 'react';
import { Download, Music, Video, Play, Plus, Clock, HardDrive } from 'lucide-react';
import { VideoItem, MediaFormat, Mp3Bitrate, Mp4Quality } from '../types';
import { calculateEstimatedSize, DEFAULT_PLACEHOLDER_THUMBNAIL } from '../utils/mediaGenerator';

interface SingleVideoCardProps {
  video: VideoItem;
  onDownload: (video: VideoItem) => void;
  onAddToQueue: (video: VideoItem) => void;
  onPreview: (video: VideoItem) => void;
}

export const SingleVideoCard: React.FC<SingleVideoCardProps> = ({
  video,
  onDownload,
  onAddToQueue,
  onPreview,
}) => {
  const [format, setFormat] = useState<MediaFormat>(video.format || 'mp3');
  const [mp3Bitrate, setMp3Bitrate] = useState<Mp3Bitrate>(video.mp3Bitrate || '320kbps');
  const [mp4Quality, setMp4Quality] = useState<Mp4Quality>(video.mp4Quality || '1080p');

  const estimatedSize = calculateEstimatedSize(
    video.duration,
    format,
    format === 'mp3' ? mp3Bitrate : mp4Quality
  );

  const activeVideoConfig: VideoItem = {
    ...video,
    format,
    mp3Bitrate,
    mp4Quality,
    estimatedSizeMb: estimatedSize,
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Thumbnail with preview trigger */}
        <div className="relative w-full md:w-80 aspect-video rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800 group">
          <img
            src={video.thumbnail}
            alt={video.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_PLACEHOLDER_THUMBNAIL;
            }}
          />

          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/85 text-xs font-mono text-neutral-200 rounded tabular-nums">
            {video.durationFormatted}
          </span>

          <button
            onClick={() => onPreview(activeVideoConfig)}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
            title="Pré-visualizar vídeo"
          >
            <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center text-white shadow-lg">
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </div>
          </button>
        </div>

        {/* Video details & format selector */}
        <div className="flex-1 space-y-4">
          <div>
            <span className="text-xs text-red-400 font-medium">Vídeo do YouTube</span>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-100 mt-1 leading-snug">
              {video.title}
            </h2>

            {/* Zero-Pill Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-2">
              <span className="text-neutral-300 font-medium">{video.channel}</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="font-mono tabular-nums">{video.viewsFormatted} visualizações</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>{video.uploadDate}</span>
            </div>
          </div>

          {/* Format selection */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-400">Escolha o formato:</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('mp3')}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all text-left ${
                  format === 'mp3'
                    ? 'bg-neutral-800 border-red-500/80 shadow-md ring-1 ring-red-500/30'
                    : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-900 text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Music className={`w-4 h-4 ${format === 'mp3' ? 'text-red-400' : 'text-neutral-500'}`} />
                  <span className="text-sm font-semibold text-neutral-100">Áudio MP3</span>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Ideal para músicas, podcasts e reprodutores de áudio
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('mp4')}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all text-left ${
                  format === 'mp4'
                    ? 'bg-neutral-800 border-blue-500/80 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-900 text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Video className={`w-4 h-4 ${format === 'mp4' ? 'text-blue-400' : 'text-neutral-500'}`} />
                  <span className="text-sm font-semibold text-neutral-100">Vídeo MP4</span>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Vídeo completo com imagem em alta definição
                </span>
              </button>
            </div>

            {/* Quality / Bitrate selection pills */}
            <div className="pt-1">
              <span className="text-xs text-neutral-400 font-medium block mb-2">
                {format === 'mp3' ? 'Qualidade de Áudio (Taxa de bits):' : 'Resolução de Vídeo:'}
              </span>

              {format === 'mp3' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['320kbps', '256kbps', '192kbps', '128kbps'] as Mp3Bitrate[]).map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setMp3Bitrate(rate)}
                      className={`px-3 py-2 rounded-lg text-xs font-mono transition-all text-center border ${
                        mp3Bitrate === rate
                          ? 'bg-red-500/15 border-red-500 text-red-300 font-semibold'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <span>{rate}</span>
                      <span className="block text-[10px] text-neutral-500 mt-0.5">
                        {rate === '320kbps' ? 'Qualidade Máxima' : rate === '256kbps' ? 'Alta' : rate === '192kbps' ? 'Padrão' : 'Leve'}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['1080p', '720p', '480p', '360p'] as Mp4Quality[]).map((qual) => (
                    <button
                      key={qual}
                      type="button"
                      onClick={() => setMp4Quality(qual)}
                      className={`px-3 py-2 rounded-lg text-xs font-mono transition-all text-center border ${
                        mp4Quality === qual
                          ? 'bg-blue-500/15 border-blue-500 text-blue-300 font-semibold'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <span>{qual}</span>
                      <span className="block text-[10px] text-neutral-500 mt-0.5">
                        {qual === '1080p' ? 'Full HD' : qual === '720p' ? 'HD' : qual === '480p' ? 'SD' : 'Econômico'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Estimated file weight */}
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 font-mono">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
                Tamanho Estimado:
              </span>
              <span className="text-neutral-200 font-semibold tabular-nums">
                ~{estimatedSize.toFixed(1)} MB
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => onDownload(activeVideoConfig)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-md shadow-red-950"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Agora ({format.toUpperCase()})</span>
              </button>

              <button
                type="button"
                onClick={() => onAddToQueue(activeVideoConfig)}
                className="flex items-center gap-2 py-3 px-4 text-sm font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-colors"
                title="Adicionar à fila de downloads"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar à Fila</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
