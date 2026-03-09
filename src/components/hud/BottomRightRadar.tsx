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
      className={`relative bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${mode === 'big' ? 'w-[400px] h-[400px]' : 'w-[200px] h-[200px]'}`}
    >
      {/* Radar Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-electric-blue animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Tactical Radar</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onToggleMode}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            {mode === 'big' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Radar Content */}
      <div className="w-full h-full">
        <FloatingRadar 
          tasks={tasks}
          users={users}
          shops={shops}
          center={center}
          onClick={onToggleMode}
        />
      </div>

      {/* Radar Footer */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">Scan Range</span>
          <span className="text-[10px] font-black text-white font-mono">5.2 KM</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">Targets</span>
          <span className="text-[10px] font-black text-electric-blue font-mono">12 ACTIVE</span>
        </div>
      </div>
    </motion.div>
  );
};
