import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface HudButtonProps {
  icon: LucideIcon;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  status?: 'healthy' | 'warning' | 'problem' | 'finance' | 'ok' | 'bad' | 'warn';
  data?: string;
}

export const HudButton: React.FC<HudButtonProps> = ({
  icon: Icon,
  onClick,
  active = false,
  label,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  status,
  data,
}) => {
  const baseStyles = "relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 backdrop-blur-md border group";
  
  const sizeStyles = {
    sm: "w-8 h-8 sm:w-10 sm:h-10 p-1.5 sm:p-2",
    md: "w-10 h-10 sm:w-12 sm:h-12 p-2 sm:p-3",
    lg: "w-12 h-12 sm:w-14 sm:h-14 p-3 sm:p-4",
    xl: "w-14 h-14 sm:w-16 sm:h-16 p-3 sm:p-4",
  };

  const getStatusStyles = () => {
    if (disabled) return "bg-black/20 border-white/5 text-white/10";
    
    switch (status) {
      case 'healthy':
      case 'ok': return active 
        ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]" 
        : "bg-black/40 border-white/10 text-white/70 hover:bg-black/60 hover:border-blue-500/30 hover:text-blue-400";
      case 'warning':
      case 'warn': return active
        ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
        : "bg-black/40 border-amber-500/20 text-amber-500/70 hover:bg-black/60 hover:border-amber-500/50 hover:text-amber-400";
      case 'problem':
      case 'bad': return active
        ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
        : "bg-black/40 border-rose-500/20 text-rose-500/70 hover:bg-black/60 hover:border-rose-500/50 hover:text-rose-400";
      case 'finance': return active
        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
        : "bg-black/40 border-emerald-500/20 text-emerald-500/70 hover:bg-black/60 hover:border-emerald-500/50 hover:text-emerald-400";
      default: return active
        ? "bg-electric-blue/20 border-electric-blue text-electric-blue shadow-[0_0_20px_rgba(0,210,255,0.4)]"
        : "bg-black/40 border-white/10 text-white/70 hover:bg-black/60 hover:border-white/20 hover:text-white";
    }
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05, y: -2 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        ${baseStyles} 
        ${sizeStyles[size]} 
        ${getStatusStyles()}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <Icon className={`${data ? 'w-5 h-5 mb-0.5' : 'w-full h-full'}`} />
      
      {data && (
        <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter opacity-90 leading-none">
          {data}
        </span>
      )}

      {label && (
        <div className="absolute left-full ml-4 px-3 py-1.5 bg-black/90 text-[9px] font-black text-white uppercase tracking-[0.2em] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap border border-white/10 shadow-2xl z-[100]">
          {label}
        </div>
      )}

      {/* Status Dot */}
      {status && (
        <div className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
          (status === 'healthy' || status === 'ok') ? 'bg-blue-400' :
          (status === 'warning' || status === 'warn') ? 'bg-amber-400' :
          (status === 'problem' || status === 'bad') ? 'bg-rose-400' :
          'bg-emerald-400'
        } shadow-[0_0_5px_currentColor]`} />
      )}
    </motion.button>
  );
};
