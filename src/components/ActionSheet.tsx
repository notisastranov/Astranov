import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, MessageSquare, ShoppingBag, Briefcase, Home, Heart, Share2, Newspaper, Tag, Navigation } from 'lucide-react';

interface ActionSheetProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onAction: (action: string) => void;
}

const ACTIONS = [
  { id: 'shop', icon: ShoppingBag, label: 'Shop & Food', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'work', icon: Briefcase, label: 'E-Work', color: 'text-electric-blue', bg: 'bg-electric-blue/10' },
  { id: 'real_estate', icon: Home, label: 'Real Estate', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'dating', icon: Heart, label: 'Dating', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: 'social', icon: Share2, label: 'Social Post', color: 'text-sky-400', bg: 'bg-sky-400/10' },
  { id: 'news', icon: Newspaper, label: 'News Update', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'classifieds', icon: Tag, label: 'Classifieds', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'navigate', icon: Navigation, label: 'Navigate Here', color: 'text-white', bg: 'bg-white/10' },
];

export default function ActionSheet({ lat, lng, onClose, onAction }: ActionSheetProps) {
  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-black/90 backdrop-blur-2xl border-t border-white/10 rounded-t-[32px] z-[3000] p-8 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <MapPin className="w-6 h-6 text-electric-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Location Context</h2>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
              {lat.toFixed(4)}, {lng.toFixed(4)} • Planetary Coordinates
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className="group flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all"
          >
            <div className={`p-4 rounded-2xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest text-center">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-electric-blue/10 border border-electric-blue/20 rounded-2xl p-6 flex items-center gap-4">
        <div className="p-2 rounded-lg bg-electric-blue/20">
          <MessageSquare className="w-5 h-5 text-electric-blue" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-white uppercase tracking-tight">AI Assistant Prompt</p>
          <p className="text-xs text-white/60">"What would you like to do at this location? I can help you find shops, post updates, or search for work."</p>
        </div>
        <button 
          onClick={() => onAction('ai_chat')}
          className="px-6 py-3 bg-electric-blue text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all"
        >
          Ask AI
        </button>
      </div>
    </motion.div>
  );
}
