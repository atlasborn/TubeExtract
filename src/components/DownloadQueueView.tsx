import React from 'react';
import { 
  Download, 
  FileArchive, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  RotateCcw, 
  ExternalLink,
  Music,
  Video,
  FileCheck
} from 'lucide-react';
import { DownloadTask } from '../types';
import { downloadFile, bundleIntoZip, DEFAULT_PLACEHOLDER_THUMBNAIL } from '../utils/mediaGenerator';
import confetti from 'canvas-confetti';

interface DownloadQueueViewProps {
  tasks: DownloadTask[];
  onClearCompleted: () => void;
  onClearAll: () => void;
  onRetryTask: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
}

export const DownloadQueueView: React.FC<DownloadQueueViewProps> = ({
  tasks,
  onClearCompleted,
  onClearAll,
  onRetryTask,
  onRemoveTask,
}) => {
  const completedTasks = tasks.filter((t) => t.status === 'completed' && t.blob);
  const activeTasks = tasks.filter((t) => t.status === 'downloading' || t.status === 'converting');
  const [isZipping, setIsZipping] = React.useState(false);
  const [zipProgress, setZipProgress] = React.useState(0);

  const handleDownloadAllZip = async () => {
    if (completedTasks.length === 0) return;
    setIsZipping(true);
    setZipProgress(0);

    try {
      const itemsToZip = completedTasks.map((t) => ({
        fileName: t.fileName,
        blob: t.blob!,
      }));

      const zipBlob = await bundleIntoZip(
        itemsToZip,
        'TubeExtract_Playlist_Pacote',
        (pct) => setZipProgress(pct)
      );

      downloadFile(zipBlob, `TubeExtract_Playlist_${Date.now()}.zip`);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Error creating zip archive', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <span>Fila de Downloads</span>
            {tasks.length > 0 && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 tabular-nums">
                {tasks.length} {tasks.length === 1 ? 'item' : 'itens'}
              </span>
            )}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {activeTasks.length > 0
              ? `Processando ${activeTasks.length} downloads ativos...`
              : completedTasks.length > 0
              ? `${completedTasks.length} downloads concluídos prontos para salvar.`
              : 'Nenhum download em andamento.'}
          </p>
        </div>

        {/* Global Queue Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {completedTasks.length > 1 && (
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-amber-950"
            >
              <FileArchive className="w-4 h-4" />
              <span>
                {isZipping ? `Compactando ZIP (${zipProgress}%)...` : `Baixar Todos em ZIP (${completedTasks.length})`}
              </span>
            </button>
          )}

          {completedTasks.length > 0 && (
            <button
              onClick={onClearCompleted}
              className="px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700/80 rounded-xl transition-colors"
            >
              Limpar Concluídos
            </button>
          )}

          {tasks.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-red-400 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-xl transition-colors"
            >
              Limpar Tudo
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/40 border border-neutral-850 rounded-2xl p-6">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800/80 flex items-center justify-center text-neutral-500 mx-auto mb-4">
            <Download className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-neutral-200">A fila de downloads está vazia</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1.5">
            Cole um link do YouTube ou selecione uma de nossas playlists de exemplo na tela inicial para iniciar downloads em MP3 ou MP4.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isDownloading = task.status === 'downloading';
            const isConverting = task.status === 'converting';
            const isError = task.status === 'error';
            const isQueued = task.status === 'queued';

            return (
              <div
                key={task.id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 shadow-md space-y-3 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800">
                      <img
                        src={task.thumbnail}
                        alt={task.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_PLACEHOLDER_THUMBNAIL;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        {task.format === 'mp3' ? (
                          <Music className="w-3.5 h-3.5 text-white/90" />
                        ) : (
                          <Video className="w-3.5 h-3.5 text-white/90" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-neutral-100 truncate">
                        {task.title}
                      </h4>
                      {/* Zero-Pill Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-0.5">
                        <span className="text-neutral-300">{task.channel}</span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className="font-mono text-neutral-300 font-medium">
                          {task.format.toUpperCase()} ({task.qualityOrBitrate})
                        </span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className="font-mono tabular-nums">~{task.sizeMb.toFixed(1)} MB</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status & Action buttons */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      {isCompleted && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Concluído</span>
                        </span>
                      )}
                      {isDownloading && (
                        <span className="text-red-400 flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Baixando {task.progress}%</span>
                        </span>
                      )}
                      {isConverting && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Convertendo...</span>
                        </span>
                      )}
                      {isQueued && (
                        <span className="text-neutral-400">Na Fila</span>
                      )}
                      {isError && (
                        <span className="text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>Erro</span>
                        </span>
                      )}
                    </div>

                    {/* Manual download file button once ready */}
                    {isCompleted && task.blob && (
                      <button
                        onClick={() => downloadFile(task.blob!, task.fileName)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
                        title="Salvar arquivo no disco"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Salvar</span>
                      </button>
                    )}

                    {isError && (
                      <button
                        onClick={() => onRetryTask(task.id)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-200 bg-neutral-800 rounded-lg transition-colors"
                        title="Tentar novamente"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onRemoveTask(task.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg transition-colors"
                      title="Remover da fila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800/80">
                  <div
                    className={`h-full transition-all duration-200 ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : isError
                        ? 'bg-red-500'
                        : 'bg-red-600'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>

                {/* Detailed speed/status footer */}
                {(isDownloading || isConverting) && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 tabular-nums">
                    <span>{task.speed}</span>
                    <span>
                      {isConverting ? 'Codificando faixas e metadados...' : `${task.progress}% de 100%`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
