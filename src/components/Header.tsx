import React from 'react';
import { Download, Sliders, PlaySquare } from 'lucide-react';

interface HeaderProps {
  activeTab: 'home' | 'queue' | 'history';
  setActiveTab: (tab: 'home' | 'queue' | 'history') => void;
  queueCount: number;
  openSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  queueCount,
  openSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-950 group-hover:bg-red-500 transition-colors">
            <PlaySquare className="w-5 h-5 fill-current" />
          </div>
          <span className="text-lg font-bold tracking-tight text-neutral-100 whitespace-nowrap">
            Tube<span className="text-red-500">Extract</span>
          </span>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-400">
          <button
            onClick={() => setActiveTab('home')}
            className={`transition-colors whitespace-nowrap hover:text-neutral-100 ${
              activeTab === 'home' ? 'text-neutral-100 font-semibold' : ''
            }`}
          >
            Início & Conversor
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 transition-colors whitespace-nowrap hover:text-neutral-100 ${
              activeTab === 'queue' ? 'text-neutral-100 font-semibold' : ''
            }`}
          >
            <span>Fila de Downloads</span>
            {queueCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs font-mono flex items-center justify-center tabular-nums">
                {queueCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`transition-colors whitespace-nowrap hover:text-neutral-100 ${
              activeTab === 'history' ? 'text-neutral-100 font-semibold' : ''
            }`}
          >
            Histórico de Downloads
          </button>
        </nav>

        {/* Zone 3: 1 primary action button + quick settings */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openSettings}
            title="Preferências de Formato e Qualidade"
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 border border-neutral-700/80 rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-red-500" />
            <span>Fila Ativa</span>
            {queueCount > 0 && (
              <span className="text-neutral-300 font-mono tabular-nums">({queueCount})</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
