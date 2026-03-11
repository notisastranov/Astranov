import React from 'react';
import { motion } from 'motion/react';

interface TopStatusStripProps {
  currentVersion: string;
  latestVersion: string;
  onUpdate: () => void;
}

export const TopStatusStrip: React.FC<TopStatusStripProps> = ({
  currentVersion,
  latestVersion,
  onUpdate
}) => {
  const isMatch = currentVersion === latestVersion;

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-black/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-center z-[100] pointer-events-auto select-none font-mono">
      <div className="flex items-center gap-6">
        {/* Astranov Name - Glowing Blue */}
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]">
          Astranov
        </span>

        {/* Current Version - Glowing Blue */}
        <span className="text-[9px] text-blue-400 font-bold drop-shadow-[0_0_3px_rgba(96,165,250,0.6)] uppercase tracking-wider">
          current v{currentVersion}
        </span>

        {/* Latest Version & Update Action */}
        <div className="flex items-center gap-3">
          <span className={`text-[9px] font-bold uppercase tracking-wider ${isMatch ? 'text-green-500' : 'text-red-500'}`}>
            latest v{latestVersion}
          </span>
          
          {!isMatch && (
            <button 
              onClick={onUpdate}
              className="text-[9px] font-bold text-yellow-400 underline cursor-pointer hover:text-yellow-300 transition-colors uppercase tracking-wider"
            >
              force refresh update
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
