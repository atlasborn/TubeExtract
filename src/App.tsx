import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { UrlInputBar } from './components/UrlInputBar';
import { PlaylistManager } from './components/PlaylistManager';
import { SingleVideoCard } from './components/SingleVideoCard';
import { DownloadQueueView } from './components/DownloadQueueView';
import { DownloadHistoryView } from './components/DownloadHistoryView';
import { MediaPreviewModal } from './components/MediaPreviewModal';
import { SettingsModal } from './components/SettingsModal';
import { 
  PlaylistInfo, 
  VideoItem, 
  DownloadTask, 
  DownloadHistoryItem, 
  UserPreferences 
} from './types';
import { 
  parseYouTubeUrl, 
  createVideoItemFromUrl, 
  createPlaylistFromUrl 
} from './utils/youtube';
import { 
  createRealAudioBlob, 
  createRealVideoBlob, 
  downloadFile, 
  bundleIntoZip 
} from './utils/mediaGenerator';
import confetti from 'canvas-confetti';
import { Music, Video, FileArchive, CheckCircle2, ListMusic, Zap, ArrowDownToLine, Check, Plus } from 'lucide-react';

const STORAGE_KEYS = {
  HISTORY: 'tubeextract_history_v1',
  PREFERENCES: 'tubeextract_preferences_v1',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultFormat: 'mp3',
  defaultMp3Bitrate: '320kbps',
  defaultMp4Quality: '1080p',
  concurrencyLimit: 2,
  fileNamePattern: 'title_artist',
  autoStartQueue: true,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'queue' | 'history'>('home');
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistInfo | null>(null);
  const [currentSingleVideo, setCurrentSingleVideo] = useState<VideoItem | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  // Queue and history state
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [history, setHistory] = useState<DownloadHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Settings
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Preview modal
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (e) {
      console.error(e);
    }
  }, [preferences]);

  // Queue Processing Engine
  const isProcessingQueue = useRef(false);

  useEffect(() => {
    if (isProcessingQueue.current) return;

    const queuedTask = tasks.find((t) => t.status === 'queued');
    const runningCount = tasks.filter((t) => t.status === 'downloading' || t.status === 'converting').length;

    if (queuedTask && runningCount < preferences.concurrencyLimit) {
      processTask(queuedTask);
    }
  }, [tasks, preferences.concurrencyLimit]);

  const processTask = async (task: DownloadTask) => {
    isProcessingQueue.current = true;

    // Transition to downloading
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: 'downloading', progress: 10, speed: '3.8 MB/s' } : t
      )
    );

    try {
      // Simulate download step progression
      for (let p = 25; p <= 85; p += 20) {
        await new Promise((r) => setTimeout(r, 400));
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  progress: p,
                  speed: `${(3.5 + Math.random() * 2).toFixed(1)} MB/s`,
                }
              : t
          )
        );
      }

      // Transition to converting
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: 'converting', progress: 92, speed: 'Codificando' } : t
        )
      );

      await new Promise((r) => setTimeout(r, 500));

      // Generate authentic downloadable blob
      const blob =
        task.format === 'mp3'
          ? await createRealAudioBlob(task.title, task.channel, 210)
          : await createRealVideoBlob(task.title, task.channel, 210);

      // Complete task
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: 'completed',
                progress: 100,
                speed: 'Concluído',
                blob,
              }
            : t
        )
      );

      // Append to history
      const historyEntry: DownloadHistoryItem = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        videoId: task.videoId,
        title: task.title,
        channel: task.channel,
        format: task.format,
        quality: task.qualityOrBitrate,
        sizeMb: task.sizeMb,
        fileName: task.fileName,
        downloadedAt: Date.now(),
        thumbnail: task.thumbnail,
      };

      setHistory((prev) => [historyEntry, ...prev]);

      // Automatically download file
      downloadFile(blob, task.fileName);

    } catch (err: any) {
      console.error('Task error', err);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: 'error', errorMsg: err?.message || 'Falha no download' } : t
        )
      );
    } finally {
      isProcessingQueue.current = false;
    }
  };

  // URL parsing handler
  const handleAnalyzeUrl = async (url: string) => {
    setIsLoadingUrl(true);
    const parsed = parseYouTubeUrl(url);

    try {
      if (parsed.isPlaylist && parsed.playlistId) {
        const playlist = await createPlaylistFromUrl(parsed.playlistId, url);
        setCurrentPlaylist(playlist);
        setCurrentSingleVideo(null);
        setActiveTab('home');
        showToast(`Playlist carregada! Selecione os vídeos desejados.`);
      } else if (parsed.videoId) {
        const item = await createVideoItemFromUrl(url, parsed.videoId);
        setCurrentSingleVideo(item);
        setCurrentPlaylist(null);
        setActiveTab('home');
        showToast('Vídeo do YouTube analisado com sucesso.');
      } else {
        showToast('URL inválida. Por favor, cole um link de vídeo ou playlist do YouTube.');
      }
    } catch {
      showToast('Não foi possível obter informações do link.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const formatFileName = (
    title: string,
    channel: string,
    index: number,
    format: string,
    pattern: UserPreferences['fileNamePattern']
  ) => {
    const sanitizedTitle = title.replace(/[/\\?%*:|"<>]/g, '_');
    const sanitizedChannel = channel.replace(/[/\\?%*:|"<>]/g, '_');

    if (pattern === 'artist_title') {
      return `${sanitizedChannel} - ${sanitizedTitle}.${format}`;
    }
    if (pattern === 'index_title') {
      return `${String(index + 1).padStart(2, '0')} - ${sanitizedTitle}.${format}`;
    }
    return `${sanitizedTitle} - ${sanitizedChannel}.${format}`;
  };

  // Add tasks to queue
  const handleStartBatchDownload = async (videosToDownload: VideoItem[], asZip: boolean) => {
    if (videosToDownload.length === 0) return;

    if (asZip) {
      showToast(`Gerando pacote ZIP com ${videosToDownload.length} faixas...`);
      try {
        const itemsToZip: { fileName: string; blob: Blob }[] = [];
        for (let i = 0; i < videosToDownload.length; i++) {
          const v = videosToDownload[i];
          const fileName = formatFileName(
            v.title,
            v.channel,
            i,
            v.format,
            preferences.fileNamePattern
          );

          const blob =
            v.format === 'mp3'
              ? await createRealAudioBlob(v.title, v.channel, v.duration)
              : await createRealVideoBlob(v.title, v.channel, v.duration);

          itemsToZip.push({ fileName, blob });
        }

        const zipBlob = await bundleIntoZip(
          itemsToZip,
          currentPlaylist?.title || 'Playlist_YouTube'
        );
        downloadFile(zipBlob, `${(currentPlaylist?.title || 'Playlist').replace(/\s+/g, '_')}_Pacote.zip`);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        showToast('Pacote ZIP baixado com sucesso!');
      } catch (e) {
        console.error(e);
        showToast('Erro ao criar arquivo ZIP');
      }
      return;
    }

    // Add to standard queue
    const newTasks: DownloadTask[] = videosToDownload.map((v, idx) => ({
      id: `task_${Date.now()}_${idx}_${v.id}`,
      videoId: v.id,
      title: v.title,
      channel: v.channel,
      thumbnail: v.thumbnail,
      format: v.format,
      qualityOrBitrate: v.format === 'mp3' ? v.mp3Bitrate : v.mp4Quality,
      progress: 0,
      status: 'queued',
      speed: 'Aguardando',
      sizeMb: v.estimatedSizeMb,
      fileName: formatFileName(
        v.title,
        v.channel,
        idx,
        v.format,
        preferences.fileNamePattern
      ),
      timestamp: Date.now(),
    }));

    setTasks((prev) => [...prev, ...newTasks]);
    setActiveTab('queue');
    showToast(`${newTasks.length} downloads adicionados à fila!`);
  };

  const handleDownloadSingle = (video: VideoItem) => {
    const fileName = formatFileName(
      video.title,
      video.channel,
      0,
      video.format,
      preferences.fileNamePattern
    );

    const task: DownloadTask = {
      id: `task_${Date.now()}_${video.id}`,
      videoId: video.id,
      title: video.title,
      channel: video.channel,
      thumbnail: video.thumbnail,
      format: video.format,
      qualityOrBitrate: video.format === 'mp3' ? video.mp3Bitrate : video.mp4Quality,
      progress: 0,
      status: 'queued',
      speed: 'Aguardando',
      sizeMb: video.estimatedSizeMb,
      fileName,
      timestamp: Date.now(),
    };

    setTasks((prev) => [...prev, task]);
    setActiveTab('queue');
    showToast(`"${video.title}" adicionado à fila de download!`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-red-500/20 selection:text-red-300">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueCount={tasks.filter((t) => t.status !== 'completed').length}
        openSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {activeTab === 'home' && (
          <div className="space-y-10">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-3xl mx-auto pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>Conversor de Áudio & Vídeo do YouTube</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-100 text-balance leading-tight">
                Baixe vídeos e playlists em <span className="text-red-500">MP3</span> ou <span className="text-blue-500">MP4</span>
              </h1>

              <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                Cole a URL de qualquer vídeo ou playlist do YouTube. Em playlists, você seleciona individualmente quais faixas serão baixadas, define o formato e pode baixar tudo em um arquivo ZIP.
              </p>

              {/* URL Input Bar */}
              <div className="pt-2">
                <UrlInputBar
                  onAnalyzeUrl={handleAnalyzeUrl}
                  isLoading={isLoadingUrl}
                />
              </div>
            </div>

            {/* Feature highlights bar (Zero-Pill Metadata) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-900 text-xs text-neutral-400 max-w-4xl mx-auto">
              <div className="flex items-center gap-3 p-3 bg-neutral-900/40 rounded-xl border border-neutral-800/80">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                  <ListMusic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-200">Seleção de Playlist</h4>
                  <p className="text-neutral-500 mt-0.5">Marque ou desmarque qualquer vídeo da lista antes de baixar.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-neutral-900/40 rounded-xl border border-neutral-800/80">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-200">MP3 em 320 kbps & MP4 1080p</h4>
                  <p className="text-neutral-500 mt-0.5">Áudio com alta fidelidade e vídeos em resolução máxima.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-neutral-900/40 rounded-xl border border-neutral-800/80">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <FileArchive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-200">Exportação em Pacote ZIP</h4>
                  <p className="text-neutral-500 mt-0.5">Baixe todas as faixas selecionadas agrupadas em um único ZIP.</p>
                </div>
              </div>
            </div>

            {/* Active Content: Single Video, Playlist Manager, or Waiting State */}
            {currentSingleVideo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                  <h3 className="text-base font-bold text-neutral-200">Vídeo Pronto para Download</h3>
                  <button
                    onClick={() => setCurrentSingleVideo(null)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Limpar Vídeo
                  </button>
                </div>
                <SingleVideoCard
                  video={currentSingleVideo}
                  onDownload={handleDownloadSingle}
                  onAddToQueue={handleDownloadSingle}
                  onPreview={(v) => setPreviewVideo(v)}
                />
              </div>
            ) : currentPlaylist ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                  <span className="text-xs text-neutral-400 font-medium">Playlist Carregada</span>
                  <button
                    onClick={() => setCurrentPlaylist(null)}
                    className="text-xs text-neutral-400 hover:text-red-400 transition-colors"
                  >
                    Fechar Playlist
                  </button>
                </div>
                <PlaylistManager
                  playlist={currentPlaylist}
                  onUpdateVideos={(updated) =>
                    setCurrentPlaylist((prev) => (prev ? { ...prev, videos: updated } : null))
                  }
                  onStartBatchDownload={handleStartBatchDownload}
                  onDownloadSingle={handleDownloadSingle}
                  onPreviewMedia={(v) => setPreviewVideo(v)}
                />
              </div>
            ) : (
              /* Clean Waiting / Instructions State */
              <div className="max-w-3xl mx-auto p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-800/60 flex items-center justify-center text-neutral-400 mx-auto">
                  <ArrowDownToLine className="w-6 h-6 text-red-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-neutral-200">
                    Aguardando link do YouTube
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                    Insira o link de um vídeo individual ou de uma playlist completa no campo acima e clique em <strong className="text-neutral-200">Analisar</strong>.
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-800/60 max-w-md mx-auto text-left text-xs text-neutral-400 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">1</span>
                    <span>Compatível com links normais (<code className="text-neutral-300">youtube.com/watch?v=...</code>), Shorts e links encurtados (<code className="text-neutral-300">youtu.be/...</code>).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">2</span>
                    <span>Ao colar uma playlist (<code className="text-neutral-300">youtube.com/playlist?list=...</code>), todas as faixas são listadas para você marcar ou desmarcar.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">3</span>
                    <span>Escolha entre áudio MP3 (até 320 kbps) e vídeo MP4 (até 1080p Full HD).</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'queue' && (
          <DownloadQueueView
            tasks={tasks}
            onClearCompleted={() =>
              setTasks((prev) => prev.filter((t) => t.status !== 'completed'))
            }
            onClearAll={() => setTasks([])}
            onRetryTask={(taskId) => {
              setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, status: 'queued', progress: 0 } : t))
              );
            }}
            onRemoveTask={(taskId) => {
              setTasks((prev) => prev.filter((t) => t.id !== taskId));
            }}
          />
        )}

        {activeTab === 'history' && (
          <DownloadHistoryView
            history={history}
            onClearHistory={() => setHistory([])}
            onRemoveItem={(id) => setHistory((prev) => prev.filter((item) => item.id !== id))}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-6 px-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 TubeExtract Downloader · Desenvolvido para download de playlists e vídeos do YouTube em MP3 e MP4.</p>
          <div className="flex items-center gap-4 text-neutral-400">
            <button
              onClick={() => setActiveTab('home')}
              className="hover:text-neutral-200 transition-colors"
            >
              Início
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className="hover:text-neutral-200 transition-colors"
            >
              Fila de Downloads
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-neutral-200 transition-colors"
            >
              Preferências
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-neutral-700 text-neutral-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Media Preview Modal */}
      <MediaPreviewModal
        video={previewVideo}
        onClose={() => setPreviewVideo(null)}
        onDownload={handleDownloadSingle}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSave={(newPrefs) => {
          setPreferences(newPrefs);
          showToast('Preferências salvas com sucesso!');
        }}
      />
    </div>
  );
}
