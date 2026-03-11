import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radar, X, Maximize2, Minimize2 } from 'lucide-react';
import { Task, User, Shop } from '../../types';
import FloatingRadar from '../FloatingRadar';

interface BottomRightRadarProps {
  mode: 'small' | 'big' | 'hidden';
  onToggleMode: () => void;
  onClose: () => void;
  center: { lat: number; lng: number };
  tasks: Task[];
  users: User[];
  shops: Shop[];
}

export const BottomRightRadar: React.FC<BottomRightRadarProps> = ({
  mode,
  onToggleMode,
  onClose,
  center,
  tasks,
  users,
  shops,
}) => {
  if (mode === 'hidden') return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
      className={`relative bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-500 ${mode === 'big' ? 'w-64 h-64 md:w-80 md:h-80' : 'w-32 h-32 md:w-40 md:h-40'}`}
    >
      {/* Radar Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-2 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-1.5">
          <Radar className="w-3 h-3 text-blue-400 animate-pulse" />
          <span className="text-[7px] font-black text-white/60 uppercase tracking-widest">Scanner</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onToggleMode}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all"
          >
            {mode === 'big' ? <Minimize2 className="w-2.5 h-2.5" /> : <Maximize2 className="w-2.5 h-2.5" />}
          </button>
          <button 
            onClick={onClose}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Radar Content */}
      <div className="w-full h-full opacity-80">
        <FloatingRadar 
          tasks={tasks}
          users={users}
          shops={shops}
          center={center}
          onClick={onToggleMode}
        />
      </div>

      {/* Radar Footer */}
      <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[6px] text-white/20 uppercase font-black tracking-widest">Range</span>
          <span className="text-[8px] font-black text-white/60 font-mono">5.2KM</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[6px] text-white/20 uppercase font-black tracking-widest">Signals</span>
          <span className="text-[8px] font-black text-blue-400/80 font-mono">12</span>
        </div>
      </div>
    </motion.div>
  );
};
