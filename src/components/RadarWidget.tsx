import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Radar } from 'lucide-react';
import { Task, User, Shop } from '../types';

interface RadarWidgetProps {
  onClose: () => void;
  center: { lat: number; lng: number };
  tasks: Task[];
  users: User[];
  shops: Shop[];
  initialX?: number;
  initialY?: number;
}

export default function RadarWidget({
  onClose,
  center,
  tasks,
  users,
  shops,
  initialX = 20,
  initialY = 100
}: RadarWidgetProps) {
  const [rotation, setRotation] = useState(0);

  // Radar sweep animation
  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setRotation(prev => (prev + 2) % 360);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Calculate position relative to center
  // Radar radius in degrees (approx 5km)
  const RADAR_RADIUS = 0.05; 

  const getRelativePosition = (lat: number, lng: number) => {
    const dLat = lat - center.lat;
    const dLng = lng - center.lng;
    
    // Distance from center
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    
    // If outside radar, clamp to edge
    let normalizedDist = dist / RADAR_RADIUS;
    if (normalizedDist > 1) normalizedDist = 1;

    // Angle
    const angle = Math.atan2(dLng, dLat);

    // Map to 0-100% for CSS top/left
    // Center is 50%, 50%
    const x = 50 + (Math.sin(angle) * normalizedDist * 50);
    const y = 50 - (Math.cos(angle) * normalizedDist * 50); // - because top is 0

    return { left: `${x}%`, top: `${y}%` };
  };

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
        <div className="absolute -inset-1 bg-gradient-to-r from-electric-blue to-green-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative flex flex-col items-center p-4 bg-zinc-900/90 border border-white/10 rounded-full backdrop-blur-xl shadow-2xl w-48 h-48">
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-bad/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
          >
            <X className="w-3 h-3" />
          </button>
          
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest text-electric-blue z-20 bg-black/50 px-2 py-0.5 rounded-full">
            Radar
          </div>

          {/* Radar Background */}
          <div className="absolute inset-4 rounded-full border border-electric-blue/30 bg-black overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 border border-electric-blue/20 rounded-full m-4"></div>
            <div className="absolute inset-0 border border-electric-blue/20 rounded-full m-8"></div>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-electric-blue/20"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-electric-blue/20"></div>

            {/* Sweep */}
            <div 
              className="absolute top-1/2 left-1/2 w-1/2 h-1/2 origin-top-left border-l border-electric-blue/80"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                background: 'conic-gradient(from 180deg at 0 0, transparent 0deg, rgba(0, 210, 255, 0.4) 90deg, transparent 90deg)'
              }}
            ></div>

            {/* Center dot (Me) */}
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-white shadow-[0_0_5px_#fff] z-10"></div>

            {/* Tasks */}
            {tasks.filter(t => t.status !== 'completed').map(task => (
              <div 
                key={task.id}
                className="absolute w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-yellow-400 shadow-[0_0_5px_#facc15]"
                style={getRelativePosition(task.lat, task.lng)}
              ></div>
            ))}

            {/* Shops */}
            {shops.map(shop => (
              <div 
                key={shop.id}
                className="absolute w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-purple-500 shadow-[0_0_5px_#a855f7]"
                style={getRelativePosition(shop.lat, shop.lng)}
              ></div>
            ))}

            {/* Users */}
            {users.map(user => (
              <div 
                key={user.id}
                className={`absolute w-1 h-1 -ml-[2px] -mt-[2px] rounded-full ${user.role === 'deliverer' ? 'bg-electric-blue shadow-[0_0_5px_#00d2ff]' : 'bg-zinc-400'}`}
                style={getRelativePosition(user.lat, user.lng)}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
