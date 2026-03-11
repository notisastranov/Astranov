import React from 'react';
import { motion } from 'motion/react';
import { Power, Satellite, Layers, Filter, Crosshair, Navigation, Radar } from 'lucide-react';

interface RightHUDProps {
  activeMenu: string | null;
  onMenuOpen: (e: React.MouseEvent, id: string) => void;
  isPoweredOn: boolean;
  routingDestination: any;
  isRouting: boolean;
  handleSyncGPS: () => void;
}

export const RightHUD: React.FC<RightHUDProps> = ({
  activeMenu,
  onMenuOpen,
  isPoweredOn,
  routingDestination,
  isRouting,
  handleSyncGPS
}) => {
  return (
    <div className="flex flex-col gap-2 pointer-events-auto">
      <HudButton 
        icon={<Power className="w-4 h-4" />} 
        label="Power" 
        onClick={(e) => onMenuOpen(e, 'power')}
        status={isPoweredOn ? 'healthy' : 'problem'}
        active={activeMenu === 'power'}
      />
      <HudButton 
        icon={<Satellite className="w-4 h-4" />} 
        label="Network" 
        onClick={(e) => onMenuOpen(e, 'network')}
        active={activeMenu === 'network'}
      />
      <HudButton 
        icon={<Layers className="w-4 h-4" />} 
        label="Layers" 
        onClick={(e) => onMenuOpen(e, 'layers')} 
        active={activeMenu === 'layers'}
      />
      <HudButton 
        icon={<Filter className="w-4 h-4" />} 
        label="Filters" 
        onClick={(e) => onMenuOpen(e, 'filters')} 
        active={activeMenu === 'filters'}
      />
      <HudButton 
        icon={<Crosshair className="w-4 h-4" />} 
        label="Locate" 
        onClick={(e) => {
          handleSyncGPS();
          onMenuOpen(e, 'locate');
        }} 
        active={activeMenu === 'locate'}
      />
      <HudButton 
        icon={<Navigation className="w-4 h-4" />} 
        label="Route" 
        onClick={(e) => onMenuOpen(e, 'route')}
        status={routingDestination ? 'healthy' : 'warning'}
        active={activeMenu === 'route'}
        data={isRouting ? "ACT" : (routingDestination ? "RDY" : "IDL")}
      />
      <HudButton 
        icon={<Radar className="w-4 h-4" />} 
        label="Scanner" 
        onClick={(e) => onMenuOpen(e, 'scanner')} 
        active={activeMenu === 'scanner'} 
      />
    </div>
  );
};

interface HudButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  status?: 'healthy' | 'warning' | 'problem' | 'ok' | 'finance';
  data?: string;
}

const HudButton: React.FC<HudButtonProps> = ({ icon, label, onClick, active, status, data }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-lg transition-all shadow-xl relative group
        ${active 
          ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
          : 'bg-zinc-950/95 backdrop-blur-xl border border-white/5 text-white/40 hover:text-white hover:bg-zinc-900/95'}
      `}
    >
      <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
        {icon}
      </div>
      
      {/* Tooltip-like label on hover for desktop */}
      <span className="absolute right-full mr-3 px-2 py-1 bg-black/95 text-[7px] text-white uppercase font-black tracking-[0.2em] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10">
        {label}
      </span>

      {data && (
        <span className="absolute -bottom-1 -left-1 text-[6px] font-mono px-1 rounded-sm bg-black/80 border border-white/5 text-white/30">
          {data}
        </span>
      )}

      {status && status !== 'ok' && status !== 'finance' && (
        <div className={`absolute top-1 right-1 w-1 h-1 rounded-full ${
          status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' :
          status === 'warning' ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]' :
          'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]'
        }`} />
      )}
    </motion.button>
  );
};
