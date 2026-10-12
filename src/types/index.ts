export type MediaFormat = 'mp3' | 'mp4';
export type Mp3Bitrate = '320kbps' | '256kbps' | '192kbps' | '128kbps';
export type Mp4Quality = '1080p' | '720p' | '480p' | '360p';

export interface VideoItem {
  id: string;
  url: string;
  title: string;
  channel: string;
  duration: number; // in seconds
  durationFormatted: string;
  thumbnail: string;
  viewsFormatted: string;
  uploadDate: string;
  selected: boolean;
  format: MediaFormat;
  mp3Bitrate: Mp3Bitrate;
  mp4Quality: Mp4Quality;
  estimatedSizeMb: number;
}

export interface PlaylistInfo {
  id: string;
  url: string;
  title: string;
  channel: string;
  videoCount: number;
  thumbnail: string;
  videos: VideoItem[];
}

export type TaskStatus = 'queued' | 'downloading' | 'converting' | 'completed' | 'error';

export interface DownloadTask {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  format: MediaFormat;
  qualityOrBitrate: string;
  progress: number; // 0 - 100
  status: TaskStatus;
  speed: string;
  sizeMb: number;
  fileName: string;
  downloadUrl?: string;
  blob?: Blob;
  errorMsg?: string;
  timestamp: number;
}

export interface DownloadHistoryItem {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  format: MediaFormat;
  quality: string;
  sizeMb: number;
  fileName: string;
  downloadedAt: number;
  thumbnail: string;
}

export interface UserPreferences {
  defaultFormat: MediaFormat;
  defaultMp3Bitrate: Mp3Bitrate;
  defaultMp4Quality: Mp4Quality;
  concurrencyLimit: number;
  fileNamePattern: 'title_artist' | 'artist_title' | 'index_title';
  autoStartQueue: boolean;
}
