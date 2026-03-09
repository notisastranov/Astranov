import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, Clock, Image as ImageIcon, X, MapPin } from 'lucide-react';

interface ShopSetupProps {
  onComplete: (details: { name: string; description: string; schedule: string }) => void;
  onCancel: () => void;
}

export default function ShopSetup({ onComplete, onCancel }: ShopSetupProps) {
  const [details, setDetails] = useState({ 
    name: '', 
    description: '', 
    open: '09:00', 
    close: '21:00' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      name: details.name,
      description: details.description,
      schedule: JSON.stringify({ open: details.open, close: details.close })
    });
  };

  return (
    <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-zinc-900/95 backdrop-blur-xl z-[1500] border-l border-white/10 shadow-2xl overflow-y-auto pointer-events-auto">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="h-full flex flex-col"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-800/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-white text-xl font-black uppercase italic tracking-tighter">Shop Activation</h2>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Business Profile</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-white/20 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2 font-bold">Business Name</label>
              <input 
                required 
                value={details.name}
                onChange={e => setDetails({...details, name: e.target.value})}
                className="w-full bg-black hover:bg-black focus:bg-black border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-purple-500/50 transition-all"
                placeholder="e.g. The Galactic Bakery"
              />
            </div>
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2 font-bold">Description</label>
              <textarea 
                required 
                rows={3}
                value={details.description}
                onChange={e => setDetails({...details, description: e.target.value})}
                className="w-full bg-black hover:bg-black focus:bg-black border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-purple-500/50 transition-all resize-none"
                placeholder="What do you sell?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2 font-bold">Opening Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="time"
                    required 
                    value={details.open}
                    onChange={e => setDetails({...details, open: e.target.value})}
                    className="w-full bg-black hover:bg-black focus:bg-black border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white outline-none focus:border-purple-500/50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2 font-bold">Closing Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="time"
                    required 
                    value={details.close}
                    onChange={e => setDetails({...details, close: e.target.value})}
                    className="w-full bg-black hover:bg-black focus:bg-black border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white outline-none focus:border-purple-500/50 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4 flex items-start gap-3">
            <MapPin className="w-4 h-4 text-purple-500 mt-1" />
            <p className="text-white/40 text-[10px] leading-relaxed">
              Your shop will be pinned to your current location. Ensure you are at your business premises before completing activation.
            </p>
          </div>

          <button 
            className="w-full bg-purple-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            Activate Shop
          </button>
        </form>
      </motion.div>
    </div>
  );
}
