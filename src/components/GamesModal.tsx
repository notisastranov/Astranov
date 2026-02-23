import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gamepad2, Trophy, Zap, Target } from 'lucide-react';

interface GamesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GAMES = [
  { id: 'dash', name: 'Delivery Dash', icon: Zap, description: 'Deliver as many packages as possible in 30 seconds.', color: 'bg-orange-500' },
  { id: 'tycoon', name: 'City Tycoon', icon: Trophy, description: 'Build your delivery empire and dominate the city.', color: 'bg-electric-blue' },
  { id: 'slicer', name: 'Pizza Slicer', icon: Target, description: 'Slice pizzas with precision to earn bonus tips.', color: 'bg-red-500' },
];

export default function GamesModal({ isOpen, onClose }: GamesModalProps) {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/50 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-500">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-white text-2xl font-black uppercase tracking-tighter italic">Astranov Arcade</h2>
                  <p className="text-white/40 text-xs uppercase tracking-widest">Earn bonus credits through challenges</p>
                </div>
              </div>
              <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {!activeGame ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {GAMES.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => setActiveGame(game.id)}
                      className="group relative flex flex-col p-6 rounded-[32px] border border-white/5 bg-white/5 hover:border-white/20 transition-all text-left overflow-hidden"
                    >
                      <div className={`w-14 h-14 rounded-2xl ${game.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                        <game.icon className="w-7 h-7" />
                      </div>
                      <h3 className="text-white text-xl font-black uppercase tracking-tight mb-2 italic">{game.name}</h3>
                      <p className="text-white/40 text-sm leading-relaxed mb-8">{game.description}</p>
                      <div className="mt-auto flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest">
                        Play Now <Zap className="w-3 h-3 text-electric-blue" />
                      </div>
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <game.icon className="w-24 h-24" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 animate-bounce">
                    <span className="text-6xl">🎮</span>
                  </div>
                  <h3 className="text-white text-3xl font-black uppercase tracking-tighter italic mb-4">Loading {GAMES.find(g => g.id === activeGame)?.name}...</h3>
                  <p className="text-white/40 max-w-md mb-12">
                    Establishing secure arcade connection. Your progress will be synced with your Astranov account.
                  </p>
                  <button 
                    onClick={() => setActiveGame(null)}
                    className="px-8 py-4 rounded-2xl border border-white/10 text-white/60 hover:text-white transition-colors uppercase text-xs font-black tracking-widest"
                  >
                    Back to Arcade
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 bg-black/40 border-t border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest">Global Rank</span>
                  <span className="text-white font-black italic tracking-tighter">#1,242</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest">Arcade Points</span>
                  <span className="text-electric-blue font-black italic tracking-tighter">12,450 AP</span>
                </div>
              </div>
              <div className="text-[10px] text-white/20 uppercase tracking-widest font-black">
                Powered by Astranov Engine v2.4
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
