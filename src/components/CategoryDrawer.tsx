import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Shield, ArrowUpRight, Menu, Power, Settings, Gamepad2 } from 'lucide-react';
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
  onLoginClick?: () => void;
  onComplianceClick?: () => void;
  onSettingsClick?: () => void;
  onGamesClick?: () => void;
  isAuthenticated: boolean;
}

export default function CategoryDrawer({ 
  isOpen, onClose, onSelectCategory, onSpawnWidget,
  balance, userName, userId, networkStatus, deviceInfo,
  onToggleStatus, isActive, currentRole, onRoleChange,
  isVerifiedDriver, hasShop, onLoginClick, onComplianceClick,
  onSettingsClick, onGamesClick, isAuthenticated
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
        <div className="fixed inset-0 z-[2000] pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const catName = e.dataTransfer.getData('text/plain');
              if (catName) {
                const cat = INITIAL_CATEGORIES.find(c => c.name === catName);
                if (cat) {
                  onSpawnWidget?.(cat);
                  onClose();
                }
              }
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
          />

          {/* Side Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-full sm:w-[450px] bg-zinc-900/90 border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 flex justify-between items-center border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-electric-blue/20 flex items-center justify-center text-electric-blue">
                  <Menu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest italic">Astranov</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">System Center</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-8">
              {/* Categories / Widgets */}
              <section className="space-y-4">
                <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/20">Available Modules</h3>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(cat => (
                    <button 
                      key={cat.name}
                      onClick={() => { onSpawnWidget?.(cat); onClose(); }}
                      className="group relative flex flex-col items-center justify-center gap-3 p-8 rounded-3xl border border-white/10 bg-white/5 hover:border-electric-blue/40 hover:bg-electric-blue/5 transition-all active:scale-[0.98]"
                    >
                      <cat.icon className="w-8 h-8 text-white/60 group-hover:text-white transition-colors" />
                      <span className="text-white text-[12px] uppercase tracking-widest font-black">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
