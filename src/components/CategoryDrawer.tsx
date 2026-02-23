import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Shield } from 'lucide-react';
import StatusRibbon from './StatusRibbon';
import { UserRole } from '../types';
import { CATEGORIES as INITIAL_CATEGORIES } from '../constants';

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (name: string) => void;
  onSpawnWidget?: (category: any) => void;
  balance: number;
  userName: string;
  userId: string;
  networkStatus: 'ok' | 'warn' | 'bad';
  deviceInfo: string;
  onToggleStatus: (active: boolean) => void;
  isActive: boolean;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isVerifiedDriver: boolean;
  hasShop: boolean;
}

export default function CategoryDrawer({ 
  isOpen, onClose, onSelectCategory, onSpawnWidget,
  balance, userName, userId, networkStatus, deviceInfo,
  onToggleStatus, isActive, currentRole, onRoleChange,
  isVerifiedDriver, hasShop
}: CategoryDrawerProps) {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [draggedCat, setDraggedCat] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('astranov-categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = parsed.map((p: any) => INITIAL_CATEGORIES.find(c => c.name === p.name)).filter(Boolean);
        INITIAL_CATEGORIES.forEach(c => {
          if (!merged.find((m: any) => m.name === c.name)) merged.push(c);
        });
        setCategories(merged);
      } catch (e) {}
    }
  }, []);

  const saveCategories = (cats: any[]) => {
    setCategories(cats);
    localStorage.setItem('astranov-categories', JSON.stringify(cats.map(c => ({ name: c.name }))));
  };

  const handleDragStart = (e: React.DragEvent, cat: any) => {
    e.dataTransfer.setData('text/plain', cat.name);
    setDraggedCat(cat.name);
  };

  const handleDragOver = (e: React.DragEvent, targetCat: any) => {
    e.preventDefault();
    if (!draggedCat || draggedCat === targetCat.name) return;
    
    const draggedIdx = categories.findIndex(c => c.name === draggedCat);
    const targetIdx = categories.findIndex(c => c.name === targetCat.name);
    
    const newCats = [...categories];
    const [removed] = newCats.splice(draggedIdx, 1);
    newCats.splice(targetIdx, 0, removed);
    setCategories(newCats);
  };

  const handleDragEnd = () => {
    setDraggedCat(null);
    saveCategories(categories);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.stopPropagation();
  };

  const handleTouchStart = (cat: any) => {
    const timer = setTimeout(() => {
      onSpawnWidget?.(cat);
      onClose();
    }, 600);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          className="w-full rounded-[32px] bg-zinc-900/95 border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl flex flex-col max-h-[80vh]"
        >
          <div className="p-4 sm:p-6 flex justify-between items-center border-b border-white/5 shrink-0">
            <div>
              <h3 className="text-white font-black text-lg uppercase tracking-[0.2em] italic">Astranov</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">Select a service or long-press to pin</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="w-10 h-10 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1">
            <div className="p-4 sm:p-6 border-b border-white/5">
              <StatusRibbon 
                balance={balance}
                userName={userName}
                userId={userId}
                networkStatus={networkStatus}
                deviceInfo={deviceInfo}
                onToggleStatus={onToggleStatus}
                isActive={isActive}
                currentRole={currentRole}
                onRoleChange={onRoleChange}
                isVerifiedDriver={isVerifiedDriver}
                hasShop={hasShop}
              />
            </div>

            <div 
              className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {categories.map((cat) => (
              <button
                key={cat.name}
                draggable
                onDragStart={(e) => handleDragStart(e, cat)}
                onDragOver={(e) => handleDragOver(e, cat)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectCategory?.(cat.name)}
                onMouseDown={() => handleTouchStart(cat)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={() => handleTouchStart(cat)}
                onTouchEnd={handleTouchEnd}
                className={`group relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/5 hover:border-electric-blue/30 hover:bg-electric-blue/5 transition-all active:scale-[0.98] cursor-grab active:cursor-grabbing ${draggedCat === cat.name ? 'opacity-50' : ''}`}
              >
                <cat.icon className={`w-6 h-6 ${cat.color} group-hover:scale-110 transition-transform pointer-events-none`} />
                <span className="text-white text-[10px] uppercase tracking-widest font-black pointer-events-none">{cat.name}</span>
                <div className="absolute inset-0 rounded-2xl bg-electric-blue/0 group-hover:bg-electric-blue/5 transition-colors pointer-events-none" />
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6 flex gap-3 sm:gap-4 border-t border-white/5 bg-black/20 shrink-0">
              <button className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 text-white text-[10px] uppercase tracking-widest font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" /> Billing
              </button>
              <button className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 text-white text-[10px] uppercase tracking-widest font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" /> Security
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
