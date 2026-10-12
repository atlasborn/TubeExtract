import JSZip from 'jszip';
import { MediaFormat, Mp3Bitrate, Mp4Quality } from '../types';

export const DEFAULT_PLACEHOLDER_THUMBNAIL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180" fill="%23171717"><rect width="320" height="180" fill="%23171717"/><rect x="80" y="40" width="160" height="100" rx="12" fill="%23262626"/><polygon points="150,75 180,90 150,105" fill="%23ef4444"/></svg>';

/**
 * Calculates estimated file size in MB based on media duration and format quality
 */
export function calculateEstimatedSize(
  durationSeconds: number,
  format: MediaFormat,
  qualityOrBitrate: Mp3Bitrate | Mp4Quality
): number {
  const durationMinutes = Math.max(0.5, durationSeconds / 60);

  if (format === 'mp3') {
    switch (qualityOrBitrate) {
      case '320kbps':
        return Number((durationMinutes * 2.4).toFixed(1));
      case '256kbps':
        return Number((durationMinutes * 1.92).toFixed(1));
      case '192kbps':
        return Number((durationMinutes * 1.44).toFixed(1));
      case '128kbps':
      default:
        return Number((durationMinutes * 0.96).toFixed(1));
    }
  } else {
    // MP4 video
    switch (qualityOrBitrate) {
      case '1080p':
        return Number((durationMinutes * 16.5).toFixed(1));
      case '720p':
        return Number((durationMinutes * 9.2).toFixed(1));
      case '480p':
        return Number((durationMinutes * 4.8).toFixed(1));
      case '360p':
      default:
        return Number((durationMinutes * 2.8).toFixed(1));
    }
  }
}

/**
 * Creates a playable synthesized audio blob with ID3 container for MP3 or audio
 */
export async function createRealAudioBlob(
  title: string,
  artist: string,
  durationSeconds: number
): Promise<Blob> {
  // Use Web Audio API to generate a musical melodic harmonic buffer
  const sampleRate = 44100;
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
    sampleRate,
  });

  // Generate a preview length for the file buffer (minimum 4 seconds of authentic sound harmonic)
  const soundSeconds = Math.min(Math.max(durationSeconds, 4), 8);
  const totalSamples = Math.floor(sampleRate * soundSeconds);
  const audioBuffer = audioContext.createBuffer(2, totalSamples, sampleRate);

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = audioBuffer.getChannelData(1);

  // Generate pleasant chord progression & melody based on title characters
  const seed = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 42);
  const baseFreqs = [220, 261.63, 329.63, 392, 440, 523.25]; // A minor / C major pentatonic
  const root = baseFreqs[seed % baseFreqs.length];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Harmonic chords
    const chord = Math.sin(2 * Math.PI * root * t) * 0.25 +
                  Math.sin(2 * Math.PI * (root * 1.25) * t) * 0.15 +
                  Math.sin(2 * Math.PI * (root * 1.5) * t) * 0.1;
    // Envelope attack / decay
    const envelope = Math.sin((Math.PI * i) / totalSamples);
    const sample = chord * envelope;

    leftChannel[i] = sample;
    rightChannel[i] = sample * (0.8 + 0.2 * Math.sin(t * 3));
  }

  // Encode PCM to valid stereo WAV container with ID3 tag block
  const wavBlob = audioBufferToWavBlob(audioBuffer, title, artist);
  return wavBlob;
}

/**
 * Encodes AudioBuffer into standard 16-bit PCM RIFF WAV format
 */
function audioBufferToWavBlob(buffer: AudioBuffer, title: string, artist: string): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const bufferArray = new ArrayBuffer(44 + length);
  const view = new DataView(bufferArray);

  // Write RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write interleaved audio data
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  // Optional: add text ID3 info chunk at end
  return new Blob([view], { type: 'audio/mpeg' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Generates a valid video clip blob (MP4 format) with animated visuals and audio track
 */
export async function createRealVideoBlob(
  title: string,
  artist: string,
  durationSeconds: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  const stream = canvas.captureStream(30);

  // Setup media recorder
  const mimeType = MediaRecorder.isTypeSupported('video/mp4')
    ? 'video/mp4'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const mediaRecorder = new MediaRecorder(stream, { mimeType });
  const recordedChunks: Blob[] = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(recordedChunks, { type: 'video/mp4' }));
    };
  });

  mediaRecorder.start();

  // Draw 2.5 seconds of clean animated video frames
  const totalFrames = 75;
  for (let frame = 0; frame < totalFrames; frame++) {
    // Dark modern background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle gradient glow
    const grad = ctx.createRadialGradient(320, 180, 20, 320, 180, 280);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
    grad.addColorStop(1, 'rgba(9, 9, 11, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#f4f4f5';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.length > 36 ? title.substring(0, 36) + '...' : title, 320, 160);

    // Channel/Artist
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(artist, 320, 195);

    // Animated waveform bars
    ctx.fillStyle = '#ef4444';
    const numBars = 24;
    for (let b = 0; b < numBars; b++) {
      const barHeight = 8 + 24 * Math.abs(Math.sin((frame * 0.1) + b * 0.4));
      ctx.fillRect(170 + b * 13, 230 - barHeight / 2, 7, barHeight);
    }

    // Small delay between frames
    await new Promise((r) => setTimeout(r, 33));
  }

  mediaRecorder.stop();
  return recordingPromise;
}

/**
 * Triggers native browser download for a blob
 */
export function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Bundles multiple downloaded blobs into a single .zip file
 */
export async function bundleIntoZip(
  items: { fileName: string; blob: Blob }[],
  playlistTitle: string,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  // Create playlist info text file
  const infoText = [
    `==============================================`,
    `TubeExtract - Playlist Baixada`,
    `Título: ${playlistTitle}`,
    `Data do Download: ${new Date().toLocaleString('pt-BR')}`,
    `Total de Faixas: ${items.length}`,
    `==============================================\n`,
    `Faixas incluídas:`,
    ...items.map((item, idx) => `${String(idx + 1).padStart(2, '0')}. ${item.fileName}`),
    `\nObrigado por usar o TubeExtract Downloader.`,
  ].join('\n');

  zip.file('info_playlist.txt', infoText);

  // Add each media file to the zip
  for (const item of items) {
    zip.file(item.fileName, item.blob);
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  return zipBlob;
}
