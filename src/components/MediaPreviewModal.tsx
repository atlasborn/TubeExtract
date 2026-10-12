import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, Download, Music, Video, ExternalLink } from 'lucide-react';
import { VideoItem } from '../types';

interface MediaPreviewModalProps {
  video: VideoItem | null;
  onClose: () => void;
  onDownload: (video: VideoItem) => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  video,
  onClose,
  onDownload,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);

  useEffect(() => {
    if (!video) return;
    setIsPlaying(true);
    setCurrentTime(0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [video, onClose]);

  // Audio simulation timer
  useEffect(() => {
    if (!isPlaying || !video) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= video.duration) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, video]);

  if (!video) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            {video.format === 'mp3' ? (
              <Music className="w-4 h-4 text-red-500" />
            ) : (
              <Video className="w-4 h-4 text-blue-500" />
            )}
            <span className="text-sm font-semibold text-neutral-200">
              Pré-visualização: {video.format.toUpperCase()}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Preview Stage */}
        <div className="p-6 flex flex-col items-center justify-center bg-neutral-950/80">
          {video.format === 'mp4' ? (
            /* Video simulated screen */
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-neutral-800 flex items-center justify-center group">
              <img
                src={video.thumbnail}
                alt={video.title}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-opacity ${
                  isPlaying ? 'opacity-85' : 'opacity-60'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Watermark badge */}
              <div className="absolute top-3 left-3 text-xs font-mono px-2 py-0.5 bg-black/70 text-blue-400 border border-blue-500/30 rounded">
                MP4 · {video.mp4Quality}
              </div>

              {/* Center Play/Pause button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
              </button>
            </div>
          ) : (
            /* Audio Visualizer Stage */
            <div className="w-full flex flex-col items-center py-6 space-y-6">
              <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>

              {/* Animated Waveform Equalizer */}
              <div className="flex items-center gap-1.5 h-12">
                {[1, 2, 3, 4, 3, 2, 4, 1, 3, 2, 4, 3, 2, 1, 4, 2].map((val, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 bg-red-500 rounded-full transition-all ${
                      isPlaying
                        ? idx % 4 === 0
                          ? 'animate-wave-1'
                          : idx % 4 === 1
                          ? 'animate-wave-2'
                          : idx % 4 === 2
                          ? 'animate-wave-3'
                          : 'animate-wave-4'
                        : 'h-1 opacity-40'
                    }`}
                  />
                ))}
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-neutral-100 max-w-md truncate">
                  {video.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">{video.channel}</p>
              </div>
            </div>
          )}

          {/* Player controls */}
          <div className="w-full max-w-lg mt-4 space-y-2">
            {/* Timeline Slider */}
            <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <div 
                className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  setCurrentTime(Math.floor(pos * video.duration));
                }}
              >
                <div
                  className="h-full bg-red-600 rounded-full"
                  style={{ width: `${(currentTime / Math.max(video.duration, 1)) * 100}%` }}
                />
              </div>
              <span>{video.durationFormatted}</span>
            </div>

            {/* Play/Pause & Volume bar */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <div className="flex items-center gap-2 text-neutral-400 text-xs">
                <Volume2 className="w-4 h-4" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-20 accent-red-600 cursor-pointer h-1 bg-neutral-800 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between p-4 bg-neutral-900 border-t border-neutral-800">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <span>Ver no YouTube original</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => {
              onDownload(video);
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-md shadow-red-950"
          >
            <Download className="w-4 h-4" />
            <span>Baixar em {video.format.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
