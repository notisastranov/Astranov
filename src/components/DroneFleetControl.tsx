import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Drone, Battery, Signal, MapPin, Navigation, Activity } from 'lucide-react';

interface Drone {
  id: string;
  name: string;
  status: 'idle' | 'flying' | 'charging' | 'emergency';
  battery: number;
  signal: number;
  location: { lat: number; lng: number };
  task?: string;
}

interface DroneFleetControlProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DroneFleetControl({ isOpen, onClose }: DroneFleetControlProps) {
  const drones: Drone[] = [
    { id: 'DRN-001', name: 'Alpha-1', status: 'flying', battery: 78, signal: 92, location: { lat: 40.7128, lng: -74.0060 }, task: 'Delivery #882' },
    { id: 'DRN-002', name: 'Beta-4', status: 'idle', battery: 100, signal: 98, location: { lat: 40.7150, lng: -74.0080 } },
    { id: 'DRN-003', name: 'Gamma-9', status: 'charging', battery: 12, signal: 85, location: { lat: 40.7100, lng: -74.0040 } },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[85vh] bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
          >
            <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Drone className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-widest italic">Drone Fleet</h2>
                  <p className="text-[8px] sm:text-[10px] text-white/40 uppercase tracking-[0.2em]">Automated Aerial Logistics</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {drones.map(drone => (
                  <div key={drone.id} className="p-6 bg-black/40 border border-white/10 rounded-3xl space-y-4 hover:border-blue-500/30 transition-all group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{drone.name}</h3>
                        <p className="text-[10px] text-white/40 font-mono">{drone.id}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        drone.status === 'flying' ? 'bg-blue-500/20 text-blue-400' :
                        drone.status === 'idle' ? 'bg-emerald-500/20 text-emerald-400' :
                        drone.status === 'charging' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {drone.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white/40">
                          <Battery className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Power</span>
                        </div>
                        <p className="text-sm font-black text-white">{drone.battery}%</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white/40">
                          <Signal className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Signal</span>
                        </div>
                        <p className="text-sm font-black text-white">{drone.signal}%</p>
                      </div>
                    </div>

                    {drone.task && (
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                          <Navigation className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Active Task</span>
                        </div>
                        <p className="text-xs font-bold text-white/80">{drone.task}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/60 transition-all">Telemetry</button>
                      <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all">Manual Override</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="flex gap-4 sm:gap-8 w-full sm:w-auto justify-around sm:justify-start">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                  <div>
                    <p className="text-[6px] sm:text-[8px] text-white/40 uppercase font-black tracking-widest">Health</p>
                    <p className="text-[10px] sm:text-xs font-black text-white">OPTIMAL</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Navigation className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <div>
                    <p className="text-[6px] sm:text-[8px] text-white/40 uppercase font-black tracking-widest">Sorties</p>
                    <p className="text-[10px] sm:text-xs font-black text-white">12 UNITS</p>
                  </div>
                </div>
              </div>
              <button className="w-full sm:w-auto px-6 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                Fleet Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
