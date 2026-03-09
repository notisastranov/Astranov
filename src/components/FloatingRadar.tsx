import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import { Radar } from 'lucide-react';
import { Task, User, Shop } from '../types';

interface FloatingRadarProps {
  tasks: Task[];
  users: User[];
  shops: Shop[];
  center: { lat: number; lng: number };
  onClick: () => void;
}

export default function FloatingRadar({ tasks, users, shops, center, onClick, className = "", draggable = false }: FloatingRadarProps & { className?: string, draggable?: boolean }) {
  const [rotation, setRotation] = useState(0);
  
  // Load persisted position
  const savedPos = JSON.parse(localStorage.getItem('astranov_floating_radar_pos') || '{}');
  const x = useMotionValue(savedPos.x ?? 0);
  const y = useMotionValue(savedPos.y ?? 0);

  const handleDragEnd = () => {
    if (!draggable) return;
    localStorage.setItem('astranov_floating_radar_pos', JSON.stringify({
      x: x.get(),
      y: y.get()
    }));
  };

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setRotation(prev => (prev + 3) % 360);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const RADAR_RADIUS = 0.05;
  const getRelativePosition = (lat: number, lng: number) => {
    const dLat = lat - center.lat;
    const dLng = lng - center.lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    let normalizedDist = dist / RADAR_RADIUS;
    if (normalizedDist > 1) normalizedDist = 1;
    const angle = Math.atan2(dLng, dLat);
    const x = 50 + (Math.sin(angle) * normalizedDist * 50);
    const y = 50 - (Math.cos(angle) * normalizedDist * 50);
    return { left: `${x}%`, top: `${y}%` };
  };

  return (
    <motion.div 
      drag={draggable}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={`relative w-full h-full bg-black/40 backdrop-blur-xl border border-electric-blue/30 rounded-full shadow-[0_0_20px_rgba(0,210,255,0.2)] cursor-pointer overflow-hidden group ${className}`}
      style={{ x: draggable ? x : 0, y: draggable ? y : 0 }}
    >
      {/* Compass Markers */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-electric-blue">N</span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-electric-blue">S</span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-electric-blue">W</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-electric-blue">E</span>
      </div>

      {/* Grid Rings */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-[25%] border border-electric-blue rounded-full" />
        <div className="absolute inset-[50%] border border-electric-blue rounded-full" />
        <div className="absolute inset-[75%] border border-electric-blue rounded-full" />
      </div>

      {/* Sweep */}
      <div 
        className="absolute top-1/2 left-1/2 w-full h-full origin-top-left border-l border-electric-blue/40"
        style={{ 
          transform: `rotate(${rotation}deg)`,
          background: 'conic-gradient(from 180deg at 0 0, transparent 0deg, rgba(0, 210, 255, 0.2) 90deg, transparent 90deg)'
        }}
      />
      
      {/* Mini Dots */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from(new Map(tasks.filter(t => t.status !== 'completed').slice(0, 3).map(t => [t.id, t])).values()).map(task => (
          <div key={task.id} className="absolute w-1 h-1 -ml-0.5 -mt-0.5 rounded-full bg-yellow-400" style={getRelativePosition(task.lat, task.lng)} />
        ))}
        {Array.from(new Map(users.slice(0, 3).map(u => [u.id, u])).values()).map(user => (
          <div key={user.id} className={`absolute w-0.5 h-0.5 -ml-0.25 -mt-0.25 rounded-full ${user.role === 'deliverer' ? 'bg-electric-blue' : 'bg-zinc-500'}`} style={getRelativePosition(user.lat, user.lng)} />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <Radar className="w-5 h-5 text-electric-blue/40 group-hover:text-electric-blue transition-colors" />
      </div>
      
      {/* Pulse effect */}
      <div className="absolute inset-0 rounded-full border border-electric-blue/20 animate-ping opacity-20" />
    </motion.div>
  );
}
