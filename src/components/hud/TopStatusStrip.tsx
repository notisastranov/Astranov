import React from 'react';
import { motion } from 'motion/react';
import { Activity, RefreshCw, ShieldCheck } from 'lucide-react';

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
    <div className="fixed top-0 left-0 right-0 h-10 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-[100] pointer-events-auto">
      {/* LEFT: Branding & Version */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-sm rotate-45" />
          <span className="text-[11px] font-black text-white uppercase tracking-[0.4em]">AstranoV</span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-3 font-mono">
          <div className="flex flex-col">
            <span className="text-[6px] text-white/30 uppercase font-bold tracking-widest leading-none">KERNEL</span>
            <span className="text-[9px] text-blue-400/90 font-bold leading-none mt-0.5">v{currentVersion}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[6px] text-white/30 uppercase font-bold tracking-widest leading-none">NODE_ID</span>
            <span className="text-[9px] text-white/60 font-bold leading-none mt-0.5">AS-772</span>
          </div>
        </div>
      </div>

      {/* CENTER: Diagnostic/Update Status */}
      <motion.button
        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.98 }}
        onClick={isUpdateAvailable ? onUpdate : onDiagnosticClick}
        className="flex items-center gap-3 px-5 py-1 rounded-full bg-white/5 border border-white/10 transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <div className={`w-1 h-1 rounded-full animate-pulse ${
          status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
          status === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
          'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
        }`} />
        <span className="text-[8px] font-black text-white/70 uppercase tracking-[0.25em] group-hover:text-white transition-colors">
          {isUpdateAvailable ? `Update_Pending: v${latestVersion}` : 'System_Integrity: Optimal'}
        </span>
        {isUpdateAvailable ? <RefreshCw className="w-2.5 h-2.5 text-blue-400 animate-spin-slow" /> : <ShieldCheck className="w-2.5 h-2.5 text-emerald-400/70" />}
      </motion.button>

      {/* RIGHT: Telemetry Info */}
      <div className="flex items-center gap-4 font-mono">
        <div className="hidden lg:flex flex-col items-end">
          <span className="text-[6px] text-white/30 uppercase font-bold tracking-widest leading-none">UPLINK_SEC</span>
          <span className="text-[9px] text-emerald-400/80 font-bold leading-none mt-0.5">AES_256</span>
        </div>
        <div className="h-4 w-px bg-white/10 hidden lg:block" />
        <div className="flex flex-col items-end">
          <span className="text-[6px] text-white/30 uppercase font-bold tracking-widest leading-none">BUILD_REF</span>
          <span className="text-[9px] text-white/40 font-bold leading-none mt-0.5">v{latestVersion}</span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-blue-500/50" />
          <span className="text-[9px] text-white/60 font-bold">124ms</span>
        </div>
      </div>
    </div>
  );
};
