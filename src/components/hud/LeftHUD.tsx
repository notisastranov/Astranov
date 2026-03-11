import React from 'react';
import { motion } from 'motion/react';
import { Settings, User, Wallet, Plus, Users, Truck, Activity } from 'lucide-react';

interface LeftHUDProps {
  activeMenu: string | null;
  onMenuOpen: (e: React.MouseEvent, id: string) => void;
  isAuthenticated: boolean;
  balance: string;
  channelMode: string;
  fleetMode: string;
  systemHealth: string;
  healthValue: number;
}

export const LeftHUD: React.FC<LeftHUDProps> = ({
  activeMenu,
  onMenuOpen,
  isAuthenticated,
  balance,
  channelMode,
  fleetMode,
  systemHealth,
  healthValue
}) => {
  return (
    <div className="flex flex-col gap-2 pointer-events-auto">
      <HudButton 
        icon={<Settings className="w-4 h-4" />} 
        label="Settings" 
        onClick={(e) => onMenuOpen(e, 'settings')} 
        active={activeMenu === 'settings'}
      />
      <HudButton 
        icon={<User className="w-4 h-4" />} 
        label={isAuthenticated ? "Profile" : "Login"} 
        onClick={(e) => onMenuOpen(e, 'profile')}
        status={isAuthenticated ? 'healthy' : 'warning'}
        active={activeMenu === 'profile'}
      />
      <HudButton 
        icon={<Wallet className="w-4 h-4" />} 
        label="Wallet" 
        onClick={(e) => onMenuOpen(e, 'wallet')} 
        data={balance}
        status="finance"
        active={activeMenu === 'wallet'}
      />
      <HudButton 
        icon={<Plus className="w-4 h-4" />} 
        label="Post" 
        onClick={(e) => onMenuOpen(e, 'post')} 
        variant="primary" 
        active={activeMenu === 'post'}
      />
      <HudButton 
        icon={<Users className="w-4 h-4" />} 
        label="Channel" 
        onClick={(e) => onMenuOpen(e, 'channel')}
        data={channelMode}
        active={activeMenu === 'channel'}
      />
      <HudButton 
        icon={<Truck className="w-4 h-4" />} 
        label="Fleet" 
        onClick={(e) => onMenuOpen(e, 'fleet')}
        data={fleetMode}
        active={activeMenu === 'fleet'}
      />
      <HudButton 
        icon={<Activity className="w-4 h-4" />} 
        label="Status" 
        onClick={(e) => onMenuOpen(e, 'status')}
        status={systemHealth === 'healthy' ? 'healthy' : 'problem'}
        data={`${healthValue}%`}
        active={activeMenu === 'status'}
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
  variant?: 'default' | 'primary';
}

const HudButton: React.FC<HudButtonProps> = ({ icon, label, onClick, active, status, data, variant }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-lg transition-all shadow-xl relative group
        ${active 
          ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
          : variant === 'primary'
            ? 'bg-white text-black font-bold hover:bg-zinc-200'
            : 'bg-zinc-950/95 backdrop-blur-xl border border-white/5 text-white/40 hover:text-white hover:bg-zinc-900/95'}
      `}
    >
      <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
        {icon}
      </div>
      
      {/* Tooltip-like label on hover for desktop */}
      <span className="absolute left-full ml-3 px-2 py-1 bg-black/95 text-[7px] text-white uppercase font-black tracking-[0.2em] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10">
        {label}
      </span>

      {data && (
        <span className={`absolute -bottom-1 -right-1 text-[6px] font-mono px-1 rounded-sm bg-black/80 border border-white/5 ${status === 'finance' ? 'text-emerald-400' : 'text-white/30'}`}>
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
