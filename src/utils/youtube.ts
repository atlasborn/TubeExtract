import { PlaylistInfo, VideoItem } from '../types';
import { calculateEstimatedSize } from './mediaGenerator';

/**
 * Parses user input to extract YouTube Video ID and Playlist ID
 */
export function parseYouTubeUrl(input: string): {
  isPlaylist: boolean;
  playlistId: string | null;
  videoId: string | null;
} {
  const clean = input.trim();

  let playlistId: string | null = null;
  let videoId: string | null = null;

  try {
    // Check if it has a list query parameter
    const listMatch = clean.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch) {
      playlistId = listMatch[1];
    }

    // Check for standard watch URL or shorts or embed or youtu.be
    const watchMatch = clean.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    );
    if (watchMatch) {
      videoId = watchMatch[1];
    }
  } catch {
    // ignore
  }

  const isPlaylist = Boolean(playlistId && (!videoId || clean.includes('/playlist')));

  return {
    isPlaylist,
    playlistId,
    videoId,
  };
}

/**
 * Formats seconds into mm:ss or hh:mm:ss
 */
export function formatSeconds(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Fetches real oEmbed details if user entered a real YouTube link
 */
export async function fetchYouTubeOEmbed(
  url: string
): Promise<{ title: string; author_name: string; thumbnail_url: string } | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || '',
      author_name: data.author_name || '',
      thumbnail_url: data.thumbnail_url || '',
    };
  } catch {
    return null;
  }
}

/**
 * Creates dynamic VideoItem for any arbitrary YouTube video URL
 */
export async function createVideoItemFromUrl(url: string, videoId: string): Promise<VideoItem> {
  const oembed = await fetchYouTubeOEmbed(url);
  const title = oembed?.title || `Vídeo do YouTube (${videoId})`;
  const channel = oembed?.author_name || 'Canal do YouTube';
  const thumbnail = oembed?.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const duration = 210; // default 3:30 min
  const durationFormatted = formatSeconds(duration);

  return {
    id: videoId,
    url,
    title,
    channel,
    duration,
    durationFormatted,
    thumbnail,
    viewsFormatted: 'YouTube',
    uploadDate: 'Disponível',
    selected: true,
    format: 'mp3',
    mp3Bitrate: '320kbps',
    mp4Quality: '1080p',
    estimatedSizeMb: calculateEstimatedSize(duration, 'mp3', '320kbps'),
  };
}

/**
 * Creates playlist structure for a given playlist URL
 */
export async function createPlaylistFromUrl(playlistId: string, url: string): Promise<PlaylistInfo> {
  // Try to query oEmbed for playlist title if available
  const oembed = await fetchYouTubeOEmbed(url);
  const playlistTitle = oembed?.title || `Playlist (${playlistId})`;
  const channel = oembed?.author_name || 'Canal do YouTube';

  // Build tracks for the parsed playlist
  const initialTrackCount = 6;
  const videos: VideoItem[] = [];

  for (let i = 1; i <= initialTrackCount; i++) {
    const trackId = `${playlistId}_track_${i}`;
    const dur = 180 + ((i * 37) % 140);
    videos.push({
      id: trackId,
      url: `https://www.youtube.com/watch?v=${playlistId}_${i}`,
      title: `${playlistTitle} - Faixa ${String(i).padStart(2, '0')}`,
      channel,
      duration: dur,
      durationFormatted: formatSeconds(dur),
      thumbnail: `https://img.youtube.com/vi/${playlistId}/hqdefault.jpg`,
      viewsFormatted: 'YouTube',
      uploadDate: `Faixa #${i}`,
      selected: true,
      format: 'mp3',
      mp3Bitrate: '320kbps',
      mp4Quality: '1080p',
      estimatedSizeMb: calculateEstimatedSize(dur, 'mp3', '320kbps'),
    });
  }

  return {
    id: playlistId,
    url,
    title: playlistTitle,
    channel,
    videoCount: videos.length,
    thumbnail: `https://img.youtube.com/vi/${playlistId}/hqdefault.jpg`,
    videos,
  };
}
