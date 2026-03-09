import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Filter, Euro, Monitor, User as UserIcon, Power, ShoppingBag, Home, Heart, Utensils, Coffee, Store, Megaphone, Briefcase, Newspaper, Truck, Layers, Users, Settings, Gamepad2, Drone, Activity, LocateFixed, Radar } from 'lucide-react';
import { Task, User, Shop, UserRole } from '../types';
import { DiagnosticStatus } from '../services/diagnostics';
import AIInput from './AIInput';

interface IntegratedSearchProps {
  balance: number;
  onCommand: (cmd: string) => void;
  isLoading: boolean;
  lastReply?: string | null;
  onFinancialClick: () => void;
  onFilterSelect: (filter: string) => void;
  onAuthClick: () => void;
  isActive: boolean;
  onLayerToggle: () => void;
  onTeamClick: () => void;
  onSettingsClick: () => void;
  onGamesClick: () => void;
  onDroneClick: () => void;
  onPowerClick: () => void;
  onSyncGPS: () => void;
  onConsoleClick: () => void;
  onDiagnosticClick: () => void;
  systemHealth: DiagnosticStatus;
  onVoiceClick?: () => void;
  isListening?: boolean;
  healthValue: number;
  droneStatus: 'charged' | 'on_air' | 'low';
}

function HUDButton({ 
  icon, 
  onClick, 
  title, 
  color = "text-white/60", 
  label, 
  info, 
  isActive = true,
  className = ""
}: { 
  icon: React.ReactNode, 
  onClick: () => void, 
  title?: string, 
  color?: string, 
  label?: string, 
  info?: string,
  isActive?: boolean,
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        title={title}
        disabled={!isActive}
        className={`w-[56px] h-[56px] rounded-[16px] border border-white/10 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center transition-all shadow-2xl relative overflow-hidden group hover:border-electric-blue/50 hover:shadow-[0_0_15px_rgba(0,210,255,0.3)] ${color} ${!isActive ? 'opacity-20 grayscale pointer-events-none' : ''}`}
      >
        <div className="flex items-center justify-center w-full h-full">
          {icon}
        </div>
        {info && (
          <div className="absolute bottom-1 left-0 right-0 text-center">
            <span className="text-[8px] font-black text-white tracking-tighter bg-black/60 px-1 py-0.5 rounded-md border border-white/5">
              {info}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>
      {label && (
        <span className="text-[8px] font-black uppercase tracking-widest text-white/40">
          {label}
        </span>
      )}
    </div>
  );
}

export default function IntegratedSearch({
  balance,
  onCommand,
  isLoading,
  lastReply,
  onFinancialClick,
  onFilterSelect,
  onAuthClick,
  isActive,
  onLayerToggle,
  onTeamClick,
  onSettingsClick,
  onGamesClick,
  onDroneClick,
  onPowerClick,
  onSyncGPS,
  onConsoleClick,
  onDiagnosticClick,
  systemHealth,
  onVoiceClick,
  isListening,
  healthValue,
  droneStatus
}: IntegratedSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filterConfig = [
    { name: "Shopping", icon: ShoppingBag, color: "text-emerald-400" },
    { name: "Real Estate", icon: Home, color: "text-blue-400" },
    { name: "Dating", icon: Heart, color: "text-rose-400" },
    { name: "Food", icon: Utensils, color: "text-orange-400" },
    { name: "Drinks", icon: Coffee, color: "text-amber-400" },
    { name: "Supermarket", icon: Store, color: "text-purple-400" },
    { name: "Ads", icon: Megaphone, color: "text-yellow-400" },
    { name: "Work", icon: Briefcase, color: "text-indigo-400" },
    { name: "News", icon: Newspaper, color: "text-sky-400" },
    { name: "Drivers", icon: Truck, color: "text-zinc-400" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Search Bar */}
      <div className="relative">
        <AIInput 
          onCommand={onCommand}
          onVoiceClick={onVoiceClick}
          isLoading={isLoading}
          isListening={isListening}
          lastReply={lastReply}
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
        <HUDButton 
          icon={<Users className="w-5 h-5" />} 
          onClick={onTeamClick} 
          title="Social Feed" 
          color="text-purple-400" 
          label="Social" 
          isActive={isActive}
        />
        <HUDButton 
          icon={<Euro className="w-5 h-5" />} 
          onClick={onFinancialClick} 
          title="Wallet" 
          color="text-emerald-500" 
          label="Wallet" 
          info={`${balance.toFixed(0)}€`}
          isActive={isActive}
        />
        <HUDButton 
          icon={<UserIcon className="w-5 h-5" />} 
          onClick={onAuthClick} 
          title="Profile" 
          color="text-blue-400" 
          label="Profile" 
          isActive={isActive}
        />
        <HUDButton 
          icon={<Drone className={`w-5 h-5 ${droneStatus === 'on_air' ? 'animate-pulse' : ''}`} />} 
          onClick={onDroneClick} 
          title="Drones" 
          color={droneStatus === 'charged' ? "text-emerald-500" : droneStatus === 'on_air' ? "text-electric-blue glow-blue" : "text-blue-400"} 
          label="Drones"
          info={droneStatus === 'on_air' ? "AIR" : "RDY"}
          isActive={isActive}
        />
        <HUDButton 
          icon={<LocateFixed className="w-5 h-5" />} 
          onClick={onSyncGPS} 
          title="GPS Sync" 
          color="text-emerald-400" 
          label="GPS" 
          isActive={isActive}
        />
      </div>

      {/* System Status Row */}
      <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-3xl">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${systemHealth === 'healthy' ? 'text-emerald-500' : 'text-amber-500'}`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">System Health</p>
            <p className="text-sm font-black text-white uppercase tracking-tight">{healthValue}% Operational</p>
          </div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-electric-blue">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Map Layer</p>
            <p className="text-sm font-black text-white uppercase tracking-tight">Tactical View</p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Search Categories</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest text-electric-blue">Live Network</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {filterConfig.map(f => (
            <button 
              key={f.name}
              onClick={() => onFilterSelect(f.name)}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-electric-blue/10 hover:border-electric-blue/20 transition-all group"
            >
              <f.icon className={`w-6 h-6 ${f.color} group-hover:scale-110 transition-transform`} />
              <span className="text-[8px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors text-center">
                {f.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Monitor className="w-3 h-3 text-white/20" />
          <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Astranov OS v4.2.0</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onConsoleClick} className="text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">System Console</button>
          <button onClick={onDiagnosticClick} className="text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Diagnostics</button>
          <button onClick={onSettingsClick} className="text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Compliance</button>
        </div>
      </div>
    </div>
  );
}
