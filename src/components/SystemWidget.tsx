import React from 'react';
import { motion } from 'motion/react';
import { X, Cpu, Zap, HardDrive, Battery, Thermometer, Bluetooth, Wifi, Signal, Globe, RadioTower, ShieldCheck, Power } from 'lucide-react';
import { usePermissions } from './AstranovSystem';

export interface SystemWidgetProps {
  type: 'integrity' | 'device' | 'network' | 'power';
  isActive: boolean;
  onClose: () => void;
}

export const SystemWidget: React.FC<SystemWidgetProps> = ({ type, isActive, onClose }) => {
  const { permissions, deviceSpecs, networkSpecs } = usePermissions();

  const getTitle = () => {
    switch (type) {
      case 'integrity': return 'System Integrity';
      case 'device': return 'Hardware Specs';
      case 'network': return 'Network Status';
      case 'power': return 'Power Management';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'integrity': return ShieldCheck;
      case 'device': return Cpu;
      case 'network': return Globe;
      case 'power': return Power;
    }
  };

  const Icon = getIcon();

  return (
    <motion.div
      drag
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      className="fixed top-24 left-24 z-[3000] w-72 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-electric-blue" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white italic">{getTitle()}</span>
        </div>
        <button 
          onClick={onClose}
          className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
        {type === 'integrity' && (
          <div className="space-y-2">
            {permissions.slice(0, 4).map(p => (
              <div key={p.name} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{p.name}</span>
                <span className={`text-[9px] font-black uppercase ${p.status === 'granted' ? 'text-emerald-500' : 'text-white/20'}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}

        {type === 'device' && (
          <div className="grid grid-cols-2 gap-2">
            <MiniSpec label="CPU" value={deviceSpecs.cpu.split(' ')[0]} />
            <MiniSpec label="RAM" value={deviceSpecs.ram} />
            <MiniSpec label="BAT" value={deviceSpecs.battery} />
            <MiniSpec label="TMP" value={deviceSpecs.temp} />
          </div>
        )}

        {type === 'network' && (
          <div className="space-y-3">
            <div className="flex justify-between gap-1">
              <Wifi className={`w-4 h-4 ${networkSpecs.wifi === 'active' ? 'text-emerald-500' : 'text-white/20'}`} />
              <Bluetooth className={`w-4 h-4 ${networkSpecs.bluetooth === 'active' ? 'text-emerald-500' : 'text-white/20'}`} />
              <Signal className={`w-4 h-4 ${networkSpecs.gsm === 'active' ? 'text-emerald-500' : 'text-white/20'}`} />
              <Globe className={`w-4 h-4 ${networkSpecs.fiveG === 'active' ? 'text-emerald-500' : 'text-white/20'}`} />
            </div>
            <div className="p-2 bg-black/20 rounded-xl border border-white/5">
              <p className="text-[8px] text-white/40 uppercase tracking-widest">EMI Field</p>
              <p className="text-sm font-black text-electric-blue">{networkSpecs.magneticField}</p>
            </div>
          </div>
        )}

        {type === 'power' && (
          <div className="flex flex-col gap-2">
            <div className={`p-3 rounded-xl border flex items-center justify-between ${isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest">System</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{isActive ? 'Online' : 'Offline'}</span>
            </div>
            <p className="text-[8px] text-white/20 text-center uppercase tracking-widest">Drag to reposition widget</p>
          </div>
        )}
      </div>

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_0%,rgba(0,210,255,0.02)_50%,transparent_100%)] bg-[length:100%_4px] animate-scanline" />
    </motion.div>
  );
}

function MiniSpec({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-2 bg-white/5 rounded-xl border border-white/5">
      <p className="text-[8px] text-white/40 uppercase tracking-widest">{label}</p>
      <p className="text-[10px] font-bold text-white truncate">{value}</p>
    </div>
  );
}
