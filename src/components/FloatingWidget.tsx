import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface FloatingWidgetProps {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  data?: string;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
}

export default function FloatingWidget({ 
  id, 
  name, 
  icon: Icon, 
  color, 
  data, 
  onClose,
  initialX = 100,
  initialY = 100
}: FloatingWidgetProps) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: initialX, y: initialY, opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-[1500] pointer-events-auto cursor-grab active:cursor-grabbing"
      style={{ top: 0, left: 0 }}
    >
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-electric-blue to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex flex-col items-center gap-2 p-4 bg-zinc-900/90 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl min-w-[100px]">
          <button 
            onClick={onClose}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-bad/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
          
          <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          
          <div className="text-center">
            <p className="text-white text-[10px] uppercase tracking-widest font-black">{name}</p>
            {data && (
              <p className="text-electric-blue text-[9px] font-mono mt-1">{data}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
