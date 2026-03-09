import React, { useState, useEffect } from 'react';
import { motion, useDragControls, useMotionValue } from 'motion/react';
import { X, ChevronUp, ChevronDown, GripHorizontal } from 'lucide-react';
import { Task, User, Shop } from '../types';

interface RadarWidgetProps {
  tasks: Task[];
  users: User[];
  shops: Shop[];
  center: { lat: number; lng: number };
  onClose: () => void;
}

export default function RadarWidget({ tasks, users, shops, center, onClose }: RadarWidgetProps) {
  const [rotation, setRotation] = useState(0);
  const [heading, setHeading] = useState(0); // Compass heading in degrees
  
  // Load persisted state
  const savedState = JSON.parse(localStorage.getItem('astranov_radar_state') || '{}');
  const [size, setSize] = useState(savedState.size || 320);
  
  const dragControls = useDragControls();
  const x = useMotionValue(savedState.x ?? (window.innerWidth - (savedState.size || 320) - 24));
  const y = useMotionValue(savedState.y ?? (window.innerHeight - (savedState.size || 320) - 24));

  // Persist size changes
  useEffect(() => {
    const currentState = JSON.parse(localStorage.getItem('astranov_radar_state') || '{}');
    localStorage.setItem('astranov_radar_state', JSON.stringify({
      ...currentState,
      size,
      x: x.get(),
      y: y.get()
    }));
  }, [size]);

  const handleDragEnd = () => {
    const currentState = JSON.parse(localStorage.getItem('astranov_radar_state') || '{}');
    localStorage.setItem('astranov_radar_state', JSON.stringify({
      ...currentState,
      x: x.get(),
      y: y.get()
    }));
  };

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setRotation(prev => (prev + 2) % 360);
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
    
    // Adjust angle by heading for the entities
    const angle = Math.atan2(dLng, dLat) - (heading * Math.PI / 180);
    
    const x = 50 + (Math.sin(angle) * normalizedDist * 50);
    const y = 50 - (Math.cos(angle) * normalizedDist * 50);
    return { left: `${x}%`, top: `${y}%` };
  };

  const compassPoints = [
    { label: 'N', angle: 0 },
    { label: 'E', angle: 90 },
    { label: 'S', angle: 180 },
    { label: 'W', angle: 270 },
  ];

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed top-0 left-0 z-[2000] pointer-events-auto cursor-move group"
      style={{ width: size, height: size, x, y }}
    >
      {/* Outer Compass Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-electric-blue/30 shadow-[0_0_20px_rgba(0,210,255,0.2)]">
        <div 
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          {compassPoints.map(p => (
            <div 
              key={p.label}
              className="absolute top-0 left-1/2 -translate-x-1/2 h-full flex flex-col items-center"
              style={{ transform: `rotate(${p.angle}deg)` }}
            >
              <span className={`text-[11px] font-black mt-0.5 select-none ${p.label === 'N' ? 'text-red-500' : 'text-white/80'}`}>
                {p.label}
              </span>
              <div className={`w-0.5 h-1.5 ${p.label === 'N' ? 'bg-red-500' : 'bg-white/40'} mt-0.5`} />
            </div>
          ))}
          
          {/* Degree Ticks */}
          {[...Array(24)].map((_, i) => (
            <div 
              key={i}
              className="absolute top-0 left-1/2 -translate-x-1/2 h-full"
              style={{ transform: `rotate(${i * 15}deg)` }}
            >
              <div className={`w-px ${i % 2 === 0 ? 'h-1.5 bg-white/20' : 'h-1 bg-white/10'} mt-4`} />
            </div>
          ))}
        </div>
      </div>

      {/* Internal Radar Content */}
      <div className="absolute inset-6 rounded-full bg-black/40 backdrop-blur-md overflow-hidden border border-white/10">
        {/* Rotating Grid & Sweep */}
        <div 
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          {/* Grid Lines */}
          <div className="absolute inset-0 border border-electric-blue/10 rounded-full m-[15%]"></div>
          <div className="absolute inset-0 border border-electric-blue/10 rounded-full m-[30%]"></div>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-electric-blue/10"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-electric-blue/10"></div>

          {/* Sweep */}
          <div 
            className="absolute top-1/2 left-1/2 w-1/2 h-1/2 origin-top-left border-l border-electric-blue/60 z-10"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              background: 'conic-gradient(from 180deg at 0 0, transparent 0deg, rgba(0, 210, 255, 0.2) 90deg, transparent 90deg)'
            }}
          />
        </div>

        {/* Entities (Dots) - Adjusted for heading */}
        <div className="absolute inset-0 pointer-events-none">
          {tasks.filter(t => t.status !== 'completed').map(task => (
            <div key={task.id} className="absolute w-1.5 h-1.5 -ml-0.75 -mt-0.75 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15] z-20 animate-pulse" style={getRelativePosition(task.lat, task.lng)} />
          ))}
          {shops.map(shop => (
            <div key={shop.id} className="absolute w-1.5 h-1.5 -ml-0.75 -mt-0.75 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] z-20" style={getRelativePosition(shop.lat, shop.lng)} />
          ))}
          {users.map(user => (
            <div key={user.id} className={`absolute w-1 h-1 -ml-0.5 -mt-0.5 rounded-full z-20 ${user.role === 'deliverer' ? 'bg-electric-blue shadow-[0_0_8px_#00d2ff]' : 'bg-zinc-500'}`} style={getRelativePosition(user.lat, user.lng)} />
          ))}
        </div>

        {/* Center (User) */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full bg-white shadow-[0_0_10px_#fff] z-30" />
      </div>

      {/* Subtle Close Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-black/60 border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-red-500/40 transition-all opacity-0 group-hover:opacity-100 z-[2100]"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Heading Control (Invisible overlay to rotate compass with scroll or specific gesture) */}
      <div 
        className="absolute inset-0 rounded-full z-[2050]"
        onWheel={(e) => {
          setHeading(prev => (prev + e.deltaY * 0.1) % 360);
        }}
      />

      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-electric-blue/40 rounded-tl-full z-[2100] opacity-0 group-hover:opacity-100"
        onPointerDownCapture={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          e.stopPropagation();
          const startX = e.clientX;
          const startSize = size;
          const onMouseMove = (moveEvent: MouseEvent) => {
            const newSize = Math.max(100, Math.min(500, startSize + (moveEvent.clientX - startX)));
            setSize(newSize);
          };
          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }}
      />
    </motion.div>
  );
}
