import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Navigation, 
  MapPin, 
  Info, 
  Briefcase,
  X
} from 'lucide-react';

interface MapContextMenuProps {
  lat: number;
  lng: number;
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
}

export const MapContextMenu: React.FC<MapContextMenuProps> = ({
  lat,
  lng,
  x,
  y,
  onClose,
  onAction
}) => {
  const actions = [
    { id: 'post', label: 'Post here', icon: <Plus className="w-4 h-4" /> },
    { id: 'what_is_here', label: 'What is here?', icon: <Info className="w-4 h-4" /> },
    { id: 'create_task', label: 'Create task here', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'navigate', label: 'Navigate here', icon: <Navigation className="w-4 h-4" /> },
    { id: 'search_nearby', label: 'Search nearby', icon: <Search className="w-4 h-4" /> },
    { id: 'open_coords', label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      style={{ left: x, top: y }}
      className="fixed z-[1000] pointer-events-auto"
    >
      <div className="bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[200px]">
        <div className="flex justify-between items-center px-4 py-2 border-bottom border-white/5 bg-white/5">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Location Actions</span>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="p-1.5">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                onAction(action.id);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all text-left"
            >
              <div className="text-white/40">{action.icon}</div>
              <span className="text-xs font-bold">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
