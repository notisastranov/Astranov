import React from 'react';
import { motion } from 'motion/react';

interface TopStatusStripProps {
  currentVersion: string;
  latestVersion: string;
  status: 'healthy' | 'warning' | 'problem';
  onUpdate: () => void;
  onDiagnosticClick: () => void;
}

export const TopStatusStrip: React.FC<TopStatusStripProps> = ({
  currentVersion,
  latestVersion,
  status,
  onUpdate,
  onDiagnosticClick
}) => {
  const isUpdateAvailable = currentVersion !== latestVersion;

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-black/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-[100] pointer-events-auto select-none font-mono">
      {/* LEFT: Branding & Current Version */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] font-sans">AstranoV</span>
        <span className="text-[9px] text-blue-400/80 font-bold">v{currentVersion}</span>
      </div>

      {/* CENTER: Diagnostics / Status (Clickable Text Only) */}
      <div className="flex items-center gap-6">
        <span className="text-[8px] text-white/20">|</span>
        <button 
          onClick={onDiagnosticClick}
          className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors cursor-pointer"
        >
          {status === 'healthy' ? 'diagnostics: optimal' : 'diagnostics: check_required'}
        </button>
        <span className="text-[8px] text-white/20">|</span>
      </div>

      {/* RIGHT: Latest Version (Clickable) */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onUpdate}
          className={`text-[9px] font-bold transition-colors cursor-pointer ${isUpdateAvailable ? 'text-amber-400 hover:text-amber-300' : 'text-white/30 hover:text-white'}`}
        >
          latest v{latestVersion}
        </button>
      </div>
    </div>
  );
};
