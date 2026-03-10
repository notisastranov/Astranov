import React from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Plus, 
  Wallet, 
  User, 
  Bell, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Filter, 
  Crosshair, 
  Radar,
  History,
  Bookmark,
  Activity,
  Terminal
} from 'lucide-react';

interface HudLayoutProps {
  topCenter?: React.ReactNode;
  topRight?: React.ReactNode;
  leftColumn?: React.ReactNode;
  rightColumn?: React.ReactNode;
  bottomCenter?: React.ReactNode;
  bottomRight?: React.ReactNode;
  center?: React.ReactNode;
}

export const HudLayout: React.FC<HudLayoutProps> = ({
  topCenter,
  topRight,
  leftColumn,
  rightColumn,
  bottomCenter,
  bottomRight,
  center
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col overflow-hidden font-sans">
      {/* TOP ZONE */}
      <div className="flex justify-between items-start p-4 md:p-6 w-full">
        <div className="w-1/4" /> {/* Spacer for left balance */}
        
        <div className="flex-1 flex justify-center items-start pointer-events-auto">
          {topCenter || (
            <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl">
              <HudButton icon={<Wallet className="w-4 h-4" />} label="Wallet" />
              <HudButton icon={<User className="w-4 h-4" />} label="Account" />
              <HudButton icon={<Plus className="w-4 h-4" />} label="Post" primary />
              <HudButton icon={<Bell className="w-4 h-4" />} label="Alerts" />
            </div>
          )}
        </div>

        <div className="w-1/4 flex justify-end pointer-events-auto">
          {topRight}
        </div>
      </div>

      {/* MIDDLE ZONE */}
      <div className="flex-1 flex justify-between items-center px-4 md:px-6 relative">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {leftColumn || (
            <>
              <HudButton icon={<User className="w-5 h-5" />} label="Profile" vertical />
              <HudButton icon={<Bookmark className="w-5 h-5" />} label="Saved" vertical />
              <HudButton icon={<Activity className="w-5 h-5" />} label="Status" vertical />
              <HudButton icon={<History className="w-5 h-5" />} label="History" vertical />
              <HudButton icon={<Terminal className="w-5 h-5" />} label="Admin" vertical />
            </>
          )}
        </div>

        {/* CENTER AREA (Transparent for Map) */}
        <div className="flex-1 h-full pointer-events-none">
          {center}
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {rightColumn || (
            <>
              <HudButton icon={<ZoomIn className="w-5 h-5" />} label="In" vertical />
              <HudButton icon={<ZoomOut className="w-5 h-5" />} label="Out" vertical />
              <HudButton icon={<Layers className="w-5 h-5" />} label="Layers" vertical />
              <HudButton icon={<Filter className="w-5 h-5" />} label="Filters" vertical />
              <HudButton icon={<Crosshair className="w-5 h-5" />} label="Locate" vertical />
              <HudButton icon={<Radar className="w-5 h-5" />} label="Scan" vertical />
            </>
          )}
        </div>
      </div>

      {/* BOTTOM ZONE */}
      <div className="flex justify-between items-end p-4 md:p-6 w-full">
        <div className="w-1/4" /> {/* Spacer */}
        
        <div className="flex-1 flex justify-center pointer-events-auto">
          {bottomCenter || (
            <div className="w-full max-w-2xl bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 shadow-2xl flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-xl">
                <Search className="w-5 h-5 text-white/40" />
              </div>
              <input 
                type="text" 
                placeholder="Command system..." 
                className="flex-1 bg-transparent border-none outline-none text-white font-medium placeholder:text-white/20"
              />
            </div>
          )}
        </div>

        <div className="w-1/4 flex justify-end pointer-events-auto">
          {bottomRight || (
            <div className="w-32 h-32 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
              <Radar className="w-8 h-8 text-emerald-500/40" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface HudButtonProps {
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  vertical?: boolean;
  onClick?: () => void;
  data?: string;
}

const HudButton: React.FC<HudButtonProps> = ({ icon, label, primary, vertical, onClick, data }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 rounded-xl transition-all shadow-lg
        ${primary 
          ? 'bg-white text-black font-bold hover:bg-zinc-200' 
          : 'bg-zinc-800/50 backdrop-blur-md border border-white/5 text-white/70 hover:text-white hover:bg-zinc-700/50'}
        ${vertical ? 'flex-col px-3 py-4 min-w-[72px]' : ''}
      `}
    >
      <div className={primary ? 'text-black' : 'text-white/60'}>
        {icon}
      </div>
      <span className={`text-[10px] uppercase tracking-wider font-bold ${vertical ? 'mt-1' : ''}`}>
        {label}
      </span>
      {data && (
        <span className="ml-auto text-[10px] font-mono text-white/30">{data}</span>
      )}
    </motion.button>
  );
};
