import React from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, AlertCircle } from 'lucide-react';

interface VersionBarProps {
  currentVersion: string;
  latestVersion: string;
  status: 'up-to-date' | 'update-available' | 'critical-update';
  onUpdate?: () => void;
}

export const VersionBar: React.FC<VersionBarProps> = ({
  currentVersion,
  latestVersion,
  status,
  onUpdate
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'up-to-date': return 'text-emerald-500';
      case 'update-available': return 'text-amber-500';
      case 'critical-update': return 'text-rose-500';
      default: return 'text-white/40';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'up-to-date': return Shield;
      case 'update-available': return Zap;
      case 'critical-update': return AlertCircle;
      default: return Shield;
    }
  };

  const Icon = getStatusIcon();

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={status !== 'up-to-date' ? onUpdate : undefined}
      className={`fixed top-0 left-0 right-0 z-[1000] h-6 bg-black/80 backdrop-blur-md border-b border-white/5 flex items-center justify-center px-4 transition-all ${status !== 'up-to-date' ? 'cursor-pointer hover:bg-white/5 pointer-events-auto' : 'pointer-events-none'}`}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">System Version</span>
          <span className="text-[10px] font-black text-white italic tracking-tighter">v{currentVersion}</span>
        </div>
        
        <div className="w-px h-3 bg-white/10" />
        
        <div className="flex items-center gap-2">
          <Icon className={`w-3 h-3 ${getStatusColor()}`} />
          <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${getStatusColor()}`}>
            {status.replace('-', ' ')}
          </span>
        </div>

        {status !== 'up-to-date' && (
          <>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Latest</span>
              <span className="text-[10px] font-black text-white italic tracking-tighter">v{latestVersion}</span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
